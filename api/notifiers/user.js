module.exports = class UserNotifier {
  constructor (model, io, zeRoute) {
    this.model = model;
    this.hooks = model.hooks || {};
    this.io = io;
    this.zeRoute = zeRoute;
  }

  async preRegister (data, Helper) {
    if (this.hooks.preRegister) {
      data = await this.hooks.preRegister(data, Helper, this.zeRoute);
    }
    return data;
  }

  postRegister (data, type) {
    if (this.hooks.postRegister) {
      this.hooks.postRegister(data, this.zeRoute);
    }
  }
  
  // async preRegisterMany (data, Helper) {
  //   // if (this.hooks.preRegister) {
  //   //   data = data.map(async d => {
  //   //     return await this.hooks.preRegister(data, Helper);
  //   //   })
  //   // }
  //   return data;
  // }

  // postRegisterMany (data) {
  //   if (this.hooks.postRegister) {
  //     data.forEach(d => {
  //       return this.hooks.postRegister(d, this.zeRoute);
  //     });
  //   }
  // }

  // preUpdate (data) {
  //   if (this.hooks.preUpdate) {
  //     data = this.hooks.preUpdate(data);
  //   }
  //   return data;
  // }

  // postUpdate (data, oldData) {
  //   if (this.hooks.postUpdate) {
  //     this.hooks.postUpdate(data, this.zeRoute);
  //   }
    
  //   const watchers = this.watcherDB.watchersByProp.where((obj) => {
  //     return obj.relatedId == data.id;
  //   });

  //   if (watchers.length > 0) {
  //     console.log('there are', watchers.length, 'watchers in the system right now');
  //     watchers.forEach((watcher, i) => {
  //       const socketUser = this.io.currentUsers.find(u => u.id ==  watchers[i].socketUserId);
  //       if (socketUser && data[watchers[i].prop] != oldData[watchers[i].prop]) {
  //         this.io.sockets.to(socketUser.socketId).emit('watch-prop-updated', {
  //           relatedId: watchers[i].relatedId,
  //           model: watchers[i].model,
  //           prop: watchers[i].prop,
  //           value: data[watchers[i].prop]
  //         });
  //       }
  //     })
  //   }
  // }

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