'use strict';
var JWT = require('jsonwebtoken');
const MainService = require('../services/user');

module.exports = class UserController {
  constructor (model, type, plural, references, loginField, auth, validate, notifier) {
    this.type = type;
    this.plural = plural;
    this.validate = validate;
    this.auth = auth;
    this.loginField = loginField;
    this.service = new MainService(model, loginField, references, notifier);
  }

  getDetails () {
    return {
      description: 'Returns the ' + this.type + ' info',
      auth: this.auth.getDetails || 'jwt',
      handler: async (request, h) => {
        try {
          return h.response({
            [this.type]: await this.service.findUserDetails(request.user.userId)
          }, 200);
        } catch (error) {
          console.log(error);
          console.log(error);
          return h.response({error: error.message}, 500);
        }
      },
      tags: ['api']
    };
  }

  get () {
    return {
      description: 'Returns the ' + this.type + ' info',
      auth: this.auth.get || 'jwt',
      handler: async (request, h) => {
        try {
          return h.response({
            [this.type]: await this.service.get(request.params.user, request.query)
          }, 200);
        } catch (error) {
          console.log(error);
          return h.response({error: error.message}, 500);
        }
      },
      tags: ['api']
    };
  }

  getByResetToken () {
    return {
      description: 'Returns the ' + this.type + ' info',
      handler: async (request, h) => {
        try {
          return h.response({
            [this.type]: request.query.resetToken ? await this.service.findByResetToken(request.query.resetToken) : null
          }, 200);
        } catch (error) {
          console.log(error);
          return h.response({error: error.message}, 500);
        }
      },
      tags: ['api']
    };
  }

  count () {
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
          console.log(error);
          return h.response({error: error.message}, 500);
        }
      },
      tags: ['api']
    };
  } 
  
  list () {
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
              filter = {$or: []};

              filterData.type.forEach(type => {
                filter['$or'].push({[type]: new RegExp(filterData.text, 'gi')});
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
          const perPage = parseInt(request.query.perPage) || 15;
          
          let users = await this.service.list(params, page, perPage, sort);
          let userCount = await this.service.count(params);

          return h.response({
            [this.plural]: users,
            total: userCount
          }, 200);
        } catch (error) {
          console.log(error);
          return h.response({error: error.message}, 500);
        }
      },
      tags: ['api']
    };
  } 
  
  register () {
    return {
      description: 'Create a new ' + this.type,
      auth: this.auth.register || 'jwt',
      validate: {
        payload: this.validate.register,
        failAction: (request, h, error) => {
          return h.response({ message: error.details[0].message.replace(/['"]+/g, '')}, 400)
        }
      },
      handler: async (request, h) => {
        try {
          let data = await this.service.register({...request.body});
          console.log(data);
          return h.response({ message: data.message, [this.type]: data.user }, data.statusCode);
        } catch (error) {
          console.log(error);
          return h.response({error: error.message}, 500);
        }
      },
      tags: ['api']
    };
  } 
  
  login () {
    return {
      description: 'Login to your account',
      validate: {
        payload: this.validate.login,
        failAction: (request, h, error) => {
          return h.response({ message: error.details[0].message.replace(/['"]+/g, '') }, 400)
        }
      },
      handler: async (request, h) => {
        try {
          const login = request.body[this.loginField];
          let data = await this.service.findByCredentials(login, request.body.password);

          if (data.statusCode === 200) {
            let secret = process.env.JWT_SECRET_KEY;

            let obj = {
              userId: data.user.id
            };
            
            let jwtToken = JWT.sign(obj, secret, { expiresIn: '7 days' });
            
            data.user.password = undefined;
            data.user.salt = undefined;
            
            return h.response({ message: 'Successfully login', [this.type]: data.user, token: jwtToken });
          } else {
            return h.response({ message: data.message }, data.statusCode);
          }
        } catch (error) {
          console.log(error);
          return h.response({error: error.message}, 500);
        }
      },
      tags: ['api']
    };
  } 
  
  update () {
    return {
      description: 'Remove the ' + this.type,
      auth: this.auth.update || 'jwt',
      handler: async (request, h) => {
        try {
          let userId = request.params.user;
          let userData = request.body;
    
          let data = await this.service.update(userId, userData);
    
          return h.response({ message: 'Done', [this.type]: data.user }, 200);
        } catch (error) {
          console.log(error);
          return h.response({error: error.message}, 500);
        }
      },
      tags: ['api']
    };
  }
  
  updateMe () {
    return {
      description: 'Change password for the ' + this.type,
      auth: this.auth.updateMe || 'jwt',
      validate: {
        payload: this.validate.updateMe,
        failAction: (request, h, error) => {
          return h.response({ message: error.details[0].message.replace(/['"]+/g, '') }, 400)
        }
      },
      handler: async (request, h) => {
        try {
          let userId = request.user.userId;
          let userData = request.body;
    
          let data = await this.service.update(userId, userData);
    
          return h.response({ message: 'Done', [this.type]: data.user }, 200);
        } catch (error) {
          console.log(error);
          return h.response({error: error.message}, 500);
        }
      },
      tags: ['api']
    };
  }

  updatePassword () {
    return {
      description: 'Change password for the ' + this.type,
      auth: this.auth.updatePassword || 'jwt',
      validate: {
        payload: this.validate.updatePassword,
        failAction: (request, h, error) => {
          return h.response({ message: error.details[0].message.replace(/['"]+/g, '') },400)
        }
      },
      handler: async (request, h) => {
        try {
          let userId = request.user.userId;
          let userData = request.body;

          let actualUserData = await this.service.findByIdAndPassword(userId, request.body.password);

          if (actualUserData.statusCode == 401) {
            return h.response({ message: 'the current password is incorrect!' }, 400);
          }
    
          let data = await this.service.update(userId, {
            password: request.body.newPassword
          });
    
          return h.response({ message: 'Done', [this.type]: data.user }, 200);
        } catch (error) {
          console.log(error);
          return h.response({error: error.message}, 500);
        }
      },
      tags: ['api']
    };
  }
  
  forgotPassword () {
    return {
      description: 'Forgot password for the ' + this.type,
      validate: {
        payload: this.validate.forgotPassword,
        failAction: (request, h, error) => {
          return h.response({ message: error.details[0].message.replace(/['"]+/g, '') }, 400)
        }
      },
      handler: async (request, h) => {
        try {
          let email = request.body.email;
    
          let data = await this.service.forgotPassword(email);
    
          return h.response({ message: data.message }, data.statusCode);
        } catch (error) {
          console.log(error);
          return h.response({error: error.message}, 500);
        }
      },
      tags: ['api']
    };
  }
  
  resetPassword () {
    return {
      description: 'Forgot password for the ' + this.type,
      validate: {
        payload: this.validate.resetPassword,
        failAction: (request, h, error) => {
          return h.response({ message: error.details[0].message.replace(/['"]+/g, '') }, 400)
        }
      },
      handler: async (request, h) => {
        try {
          let userId = request.body.userId;
          let password = request.body.password;
    
          let data = await this.service.resetPassword(userId, password);
    
          return h.response({ message: data.message }, data.statusCode);
        } catch (error) {
          console.log(error);
          return h.response({error: error.message}, 500);
        }
      },
      tags: ['api']
    };
  }

  remove () {
    return {
      description: 'Remove the ' + this.type,
      auth: this.auth.remove || 'jwt',
      validate: {
        payload: this.validate.remove,
        failAction: (request, h, error) => {
          return h.response({ message: error.details[0].message.replace(/['"]+/g, '') }, 400)
        }
      },
      handler: async (request, h) => {
        try {
          let result = await this.service.remove(request.query.id);
          return h.response({ message: result.message}, result.statusCode);
        } catch (error) {
          console.log(error);
          return h.response({error: error.message}, 500);
        }
      },
      tags: ['api']
    };
  } 
};