'use strict';

const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;
const crypto = require('crypto');

module.exports = function (options) {

  for (var p in options.attributes) {
    if (Array.isArray(options.attributes[p])) {
      if (options.attributes[p][0].ref) {
        options.attributes[p][0].type = Schema.Types.ObjectId;
      } else if (Object.keys(options.attributes[p][0]).length > 0 && !Object.keys(options.attributes[p][0]).includes('type')) {
        for (var subp in options.attributes[p][0]) {
          if (options.attributes[p][0][subp].ref) {
            options.attributes[p][0][subp].type = Schema.Types.ObjectId;
          } else if (options.attributes[p][0][subp].type == 'Mixed') {
            options.attributes[p][0][subp].type = Schema.Types.Mixed;
          }
        }
      }
    } else if (options.attributes[p].ref) {
      options.attributes[p].type = Schema.Types.ObjectId;
    } else if (options.attributes[p].type == 'Mixed') {
      options.attributes[p].type = Schema.Types.Mixed;
    }
  }

  var UserSchema = new Schema(options.attributes, {
    timestamps: true,
    toObject: {
      virtuals: true
    },
    toJSON: {
      virtuals: true
    }
  });
  
  /**
   * Hook a pre save method to hash the password
   */
  UserSchema.pre('save', function (next) {
    if (this.password && this.isModified('password')) {
      this.password = this.hashPassword(this.password);
    }
    
    if (this.transactionPassword && this.isModified('transactionPassword')) {
      this.transactionPassword = this.hashPassword(this.transactionPassword);
    }
    next();
  });
  
  /**
   * Create instance method for hashing a password
   */
  UserSchema.methods.hashPassword = function (password) {
    var shaSum = crypto.createHash('sha256');
    shaSum.update(password);
    return shaSum.digest('hex');
  };
  
  /**
   * Create instance method for authenticating User
   */
  UserSchema.methods.authenticate = function (password) {
    return this.password === this.hashPassword(password);
  };

  if (options.virtual) {
    options.virtual.forEach((prop) => {
      UserSchema.virtual(prop[0], prop[1]);
    });
  }

  return Mongoose.model(options.name, UserSchema);
}
