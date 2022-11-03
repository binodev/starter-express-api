const utils = require('../utils');

module.exports = {
  type: 'resource',
  singular: 'job',
  plural: 'jobs',
  basePath: 'job',
  model: {
    name: 'Job',
    attributes: {
      name: { type: String },
      slug: { type: String },
      description: { type: String },
      contact: { type: String },
      cover: { type: String },
      author: { type: String },
      category: { ref: 'Category' }
    },
    references: ['category']
  },
  hooks: {
    async preCreate (data, Helper, zeRoute) {
      let ctrl = await zeRoute.job;

      let slug = utils.string_to_slug(data.name);
      let exist = await ctrl.controller.service.Resource.countDocuments({slug: slug});
      
      if (exist > 0) {
        slug += '-' + exist;
      }

      data.slug = slug;
      return data;
    }
  }
}