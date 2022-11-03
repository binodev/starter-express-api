const { v4: uuidv4 } = require('uuid');

module.exports = function (io, zeRoute) {
  let users = [];

  io.on('connection', socket => {
    
    socket.on("init", (userData) => {
      console.log('A new user is connected !');

      const user = users.find(u => u.id == userData.userId);
      if (user) {
        users = users.map(u => {
          if (u.id == user.id) {
            u.socketId = socket.id;
          }
          return u;
        });

        console.log(users.length, 'connected now');

        socket.emit("initOk", {
          id: user.id
        });
      } else {
        let newUser = {
          id: userData.userId,
          accountType: userData.accountType,
          businessId: userData.businessId,
          socketId: socket.id
        }

        users.push(newUser);
        io.currentUsers = users;

        console.log(users.length, 'connected now');

        socket.emit("initOk", {
          id: newUser.id
        });
      }
    });

    socket.on("disconnect", () => {
      users = users.filter(u => {
        return socket.id != u.socketId;
      })
      
      io.currentUsers = users;
      console.log('A new user is disconnected !')
    });

    socket.on("getMessages", async (data) => {
      let ctrl = await zeRoute.message;
      let messages = await ctrl.controller.service.Resource.find(data).populate(['business', 'user']);
      socket.emit("messagesList", messages);
    });

    socket.on("readMessages", async (data) => {
      let ctrl = await zeRoute.message;
      let messages = await ctrl.controller.service.Resource.updateMany(data.data, data.update);

      let options = {};

      if (data.update.readBusiness) {
        options.business = data.data.business;
        options.readBusiness = false;
      } else {
        options.user = data.data.user;
        options.readUser = false;
      }
      
      let messageCount = await ctrl.controller.service.Resource.count(options);

      socket.emit("readMessagesDone", {
        count: messageCount
      });
    });

    socket.on("sendMessage", async (data) => {
      let receiver = users.find(u => {
        return data.ownerType == 'user' ? u.businessId == data.receiver : u.id == data.receiver;
      })

      if (receiver && receiver.socketId) {
        let ctrl = await zeRoute.message;
        let message = await ctrl.controller.service.Resource.findOne({_id: data.message}).populate(['business', 'user']);
        
        let options = {};

        if (data.ownerType == 'user') {
          options.business = receiver.businessId;
          options.readBusiness = false;
        } else {
          options.user = receiver.id;
          options.readUser = false;
        }

        let messageCount = await ctrl.controller.service.Resource.count(options);

        io.sockets.to(receiver.socketId).emit("newMessage", {
          message,
          count: messageCount
        });
        io.sockets.to(receiver.socketId).emit("checkMessages");
      }
    });
  })  
};