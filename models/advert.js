const utils = require('../utils');

module.exports = {
  type: 'resource',
  singular: 'advert',
  plural: 'adverts',
  basePath: 'advert',
  model: {
    name: 'Advert',
    attributes: {
      name: { type: String },
      slug: { type: String },
      description: { type: String },
      cover: { type: String },
      link: { type: String },
      email: { type: String },
      whatsapp: { type: String },
      telegram: { type: String },
      call: { type: String },
      author: { type: String },
      category: { ref: 'Category' }
    },
    references: ['category']
  },
  hooks: {
    async preCreate (data, Helper, zeRoute) {
      let ctrl = await zeRoute.advert;

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