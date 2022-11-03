const User = require('./user');
const Resource = require('./resource');

const generateModels = function (modelsData) {
  let models = [];

  for (var i = 0; i < modelsData.length; i++) {
    if (modelsData[i].type == 'user') {
      models.push(User(modelsData[i].model));
    } else if (modelsData[i].type == 'resource') {
      models.push(Resource(modelsData[i].model));
    } 
  }

  return models;
}

module.exports = {
  generateModels,
};