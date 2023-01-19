const utils = require('../utils');

module.exports = {
  type: 'resource',
  singular: 'config',
  plural: 'configs',
  basePath: 'config',
  model: {
    name: 'Config',
    attributes: {
      name: { type: String, required: false },
      price: { type: Number, required: false },
      cpuGamme: { type: String, required: false },
      cpuModel: { type: String, required: false },
      cpuPlateforme: { type: String, required: false },
      ram: { type: Number, required: false },
      storageType: { type: String, required: false },
      storageSpace: { type: Number },
      gpuModel: { type: String, required: false },
      gpuMemoryType: { type: String },
      gpuCardType: { type: String },
      gpuGeneration: { type: String },
      screen_size: { type: Number },
      screen_resolution: { type: String },
      weight: { type: Number },
      battery_life: { type: Number },
      brand: { type: String },
      color: { type: String },
      operating_system: { type: String },
      keyboard_type: { type: String },
      webcam: { type: Boolean },
      usb_ports: { type: Number },
      hdmi_ports: { type: Number },
      card_reader: { type: Boolean },
      category: { ref: 'Category' }
    },
    references: ['category']
  },
  hooks: {
    /* async preCreate(data, Helper, zeRoute) {
       let ctrl = await zeRoute.event;
 
       let slug = utils.string_to_slug(data.name);
       let exist = await ctrl.controller.service.Resource.countDocuments({ slug: slug });
 
       if (exist > 0) {
         slug += '-' + exist;
       }
 
       data.slug = slug;
       return data;
     }*/
  }
}