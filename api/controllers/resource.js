'use strict';
const MainService = require('../services/resource');
const FileHelper = require('../lib/file');

module.exports = class ResourceController {
  constructor(model, type, plural, references, auth, validate, notifier, extractor) {
    this.type = type;
    this.plural = plural;
    this.validate = validate;
    this.auth = auth;
    this.service = new MainService(model, references, notifier, type);
    this.extractor = extractor;
  }

  get() {
    return {
      description: 'Returns the ' + this.type + ' info',
      auth: this.auth.get || 'jwt',
      handler: async (request, h) => {
        try {
          return h.response({
            [this.type]: await this.service.get(request.params.resource, request.query)
          }, 200);
        } catch (error) {
          return h.response({ error: error.message }, 500);
        }
      },
      tags: ['api']
    };
  }

  count() {
    return {
      description: 'Returns the count of ' + this.plural,
      auth: this.auth.count || 'jwt',
      handler: async (request, h) => {
        try {
          if (request.query.createdAt) {
            request.query.createdAt = JSON.parse(request.query.createdAt);
          }

          return h.response({
            [this.plural]: await this.service.count(request.query)
          }, 200);
        } catch (error) {
          return h.response({ error: error.message }, 500);
        }
      },
      tags: ['api']
    };
  }

  aggregate() {
    return {
      description: 'Returns the aggregate of ' + this.plural,
      auth: this.auth.count || 'jwt',
      handler: async (request, h) => {
        try {
          if (request.query.createdAt) {
            request.query.createdAt = JSON.parse(request.query.createdAt);
          }

          return h.response({
            [this.plural]: await this.service.aggregate(request.query)
          }, 200);
        } catch (error) {
          return h.response({ error: error.message }, 500);
        }
      },
      tags: ['api']
    };
  }

  list() {
    return {
      description: 'Returns the list of ' + this.total,
      auth: this.auth.list || 'jwt',
      handler: async (request, h) => {
        try {
          let query = request.query.options ? JSON.parse(request.query.options) : {};
          let filter = {};
          let sort = {};

          if (request.query.filter) {
            const filterData = JSON.parse(request.query.filter);
            if (filterData.text) {
              filter = { $or: [] };

              filterData.type.forEach(type => {
                filter['$or'].push({ [type]: new RegExp(filterData.text, 'gi') });
              });
            }
          }

          if (request.query.sort) {
            let sortData = JSON.parse(request.query.sort);
            for (var p in sortData) {
              if (sortData[p] !== 0) {
                sort[p] = sortData[p];
              }
            }
          }

          const params = {
            ...query,
            ...filter
          };

          const page = parseInt(request.query.page) || 0;
          const perPage = parseInt(request.query.perPage) || 1500;

          let resources = await this.service.list(params, page, perPage, sort,
            request.query.select || {}, request.query.noPopulate == 'no', request.query.additionalPopulate || []);
          let resourceCount = await this.service.count(params);

          return h.response({
            [this.plural]: resources,
            total: resourceCount
          }, 200);
        } catch (error) {
          console.log(error);
          return h.response({ error: error.message }, 500);
        }
      },
      tags: ['api']
    };
  }

  extract() {
    return {
      description: 'Returns the extract of ' + this.total,
      auth: this.auth.extract || 'jwt',
      handler: async (request, h) => {
        try {
          let query = request.query.options ? JSON.parse(request.query.options) : {};
          let filter = {};
          let sort = {};

          if (request.query.filter) {
            const filterData = JSON.parse(request.query.filter);
            if (filterData.text) {
              filter = { $or: [] };

              filterData.type.forEach(type => {
                filter['$or'].push({ [type]: new RegExp(filterData.text, 'gi') });
              });
            }
          }

          if (request.query.sort) {
            let sortData = JSON.parse(request.query.sort);
            for (var p in sortData) {
              if (sortData[p] !== 0) {
                sort[p] = sortData[p];
              }
            }
          }

          const params = {
            ...query,
            ...filter
          };

          const page = parseInt(request.query.page) || 0;
          const perPage = parseInt(request.query.perPage) || 1500000;

          let resources = await this.service.list(params, page, perPage, sort);

          resources = this.extractor.parseData(request.query, resources);

          const location = await FileHelper.saveFilePure(this.extractor.template, resources, request.query.filename || 'rapport');

          return h.response({
            link: location,
          }, 200);
        } catch (error) {
          console.log(error);
          return h.response({ error: error.message }, 500);
        }
      },
      tags: ['api']
    };
  }

  create() {
    return {
      description: 'Create a new ' + this.type,
      auth: this.auth.create || 'jwt',
      validate: {
        payload: this.validate.create,
        failAction: (request, h, error) => {
          console.log(error.details[0].message.replace(/['"]+/g, ''));
          return h.response({ message: error.details[0].message.replace(/['"]+/g, '') }).code(400).takeover();
        }
      },
      handler: async (request, h) => {
        try {
          let data = await this.service.create({ ...request.body, createdBy: request.headers.userId });
          return h.response({ message: data.message, [this.type]: data.resource }, data.statusCode);
        } catch (error) {
          console.log(error);
          return h.response({ error: error.message }, 500);
        }
      },
      tags: ['api']
    };
  }

  createWithFile() {
    return {
      description: 'Remove the ' + this.type,
      auth: this.auth.createWithFile || 'jwt',
      validate: {
        payload: this.validate.create,
        failAction: (request, h, error) => {
          console.log(error.details[0].message.replace(/['"]+/g, ''))
          return h.response({ message: error.details[0].message.replace(/['"]+/g, '') }).code(400).takeover();
        }
      },
      handler: async (request, h) => {
        try {
          let resource = JSON.parse(request.body.resource);

          request.files.forEach(file => {
            let location = file.transforms && file.transforms[0] ? file.transforms[0].location : file.location;
            if (request.files.filter(f => f.fieldname == file.fieldname).length > 1) {
              resource[file.fieldname] = resource[file.fieldname] !== 'waiting-for-files' ? resource[file.fieldname] : [];
              resource[file.fieldname].push(location);
            } else {
              resource[file.fieldname] = location;
            }
          });

          let data = await this.service.create(resource);

          return h.response({ message: 'Done', [this.type]: data.resource }, 200);
        } catch (error) {
          return h.response({ error: error.message }, 500);
        }
      },
      tags: ['api']
    };
  }

  createMany() {
    return {
      description: 'Create a list of ' + this.type,
      auth: this.auth.createMany || 'jwt',
      validate: {
        payload: this.validate.createMany,
        failAction: (request, h, error) => {
          console.log(error.details[0].message.replace(/['"]+/g, ''));
          return h.response({ message: error.details[0].message.replace(/['"]+/g, '') }).code(400).takeover();
        }
      },
      handler: async (request, h) => {
        try {
          let data = await this.service.createMany(request.body);
          return h.response({ message: data.message, resources: data.resources }, data.statusCode);
        } catch (error) {
          return h.response({ error: error.message }, 500);
        }
      },
      tags: ['api']
    };
  }

  update() {
    return {
      description: 'Remove the ' + this.type,
      auth: this.auth.update || 'jwt',
      validate: {
        payload: this.validate.update,
        failAction: (request, h, error) => {
          console.log(error.details[0].message.replace(/['"]+/g, ''))
          return h.response({ message: error.details[0].message.replace(/['"]+/g, '') }).code(400).takeover();
        }
      },
      handler: async (request, h) => {
        try {
          let resourceId = request.params.resource;
          let resourceData = request.body;

          resourceData.updatedBy = request.headers.userId;

          let data = await this.service.update(resourceId, resourceData);

          return h.response({ message: 'Done', [this.type]: data.resource }, 200);
        } catch (error) {
          return h.response({ error: error.message }, 500);
        }
      },
      tags: ['api']
    };
  }

  updateMany() {
    return {
      description: 'Update many items of the ' + this.type,
      auth: this.auth.update || 'jwt',
      validate: {
        payload: this.validate.update,
        failAction: (request, h, error) => {
          console.log(error.details[0].message.replace(/['"]+/g, ''))
          return h.response({ message: error.details[0].message.replace(/['"]+/g, '') }).code(400).takeover();
        }
      },
      handler: async (request, h) => {
        try {
          let resourceData = request.body;
          let datas = [];

          for (let i = 0; i < resourceData.length; i++) {
            let data = await this.service.update(resourceData[i].id, resourceData[i].data);
            datas.push(data.resource);
          }

          return h.response({ message: 'Done', [this.plural]: datas }, 200);
        } catch (error) {
          return h.response({ error: error.message }, 500);
        }
      },
      tags: ['api']
    };
  }

  updateWithFile() {
    return {
      description: 'Remove the ' + this.type,
      auth: this.auth.updateWithFile || 'jwt',
      validate: {
        payload: this.validate.update,
        failAction: (request, h, error) => {
          console.log(error.details[0].message.replace(/['"]+/g, ''))
          return h.response({ message: error.details[0].message.replace(/['"]+/g, '') }).code(400).takeover();
        }
      },
      handler: async (request, h) => {
        try {
          let resourceId = request.params.resource;
          let resource = request.body.resource ? JSON.parse(request.body.resource) : {};

          // console.log(resource);

          request.files.forEach(file => {
            let location = file.transforms && file.transforms[0] ? file.transforms[0].location : file.location;

            if (request.files.filter(f => f.fieldname == file.fieldname).length > 1) {
              resource[file.fieldname] = resource[file.fieldname] !== 'waiting-for-files' ? resource[file.fieldname] : [];
              resource[file.fieldname].push(location);
            } else {
              if (typeof resource[file.fieldname] == 'object') {
                resource[file.fieldname].push(location);
              } else {
                resource[file.fieldname] = location;
              }
            }
          });

          let data = await this.service.update(resourceId, resource);

          return h.response({ message: 'Done', [this.type]: data.resource }, 200);
        } catch (error) {
          return h.response({ error: error.message }, 500);
        }
      },
      tags: ['api']
    };
  }

  updatePropWithFile() {
    return {
      description: 'Remove the ' + this.type,
      auth: this.auth.updatePropWithFile || 'jwt',
      validate: {
        payload: this.validate.update,
        failAction: (request, h, error) => {
          console.log(error.details[0].message.replace(/['"]+/g, ''))
          return h.response({ message: error.details[0].message.replace(/['"]+/g, '') }).code(400).takeover();
        }
      },
      handler: async (request, h) => {
        try {
          let resourceId = request.params.resource;
          let resourceFile = request.files.find(f => f.fieldname == request.params.prop);

          let data = await this.service.update(resourceId, { [request.params.prop]: resourceFile.location });

          return h.response({ message: 'Done', [this.type]: data.resource }, 200);
        } catch (error) {
          return h.response({ error: error.message }, 500);
        }
      },
      tags: ['api']
    };
  }

  remove() {
    return {
      description: 'Remove the ' + this.type,
      auth: this.auth.remove || 'jwt',
      handler: async (request, h) => {
        try {
          let result = await this.service.remove(request.query.id);
          return h.response({ message: result.message }, result.statusCode);
        } catch (error) {
          return h.response({ error: error.message }, 500);
        }
      },
      tags: ['api']
    };
  }

  removeMany() {
    return {
      description: 'Remove the ' + this.type,
      auth: this.auth.removeMany || 'jwt',
      handler: async (request, h) => {
        try {
          return await this.service.removeMany(request.query.ids);
        } catch (error) {
          return h.response({ error: error.message }, 500);
        }
      },
      tags: ['api']
    };
  }
};