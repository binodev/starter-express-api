const Glob = require('glob');

let models = [];

require('fs').readdirSync(__dirname + '/').forEach(function(file) {
  if (file.match(/\.js$/) !== null && file !== 'index.js' && file !== 'frontend.js') {
    models.push(require('./' + file));
  }
});

module.exports = models.map(model => {
  return {
    type: model.type,
    singular: model.singular,
    plural: model.plural,
    basePath: model.basePath,
    frontend: model.frontend
  }
});