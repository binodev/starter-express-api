const s3 = require('./s3');
const path = require('path');
var fs = require('fs-extra');
var XlsxTemplate = require('xlsx-template');
const ExcelJS = require('exceljs');

const sendFile = (title, data) => {
  return new Promise(async function (resolve, reject) {
    s3.saveFile(title + '.xlsx', data, function (err, file) {
      if (err) {
        return reject(err);
      }

      resolve(file.Location);
    });  
  });
};

const generateCols = (data) => {
  const cols = [];

  for (var i = 0; i < data.length; i++) {
    cols.push({
      header: data[i].label, 
      key: data[i].key, 
      width: 20 
    });
  }

  return cols;
};

exports.saveFilePure = async (template, results, title) => {
  return new Promise(async function (resolve, reject) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Little Market';
    workbook.lastModifiedBy = 'Little Market';
    workbook.created = new Date();
    
    
    const worksheet = workbook.addWorksheet('Données');
    
    worksheet.columns = generateCols(results[0].headers);

    let header = worksheet.getRow(1);
    header.height = 30;

    header.eachCell(function(cell, colNumber) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF242d3e' }
      };

      cell.border = {
        top: {style:'thin'},
        left: {style:'thin'},
        bottom: {style:'thin'},
        right: {style:'thin'}
      }

      cell.font = { 
        name: 'Calibri',
        color: { argb: 'FFFFFFFF' },
        size: 12,
      };

      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });

    for (var i = 0; i < results[0].data.length; i++) {
      let info = results[0].data[i];
      let obj = {};

      for (var j = 0; j < results[0].headers.length; j++) {
        let k = results[0].headers[j].key;
        let inf = info.find(i => i.key == k);
        obj[k] = inf && inf.value ? inf.value : '-';
      }

      let row = worksheet.addRow(obj);
      row.height = 25;
  
      row.eachCell(function(cell, colNumber) {
        cell.font = { 
          name: 'Calibri',
          color: { argb: 'FF000000' },
          size: 10,
        };

        cell.border = {
          top: {style:'thin'},
          left: {style:'thin'},
          bottom: {style:'thin'},
          right: {style:'thin'}
        }
  
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
    }




    // row.fill = {
    //   type: 'pattern',
    //   pattern: 'solid',
    //   fgColor: { argb: 'FFFF0000' }
    // };
    // row.font = { 
    //   name: 'Calibri',
    //   color: { argb: 'FF000000' },
    //   size: 10,
    // };
    // worksheet.addRow({id: 2, name: 'Jane Doe', dob: 'yaaaa'});

    const buffer = await workbook.xlsx.writeBuffer();

    var location = await sendFile(title, buffer);

    resolve(location);
  });
};

exports.saveFile = async (template, results, title) => {
  return new Promise(async function (resolve, reject) {
    fs.readFile(path.join(__dirname, '../../xlsx-templates', template + '.xlsx'), async function (err, templateData) {
      if (err) {
        return reject(err);
      }

      var template = new XlsxTemplate(templateData);

      console.log('1', title);

      if (results.splited) {
        for (let i = 0; i < (results.chunks.length - 1); i++) {
          template.copySheet(1, i + 2);
        }
        
        for (let i = 0; i < results.chunks.length; i++) {
          template.substitute(i + 1, {[results.prop]: results.chunks[i]});
        }
      } else {
        for (let i = 0; i < results.length; i++) {
          template.substitute(i + 1, results[i]);
        }
      }


      console.log('2', title);

      var fileData = template.generate({ type: 'uint8array' });

      console.log('3', title);

      var location = await sendFile(title, fileData);

      resolve(location);
    });
  });
}