'use strict';

const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

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

  var ResourceSchema = new Schema(options.attributes, {
    timestamps: true,
    toObject: {
      virtuals: true
    },
    toJSON: {
      virtuals: true
    }
  });

  if (options.virtual) {
    options.virtual.forEach((prop) => {
      ResourceSchema.virtual(prop[0], prop[1]);
    });
  }

  return Mongoose.model(options.name, ResourceSchema);
}
