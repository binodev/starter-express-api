const en = require('../locales/en');
const de = require('../locales/de');
const mailUtil = require('./mail');

const splitText = (textEn, textDe) => {
  let firstPartIndexEn = textEn.indexOf('.') >= 0 ? textEn.indexOf('.') : textEn.indexOf('!');
  let firstPartIndexDe = textDe.indexOf('.') >= 0 ? textDe.indexOf('.') : textDe.indexOf('!');

  titleEn = textEn.substring(0, firstPartIndexEn + 1);
  titleDe = textDe.substring(0, firstPartIndexDe + 1);

  contentEn = textEn;
  contentDe = textDe;

  return {
    titleEn,
    titleDe,
    contentEn,
    contentDe
  }
};

const get = (type, subtype, destination, data) => {
  let link = '';

  let notificationText;

  if (type == 'order') {
    let textEn = en['orders']['notification'][destination + '_' + subtype];
    let textDe = de['orders']['notification'][destination + '_' + subtype];

    textEn = textEn.replace('#consumerFirstName', data.guestName);
    textDe = textDe.replace('#consumerFirstName', data.guestName);

    if (data.business && data.business.name) {
      textEn = textEn.replace('#eshopName', data.business.name);
      textDe = textDe.replace('#eshopName', data.business.name);
    }

    notificationText = splitText(textEn, textDe);
    link = '/orders/' + data._id;

  } else if (type == 'order-products') {
    let textEn = en['cart-status-products'][destination]['notification'][subtype];
    let textDe = de['cart-status-products'][destination]['notification'][subtype];

    textEn = textEn.replace('#consumerFirstName', data.guestName);
    textDe = textDe.replace('#consumerFirstName', data.guestName);

    if (data.business && data.business.name) {
      textEn = textEn.replace('#eshopName', data.business.name);
      textDe = textDe.replace('#eshopName', data.business.name);
    }

    notificationText = splitText(textEn, textDe);
    link = '/orders/' + data._id;

  } else if (type == 'review-product') {
    let textEn = en['orders']['notification'][destination + '_' + subtype];
    let textDe = de['orders']['notification'][destination + '_' + subtype];

    textEn = textEn.replace('#consumerFirstName', data.guestName);
    textDe = textDe.replace('#consumerFirstName', data.guestName);

    if (data.business && data.business.name) {
      textEn = textEn.replace('#eshopName', data.business.name);
      textDe = textDe.replace('#eshopName', data.business.name);
    }

    notificationText = splitText(textEn, textDe);
    link = '/orders/' + data._id;

  } else if (type == 'product') {

    let textEn = en['products']['notification'][subtype];
    let textDe = de['products']['notification'][subtype];

    textEn = textEn.replace('#productName', data.name);
    textDe = textDe.replace('#productName', data.name);

    notificationText = splitText(textEn, textDe);
    link = '/business/products/' + data._id + '/edit';

  }

  return {
    title: notificationText.titleEn,
    content: notificationText.contentEn,
    titleLocale: [
      {
        language: 'de',
        value: notificationText.titleDe
      }
    ],
    contentLocale: [
      {
        language: 'de',
        value: notificationText.contentDe
      }
    ],
    link: link
  }
};

const sendMail = async (user, data) => {
  return await mailUtil({
    templateId: 3,
    to: [
      {
        name: user.firstname,
        email: user.email
      }
    ],
    language: user.language,
    params: {
      FNAME: user.firstname,
      ACTIONURL: `${process.env.CLIENT_URL}${data.link}`,
      EMAIL: user.email,
      TITLE: data.title, 
      TEXT: data.content.replace(data.title, ''),
    },
  });
}

const create = async (zeRoute, data, io) => {
  let ctrl = await zeRoute.notification;
  let notification = await ctrl.controller.service.Resource.create(data);
  let countNotifications = 0;

  console.log(notification);

  // realtime

  let usersToNotify = io.currentUsers ? io.currentUsers.filter(u => {
    return data.destination == 'business' ? u.businessId == data.business && u.accountType == 'business' : u.id == data.user && u.accountType == 'regular';
  }) : [];

  usersToNotify = usersToNotify.filter((v,i,a)=>a.findIndex(v2=>(v2.id===v.id))===i);

  if (data.destination == 'business') {
    countNotifications = await ctrl.controller.service.Resource.count({
      read: false,
      destination: 'business',
      business: data.business
    });
  } else {
    countNotifications = await ctrl.controller.service.Resource.count({
      read: false, 
      destination: 'client',
      user: data.user
    });
  }

  for (var i = 0; i < usersToNotify.length; i++) {
    let user = usersToNotify[i];
    if (io.sockets) {
      io.sockets.to(user.socketId).emit('newNotification', {
        notification,
        count: countNotifications
      });
    }
  }

  // emails

  let dest;
  
  if (data.destination == 'business') {
    let ctrlBusiness = await zeRoute.business;
    let business = await ctrlBusiness.controller.service.Resource.findOne({_id: data.business}).populate('user');
    dest = business.user;
    dest.firstname = business.name;
  } else {
    let ctrlUser = await zeRoute.user;
    dest = await ctrlUser.controller.service.User.findOne({_id: data.user}).populate('user');
  }

  await sendMail(dest, data);

  return notification;
}

module.exports = {
  get,
  create,
  sendMail
}