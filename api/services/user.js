'use strict';
const Mongoose = require('mongoose');
const mailUtil = require('../../utils/mail');
// const MailHelper = require('./mail');
const { v4: uuidv4 } = require('uuid');

module.exports = class UserHelper {
  constructor(model, loginField, populateFields, notifier) {
    this.User = Mongoose.model(model)
    this.loginField = loginField;
    this.populateFields = populateFields || "";
    this.notifier = notifier;
  }
  
  async get (id, options) {
    return new Promise(async (resolve, reject) => {
      try {
        let user = await this.User.findOne({_id: id})
          .populate(options.noPopulate ? '' : this.populateFields);
        return resolve(user);
      } catch (error) {
        return reject(error);
      }
    });
  };

  async count (query = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        let users = await this.User.count(query);
        return resolve(users);
      }
      catch (error) {
        return reject(error);
      }
    });
  };
  
  async countAll (query = {}, aggregator) {
    return new Promise(async (resolve, reject) => {
      try {
        let users = await this.User.aggregate([
          {
            $match: query
          },
          {
            $group: {
              _id: "$" + aggregator,
              total: { $sum: 1 }
            }
          }
        ]).allowDiskUse(true);

        return resolve(users);
      }
      catch (error) {
        return reject(error);
      }
    });
  };

  async list (query = {}, page = 0, size = 15, sort = {}, select = {}, noPopulate = false) {
    return new Promise(async (resolve, reject) => {
      try {
        let users = await this.User.find(query)
          .populate(noPopulate ? '' : this.populateFields)
          .skip(page * size)
          .limit(size)
          .sort(sort)
          .select(select)
          .lean();

        return resolve(users);
      }
      catch (error) {
        console.log(error);
        return reject(error);
      }
    });
  };

  async findByCredentials (username, password) {
    return new Promise(async (resolve, reject) => {
      try {
        var query = {
          [this.loginField]: username
        };
        let user = await this.User.findOne(query)
          .populate(this.populateFields);
        if (!user || !user.authenticate(password)) {
          return resolve({
            statusCode: 401,
            message: 'Incorrect Email or password !'
          });
        }
        return resolve({
          statusCode: 200,
          user: user
        });
      }
      catch (error) {
        return reject(error);
      }
    });
  };

  async findByIdAndPassword (id, password) {
    return new Promise(async (resolve, reject) => {
      try {
        var query = {
          _id: id
        };
        let user = await this.User.findOne(query);

        if (!user || !user.authenticate(password)) {
          return resolve({
            statusCode: 401,
            message: 'Incorrect Email or password !'
          });
        }
        return resolve({
          statusCode: 200,
          user: user
        });
      }
      catch (error) {
        return reject(error);
      }
    });
  };

  async register (userData, importing) {
    return new Promise(async (resolve, reject) => {
      try {
        userData = await this.notifier.preRegister(userData);

        let data = await this.isUserAlreadyExist(userData[this.loginField]);
        if (data && !importing) {
          return resolve({ statusCode: 409, message: 'User already exist' });
        } else {
          let savedUser;
          let user;

          if (data) {
            user = data;
            for (var p in userData) {
              user[p] = userData[p];
            }

            user.status = 'active';
            savedUser = await user.save();
          } else {
            user = new this.User(userData);
            savedUser = await user.save();
          }

          this.notifier.postRegister(savedUser, userData);
          
          return resolve({ statusCode: 200, message: 'Enregistrement réussi', user: savedUser });
        }
      }
      catch (error) {
        return reject(error);
      }
    });
  }

  async isUserAlreadyExist (username) {
    return new Promise(async (resolve, reject) => {
      try {
        var query = {};
        query[this.loginField] = username.toLowerCase();
        let user = await this.User.findOne(query);
        if (user) {
          return resolve(user);
        }
        return resolve();
      }
      catch (error) {
        return reject(error);
      }
    });
  };

  async findUserDetails (userId) {
    return new Promise(async (resolve, reject) => {
      try {
        let userDetails = await this.User
          .findOne({ _id: Mongoose.Types.ObjectId(userId) }, '-password -__v')
          .populate(this.populateFields);
        return resolve(userDetails);
      }
      catch (error) {
        return reject(error);
      }
    });
  };

  async findByResetToken (userToken) {
    return new Promise(async (resolve, reject) => {
      try {
        let userDetails = await this.User
          .findOne({ resetToken: userToken }, '-password -__v');
        return resolve(userDetails);
      }
      catch (error) {
        return reject(error);
      }
    });
  };

  async update (userId, userData) {
    return new Promise(async (resolve, reject) => {
      try {
        let user = await this.User.findById(userId);

        for (var prop in userData) {
          user[prop] = userData[prop];
        }
        let savedData = await user.save();
        return resolve({
          statusCode: 200,
          user: savedData,
          message: 'User saved successfully'
        });
      }
      catch (error) {
        reject(error);
      }
    });
  };

  async forgotPassword (userEmail) {
    return new Promise(async (resolve, reject) => {
      try {
        let user = await this.User.findOne({email: userEmail});

        if (user) {
          user.resetToken = uuidv4();
          let savedData = await user.save();

          await mailUtil({
            templateId: 2,
            to: [
              {
                name: user.firstname,
                email: user.email
              }
            ],
            language: user.language || 'en',
            params: {
              FNAME: user.firstname,
              RESETURL: `${process.env.CLIENT_URL}/reset-password/${user.resetToken}`,
              EMAIL: user.email
            }
          })

          return resolve({
            statusCode: 200,
            message: 'Veuillez consulter votre boite email.'
          });
          
        } else {
          return resolve({
            statusCode: 400,
            message: 'L\'utilisateur n\'existe pas !'
          });
        }
      }
      catch (error) {
        reject(error);
      }
    });
  };
  
  async resetPassword (userId, password) {
    return new Promise(async (resolve, reject) => {
      try {
        let user = await this.User.findById(userId);

        if (user) {
          user.resetToken = null;
          user.password = password;
          await user.save();

          return resolve({
            statusCode: 200,
            message: 'Mot de passe changé avec succès.'
          });
          
        } else {
          return resolve({
            statusCode: 400,
            message: 'L\'utilisateur n\'existe pas !'
          });
        }
      }
      catch (error) {
        reject(error);
      }
    });
  };

  async remove (userId) {
    return new Promise(async (resolve, reject) => {
      try {
        let removedUser = await this.User.remove({ _id: userId });
        return resolve({ statusCode: 200, message: 'User supprimé', user: removedUser });
      }
      catch (error) {
        return reject(error);
      }
    });
  };
};