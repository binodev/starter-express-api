'use strict';
const Mongoose = require('mongoose');

module.exports = class ResourceHelper {
  constructor(model, populateFields, notifier, type) {
    // require('../models/' + (customModel || model.toLowerCase()));
    this.Resource = Mongoose.model(model);
    this.populateFields = populateFields || "";
    this.notifier = notifier;
    this.type = type;
  }

  async findOneByProp (prop, value) {
    return new Promise(async (resolve, reject) => {
      try {
        let resource = await this.Resource.findOne({[prop]: value})
          .populate(this.populateFields);
        return resolve(resource);
      } catch (error) {
        return reject(error);
      }
    });
  };

  async get (id, options) {
    return new Promise(async (resolve, reject) => {
      try {
        let resource = await this.Resource.findOne({_id: id})
          .populate(options.noPopulate ? '' : [...this.populateFields, ...options.additionalPopulate || []])
          .populate('createdBy updatedBy');
        
        resource = this.notifier.postGet(resource);
        
        return resolve(resource);
      } catch (error) {
        return reject(error);
      }
    });
  };

  async list (query = {}, page = 0, size = 15, sort = {}, select = {}, noPopulate = false, additionalPopulate = []) {
    return new Promise(async (resolve, reject) => {
      try {

        query = await this.notifier.preFind(query);

        let resources = await this.Resource.find({...query})
          .populate(noPopulate ? '' : [...this.populateFields, ...additionalPopulate])
          .skip(page * size)
          .limit(size)
          .sort(sort)
          .select(select);
        
        resources = this.notifier.postFind(resources);

        return resolve(resources);
      } catch (error) {
        return reject(error);
      }
    });
  };

  async count (query = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        
        let resources = await this.Resource.count({...query});

        return resolve(resources);
      } catch (error) {
        return reject(error);
      }
    });
  };


  async aggregate (query = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        let groupData = {
          _id: query.discJSON ? JSON.parse(query.discJSON) : query.disc || ''
        };

        query.columns.forEach(col => {
          if (query.type == 'partial' || query.type == 'array') {
            col = JSON.parse(col);
          }

          let label = query.type == 'full' ? col : col.label
          let operation = col.operation || query.operation || 'sum';

          if (query.match) {
            let match = JSON.parse(query.match);
            groupData[label] = { ['$' + operation]: {$cond: [ {$eq: ['$' + match.prop, Mongoose.Types.ObjectId(match.value)]}, '$' + label, 0] }}
          } else if (query.type == 'array') {
            groupData[col.label] = { ['$' + col.operation]: "$" + col.prop }
          } else {
            groupData[label] = { ['$' + operation]: "$" + label }
          }
        });

        let options = [];
        
        if (query.filter) {
          let filter = JSON.parse(query.filter);
          options.push({$match: filter});
        }

        if (query.unwind) {
          query.unwind.forEach(u => {
            options.push({$unwind: '$' + u});
          })
          // let unwind = JSON.parse(query.unwind);
        }

        if (query.filterByDate) {
          let filterByDate = JSON.parse(query.filterByDate);
          options.push({$match: {
            [filterByDate.prop]: {
              $gte: new Date(filterByDate.start),
              $lte: new Date(filterByDate.end),
            }
          }});
        }

        options.push({ $group: groupData });

        if (query.populate) {
          let populate = JSON.parse(query.populate);
          options.push({$lookup: {from: populate.from, localField: populate.local, foreignField: populate.foreign, as: populate.as}})
        }
        
        if (query.sort) {
          let sort = JSON.parse(query.sort);
          options.push({$sort: {[sort.prop]: sort.value}});
        }

        let resources = await this.Resource.aggregate(options);

        return resolve(resources);
      } catch (error) {
        return reject(error);
      }
    });
  };

  async create (resourceData) {
    return new Promise(async (resolve, reject) => {
      try {
        let resource = new this.Resource(resourceData);
        let oldResource = JSON.parse(JSON.stringify(resource));

        resource = await this.notifier.preCreate(resource, this);

        let savedResource = await resource.save();

        this.notifier.postCreate(savedResource, this.type, resourceData);

        return resolve({ statusCode: 200, message: 'Enregistrement réussi', resource: savedResource });
      } catch (error) {
        return reject(error);
      }
    });
  };
  
  async createMany (resourcesData) {
    return new Promise(async (resolve, reject) => {
      try {
        resourcesData = await this.notifier.preCreateMany(resourcesData, this);

        let savedResources = await this.Resource.create(resourcesData);

        this.notifier.postCreateMany(savedResources);

        return resolve({ statusCode: 200, message: 'Enregistrement réussi', resources: savedResources });
      } catch (error) {
        console.log('Error', error);
        return reject(error);
      }
    });
  };
  
  async update (resourceId, resourceData) {
    return new Promise(async (resolve, reject) => {
      try {
        let resource = await this.Resource.findById(resourceId);
        let oldResource = JSON.parse(JSON.stringify(resource));

        resourceData = await this.notifier.preUpdate(resourceData, this);

        for (var prop in resourceData) {
          resource[prop] = resourceData[prop];
        }

        let savedData = await resource.save();

        this.notifier.postUpdate(savedData, oldResource);

        return resolve({
          statusCode: 200,
          resource: savedData,
          message: 'Resource saved successfully'
        });
      } catch (error) {
        reject(error);
      }
    });
  };

  softDelete (model) {
    return new Promise ((res, rej) => {
      model.softdelete(function(err, newValue) {
        if (err) return rej(err);
        return res(newValue)
      })
    })
  }

  async remove (resourceId) {
    return new Promise(async (resolve, reject) => {
      try {
        let toRemoveResource = await this.Resource.findOne({_id: resourceId})//.softdelete();
        let removedResource = await this.Resource.deleteOne({_id: resourceId})//.softdelete();
        this.notifier.postRemove(toRemoveResource, this.type);
        return resolve({ statusCode: 200, message: 'Resource supprimée', resource: removedResource });
      } catch (error) {
        return reject(error);
      }
    });
  };

  async removeMany (resourceIds) {
    return new Promise(async (resolve, reject) => {
      try {
        let removedResource = await this.Resource.deleteMany({
          _id: {
            $in: resourceIds
          }
        })//.softdelete();

        return resolve({ statusCode: 200, message: 'Resource supprimée', resource: removedResource });
      } catch (error) {
        return reject(error);
      }
    });
  };
};