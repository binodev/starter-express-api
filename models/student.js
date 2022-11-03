const utils = require('../utils');

module.exports = {
  type: 'user',
  singular: 'student',
  plural: 'students',
  basePath: 'student',
  model: {
    name: 'Student',
    attributes: {
      email: { type: String, unique: true },
      code: { type: String },
      password: { type: String },
      phonenumber: { type: String },
      lastname: { type: String },
      firstname: { type: String },
      fullname: { type: String },
      department: { type: String },
      university: { type: String },
      country: { type: String },
      beforeBalance: { type: Number, default: 0 },
      afterBalance: { type: Number, default: 0 },
      currentBalance: { type: Number, default: 0 },
      history: [{
        date: { type: Date },
        kind: { type: String },
        amount: { type: Number, default: 0}
      }]
    },
  },
  auth: {
    register: 'none'
  },
  hooks: {
    async preRegister (data, Helper, zeRoute) {
      let ctrl = await zeRoute.student;

      let code = utils.generateIdentifier();
      let exist = await ctrl.controller.service.User.countDocuments({code: code});
      
      while (exist > 0) {
        code = utils.generateIdentifier();
        exist = await ctrl.controller.service.User.countDocuments({code: code});
      }

      data.fullname = data.lastname + ' ' + data.firstname;
      data.code = code;
      return data;
    }
  }
}