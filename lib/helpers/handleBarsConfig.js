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

handleBar.registerHelper('sum', function () {
  return parseInt(_.reduce(arguments, (sum, value) => sum + value));
});

handleBar.registerHelper('inc', (value) => ++value);

handleBar.registerHelper('string_lower', (index) => {
  const string_lower = 'abcdefghijklmnopqrstuvwxyz';
  return string_lower[index];
});

handleBar.registerHelper('string_upper', (index) => {
  const string_upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return string_upper[index];
});

handleBar.registerHelper('hasParaTag', (string) => string.indexOf('<p>') > -1);

module.exports = handleBar;
