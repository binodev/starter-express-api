let ResourceRoute = require('./resource');
let UserRoute = require('./user');

module.exports = function (app, models, io) {
  let zeRoute = {};

  models.forEach(model => {
    if (model.type == 'resource') {
      zeRoute[model.singular] = ResourceRoute(app, model, io, zeRoute);
    } else if (model.type == 'user') {
      zeRoute[model.singular] = UserRoute(app, model, io, zeRoute);
    }
  });
  
  return zeRoute;
};
