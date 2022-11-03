const utils = require('../utils');

module.exports = {
  type: 'resource',
  singular: 'category',
  plural: 'categories',
  basePath: 'category',
  model: {
    name: 'Category',
    attributes: {
      name: { type: String },
      type: { type: String, enum: ['advert', 'document', 'event', 'job', 'training'] }
    },
    references: []
  },
  hooks: {
    async preCreate (data, Helper, zeRoute) {
      return data;
    }
  }
}