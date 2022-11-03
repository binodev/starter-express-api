const utils = require('../utils');

module.exports = {
  type: 'resource',
  singular: 'document',
  plural: 'documents',
  basePath: 'document',
  model: {
    name: 'Document',
    attributes: {
      name: { type: String },
      slug: { type: String },
      description: { type: String },
      cover: { type: String },
      file: { type: String },
      downloads: { type: Number },
      contact: { type: String },
      author: { type: String },
      category: { ref: 'Category' }
    },
    references: ['category']
  },
  hooks: {
    async preCreate (data, Helper, zeRoute) {
      let ctrl = await zeRoute.document;

      let slug = utils.string_to_slug(data.name) + '-' + utils.generatePrefixNumber(5);
      let exist = await ctrl.controller.service.Resource.countDocuments({slug: slug});
      
      if (exist > 0) {
        slug += '-' + exist;
      }

      data.slug = slug;
      return data;
    }
  }
}