const ResourceNotifier = require('../notifiers/resource');
const ResourceController = require('../controllers/resource');
const _ = require('underscore');
const isAuth = require('../lib/is-auth');
const s3 = require('../lib/s3');

const generateH = function (res) {
  return {
    response: function (result, code) {
      return res.status(code || 200).json(result);
    },
    redirect: function (link) {
      return res.redirect(302, link)
    },
    pdf: function (filename, stream) {
      res.setHeader('Content-type', 'application/pdf')
      res.setHeader("Content-Disposition","attachment; filename=" + filename)
      return stream.pipe(res)
    }
  }
};

const generateRoutes = function (ctrl) {
  return [
    {
      method: 'GET',
      path: ":resource",
      config: ctrl.get()
    },
    {
      method: 'GET',
      path: 'list',
      config: ctrl.list()
    },
    {
      method: 'GET',
      path: 'extract-xlsx',
      config: ctrl.extract()
    },
    {
      method: 'GET',
      path: 'aggregate',
      config: ctrl.aggregate()
    },
    {
      method: 'GET',
      path: 'count',
      config: ctrl.count()
    },
    {
      method: 'POST',
      path: 'create',
      config: ctrl.create()
    },
    {
      method: 'POST',
      path: 'create-many',
      config: ctrl.createMany()
    },
    {
      file: true,
      method: 'POST',
      path: "create-with-file",
      config: ctrl.createWithFile()
    },
    {
      method: 'POST',
      path: 'update-many',
      config: ctrl.updateMany()
    },
    {
      method: 'PUT',
      path: ":resource",
      config: ctrl.update()
    },
    {
      file: true,
      method: 'PUT',
      path: ":resource/update-with-file",
      config: ctrl.updateWithFile()
    },
    {
      file: true,
      method: 'POST',
      path: ":resource/update-with-file/:prop",
      config: ctrl.updatePropWithFile()
    },
    { 
      method: 'DELETE',
      path: 'remove',
      config: ctrl.remove()
    },
    { 
      method: 'DELETE',
      path: 'remove-many',
      config: ctrl.removeMany()
    }
  ];
};

const sortRoutes = function (routes) {
  let sortedRoutes = [];

  let groupedRoutes = _.groupBy(routes, "method");

  for (var p in groupedRoutes) {
    sortedRoutes.push(...groupedRoutes[p].sort((a,b) => (a.path > b.path) ? -1 : (b.path > a.path) ? 1 : 0));
  }

  return sortedRoutes;
};

module.exports = async function (app, model, io, zeRoute) {
  let notifier = new ResourceNotifier(model, io, zeRoute);
  let controller = new ResourceController(
    model.model.name, 
    model.singular, 
    model.plural, 
    model.model.references || '', 
    model.auth || {}, 
    {}, 
    notifier,
    model.extractor || {}
  );
  let routes = generateRoutes(controller);

  if (model.api) {
    routes.push(...model.api.extraRoutes(zeRoute, io))
  }

  routes = sortRoutes(routes);

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    if (route.config.auth && route.config.auth == 'jwt' && route.file) {
      app[route.method.toLowerCase()]('/' + model.basePath + '/' + route.path, isAuth, s3.uploadFile.any(), async (req, res, next) => {
        return await route.config.handler(req, generateH(res));
      });
    } if (route.config.auth && route.config.auth == 'jwt') {
      app[route.method.toLowerCase()]('/' + model.basePath + '/' + route.path, isAuth, async (req, res, next) => {
        return await route.config.handler(req, generateH(res));
      });
    } else {
      app[route.method.toLowerCase()]('/' + model.basePath + '/' + route.path, async (req, res, next) => {
        return await route.config.handler(req, generateH(res));
      });
    }
  }

  return {
    controller,
    routes
  };
};
