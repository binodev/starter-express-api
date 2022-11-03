const utils = require('../utils');

module.exports = {
  type: 'resource',
  singular: 'event',
  plural: 'events',
  basePath: 'event',
  model: {
    name: 'Event',
    attributes: {
      name: { type: String },
      slug: { type: String },
      description: { type: String },
      cover: { type: String },
      price: { type: String },
      isFree: { type: Boolean },
      attendants: [{ ref: 'Student' }],
      contact: { type: String },
      author: { type: String },
      category: { ref: 'Category' }
    },
    references: ['attendants', 'category']
  },
  hooks: {
    async preCreate (data, Helper, zeRoute) {
      let ctrl = await zeRoute.event;

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