const utils = require('../utils');

module.exports = {
  type: 'resource',
  singular: 'training',
  plural: 'trainings',
  basePath: 'training',
  model: {
    name: 'Training',
    attributes: {
      name: { type: String },
      slug: { type: String },
      description: { type: String },
      cover: { type: String },
      attendants: [{ ref: 'Student' }],
      price: { type: String },
      isFree: { type: Boolean },
      contact: { type: String },
      author: { type: String },
      category: { ref: 'Category' }
    },
    references: ['attendants', 'category']
  },
  hooks: {
    async preCreate (data, Helper, zeRoute) {
      let ctrl = await zeRoute.training;

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