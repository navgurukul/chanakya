const handleBar = require('handlebars');
const _ = require('underscore');

/* Random Handlebar Stuff */
handleBar.registerHelper({
  eq(v1, v2) {
    return v1 === v2;
  },
  ne(v1, v2) {
    return v1 !== v2;
  },
  lt(v1, v2) {
    return v1 < v2;
  },
  gt(v1, v2) {
    return v1 > v2;
  },
  lte(v1, v2) {
    return v1 <= v2;
  },
  gte(v1, v2) {
    return v1 >= v2;
  },
  and() {
    return Array.prototype.slice.call(arguments).every(Boolean);
  },
  or() {
    return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
  },
});

function handleSum() {
  const result = parseInt(_.reduce(arguments, (sum, value) => sum + value), 10);
  return result;
}

handleBar.registerHelper('sum', handleSum);

handleBar.registerHelper('inc', (value) => value + 1);

handleBar.registerHelper('string_lower', (index) => {
  const stringLower = 'abcdefghijklmnopqrstuvwxyz';
  return stringLower[index];
});

handleBar.registerHelper('string_upper', (index) => {
  const stringUpper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return stringUpper[index];
});

handleBar.registerHelper('hasParaTag', (string) => string.indexOf('<p>') > -1);

module.exports = handleBar;
