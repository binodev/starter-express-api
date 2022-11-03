var Mailgen = require('mailgen');
const previewEmail = require('preview-email');
const nodemailer = require('nodemailer');
var path = require('path');

let transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
     user: process.env.SMTP_USER,
     pass: process.env.SMTP_PASSWORD
  }
});

var mailGenerator = new Mailgen({
  // theme: 'default',
  theme: {
    path: path.resolve('emails/default/index.html'),
    plaintextPath: path.resolve('emails/default/index.txt')
  },
  product: {
    name: process.env.SMTP_APP_NAME,
    link: process.env.SMTP_APP_URL,
    logo: process.env.APP_URL + '/assets/logo.png',
    logoHeight: '20px'
  }
});

const generateMessage = (data) => {
  var email, subject;
  
  email = {
    body: {
      title: 'hidden',
      name: data.params.FNAME,
      email: data.params.EMAIL,
      orlinktext: '',
      footer_text_1: '',
      footer_text_2: '',
      intro: '',
      action: {
        button: {
          text: '',
          link: ''
        }
      },
      signature: false,
    }
  }

  var emailBody = mailGenerator.generate(email);
  var emailText = mailGenerator.generatePlaintext(email);

  return {
    from: process.env.SMTP_FROM,
    to: data.to[0].name + '<' + data.to[0].email + '>',
    subject: subject,
    html: emailBody,
    text: emailText
  };
   
}

const sendMailLocal = (data) => {
  return previewEmail(generateMessage(data), {
    openSimulator: false
  });
};

const sendMailRemote = (data) => {
  return transport.sendMail(generateMessage(data));
};

const sendMail = (data) => {
  if (process.env.NODE_ENV == 'development') {
    return sendMailLocal(data);
  } else {
    return sendMailRemote(data);
  }
};

module.exports = sendMail