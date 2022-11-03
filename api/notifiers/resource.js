module.exports = class ResourceNotifier {
  constructor (model, io, zeRoute) {
    this.model = model;
    this.hooks = model.hooks || {};
    this.io = io;
    this.zeRoute = zeRoute;
  }

  async preCreate (data, Helper) {
    if (this.hooks.preCreate) {
      data = await this.hooks.preCreate(data, Helper, this.zeRoute);
    }
    return data;
  }

  postCreate (data, type, query) {
    if (this.hooks.postCreate) {
      this.hooks.postCreate(data, this.zeRoute, query);
    }
  }

  postRemove (data) {
    if (this.hooks.postRemove) {
      this.hooks.postRemove(data, this.zeRoute);
    }
  }
  
  async preCreateMany (data, Helper) {
    if (this.hooks.preCreate) {
      data = await Promise.all(data.map(async d => {
        return await this.hooks.preCreate(d, Helper, this.zeRoute);
      }));
    }
    return data;
  }

  postCreateMany (data) {
    if (this.hooks.postCreate) {
      data.forEach(d => {
        return this.hooks.postCreate(d, this.zeRoute);
      });
    }
  }

  async preUpdate (data, Helper) {
    if (this.hooks.preUpdate) {
      data = await this.hooks.preUpdate(data, Helper);
    }
    return data;
  }

  postUpdate (data, oldData) {
    if (this.hooks.postUpdate) {
      this.hooks.postUpdate(data, oldData, this.zeRoute);
    }
  }

  async preFind (query) {
    if (this.hooks.preFind) {
      query = await this.hooks.preFind(query, this.zeRoute);
    }
    return query;
  }

  async postFind (data) {
    if (this.hooks.postFind) {
      data = await this.hooks.postFind(data, this.zeRoute);
    }
    return data;
  }

  async postGet (data) {
    if (this.hooks.postGet) {
      data = await this.hooks.postGet(data, this.zeRoute);
    }
    return data;
  }
};