
function randomString(length, chars) {
  var result = '';
  for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

function generatePrefix (length) {
  return randomString(length, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  // return randomString(length, '0123456789');
}

function generatePrefixNumber (length) {
  return randomString(length, '0123456789');
}

function generateOrderID () {
  return randomString(3, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') + 
      randomString(6, '0123456789');
}

function generateVerifyID () {
  return randomString(24, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
}

function string_to_slug(str) {
  str = str.replace(/^\s+|\s+$/g, ""); // trim
  str = str.toLowerCase();

  // remove accents, swap ñ for n, etc
  var from = "åàáãäâèéëêìíïîòóöôùúüûñç·/_,:;";
  var to = "aaaaaaeeeeiiiioooouuuunc------";

  for (var i = 0, l = from.length; i < l; i++) {
    str = str.replace(new RegExp(from.charAt(i), "g"), to.charAt(i));
  }

  str = str
    .replace(/[^a-z0-9 -]/g, "") // remove invalid chars
    .replace(/\s+/g, "-") // collapse whitespace and replace by -
    .replace(/-+/g, "-") // collapse dashes
    .replace(/^-+/, "") // trim - from start of text
    .replace(/-+$/, ""); // trim - from end of text

  return str;
}

function generateCode () {
  return randomString(6, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') 
}

function generateIdentifier () {
  return 'SL' + randomString(6, '1234567890') 
}

module.exports = {
  generateVerifyID,
  generateOrderID,
  randomString,
  generatePrefix,
  generatePrefixNumber,
  string_to_slug,
  generateCode,
  generateIdentifier
}