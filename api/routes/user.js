const UserNotifier = require('../notifiers/user');
const UserController = require('../controllers/user');
const _ = require('underscore');
const jwt = require('express-jwt');
const isAuth = require('../lib/is-auth');

const generateH = function (res) {
  return {
    response: function (result, code) {
      return res.status(code || 200).json(result);
    },
    redirect: function (link) {
      return res.redirect(302, link)
    }
  }
};

const generateRoutes = function (ctrl) {
  return [
    {
      method: 'GET',
      path: ":user",
      config: ctrl.get()
    },
    {
      method: 'GET',
      path: 'me',
      config: ctrl.getDetails()
    },
    {
      method: 'GET',
      path: 'reset-token',
      config: ctrl.getByResetToken()
    },
    {
      method: 'GET',
      path: 'list',
      config: ctrl.list()
    },
    {
      method: 'GET',
      path: 'count',
      config: ctrl.count()
    },
    {
      method: 'POST',
      path: 'login',
      config: ctrl.login()
    },
    {
      method: 'POST',
      path: 'register',
      config: ctrl.register()
    },
    {
      method: 'POST',
      path: 'forgot-password',
      config: ctrl.forgotPassword()
    },
    {
      method: 'POST',
      path: 'reset-password',
      config: ctrl.resetPassword()
    },
    {
      method: 'PUT',
      path: 'change-pwd',
      config: ctrl.updatePassword()
    },
    {
      method: 'PUT',
      path: 'update-me',
      config: ctrl.updateMe()
    },
    {
      method: 'PUT',
      path: ':user',
      config: ctrl.update()
    },
    { 
      method: 'DELETE',
      path: 'remove',
      config: ctrl.remove()
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
  let notifier = new UserNotifier(model, io, zeRoute);
  let controller = new UserController(
    model.model.name, 
    model.singular, 
    model.plural, 
    model.model.references || '', 
    model.loginField || 'email',
    model.auth || {},
    {},
    notifier
  );

  let routes = generateRoutes(controller);

  if (model.api) {
    routes.push(...model.api.extraRoutes(zeRoute, io))
  }

  routes = sortRoutes(routes);

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    if (route.config.auth && route.config.auth == 'jwt') {
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
