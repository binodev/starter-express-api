var fs = require('fs');
var path = require('path');
var pdf = require('html-pdf');

const exportDoc = (template, lang, parseData, callback) => {
  try {
    var html = fs.readFileSync(
      path.resolve(
        __dirname, 
        '../invoices/' + template + '/index-' + lang + '.html'), 
        "utf8");

    let options = {
      height: "1100px",
      width: "950px",
      base: process.env.APP_URL + '/assets/', 
      phantomArgs: ["--ignore-ssl-errors=yes"],
      type: "pdf",
      quality: "75", 
      orientation: "portrait",
      timeout: 30000
    }

    html = parseData(html);
    
    pdf.create(html, options).toStream(callback);

  } catch(error) {
    console.log(error);
  }

}


module.exports = {
  exportDoc,
}