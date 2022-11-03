
const Mongoose = require('mongoose');

module.exports = function (options, callback) {
  Mongoose.connect(options.uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  }, function (err) {
    if (err) {
      console.log('Error in mongodb connection', err);
      throw err;
    }
  });
  
  // When the connection is connected
  Mongoose.connection.on('connected', function () {
    console.log('Mongo Database connected');
  });
  
  // When the connection is disconnected
  Mongoose.connection.on('disconnected', function () {
    console.log(' Mongo Database disconnected');
  });
  
  // If the node process ends, close the mongoose connection
  
  process.on('SIGINT', function () {
    Mongoose.connection.close(function () {
      console.log('Mongo Database disconnected through app termination');
      process.exit(0);
    });
  });

  if (callback) {
    callback ();
  }
  
  // Load models
  // var models = Glob.sync('app/models/*.js');
  // options.models.forEach(function (model) {
  //   require('../' + model);
  // });
}