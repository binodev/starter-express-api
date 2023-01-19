const utils = require('../utils');

module.exports = {
  type: 'resource',
  singular: 'category',
  plural: 'categories',
  basePath: 'category',
  model: {
    name: 'Category',
    attributes: {
      name: { type: String, unique: true },
      type: { type: String, enum: ['config'] },
      tags: { type: Array }
    },
    references: []
  },
  hooks: {
    async preCreate(data, Helper, zeRoute) {
      return data;
    }
  }
}