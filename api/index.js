
require('dotenv').config();

const express = require('express');
let bodyParser = require('body-parser')
const Mongoose = require('./lib/mongoose');
const Models = require('./models');
const Routes = require('./routes');
const models = require('../models/index');
const fmodels = require('../models/frontend');
const realtime = require('./realtime');
var cors = require('cors')
var request = require('request');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  allowEIO3: true,
  cors: {
    origin: [process.env.CLIENT_URL]
  }
});

var router = express.Router();
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }))
app.use(bodyParser.json({ limit: '50mb' }))

let mainModels = [];

// const users = require('./routes/users')
// const test = require('./routes/test')

// Import API Routes
// app.use(users)
// app.use(test)
// console.log(process.env.MONGO_URL)
Mongoose({
  uri: process.env.MONGO_URL,
}, () => {
  mainModels = Models.generateModels(models);
});

let zeRoute = Routes(router, models, io);
app.locals.zeRoute = zeRoute;


router.get('/', function (req, res) {
  res.status(200).send('welcome to api');
})

router.get('/proxy', function (req, res) {
  request.get(req.query.u).pipe(res);
})

router.get('/menus', function (req, res) {
  res.status(200).json(menus);
})

router.get('/models', function (req, res) {
  res.status(200).json(fmodels);
})

router.get('/stats', function (req, res) {
  res.status(200).json(stats);
})

router.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).send('invalid token...');
  } else {
    console.log(err);
    res.status(404);
  }
});

router.use(function (req, res) {
  res.status(404).send('404');
});

realtime(io, zeRoute);

// Export express app

// Start standalone server if directly running
const port = process.env.PORT || 4000;

app.use('/assets/', express.static('assets'));
app.use('/api', router);

server.listen(port, () => {
  console.log(`API server listening on port ${port}`)
});