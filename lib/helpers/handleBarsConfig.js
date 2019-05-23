const handleBar = require("handlebars");
const _ = require("underscore");

/* Random Handlebar Stuff */
handleBar.registerHelper({
	eq: function(v1, v2) {
		return v1 === v2;
	},
	ne: function(v1, v2) {
		return v1 !== v2;
	},
	lt: function(v1, v2) {
		return v1 < v2;
	},
	gt: function(v1, v2) {
		return v1 > v2;
	},
	lte: function(v1, v2) {
		return v1 <= v2;
	},
	gte: function(v1, v2) {
		return v1 >= v2;
	},
	and: function() {
		return Array.prototype.slice.call(arguments).every(Boolean);
	},
	or: function() {
		return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
	}
});

handleBar.registerHelper("sum", function(){
	return parseInt(_.reduce(arguments, (sum, value) => sum + value));
});

handleBar.registerHelper("inc", function(value) {
	return ++value;
});

handleBar.registerHelper("string_lower", function(index) {
	let string_lower = "abcdefghijklmnopqrstuvwxyz";
	return string_lower[index];
});

handleBar.registerHelper("string_upper", function(index) {
	let string_upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	return string_upper[index];
});

handleBar.registerHelper("hasParaTag", function(string){
	return string.indexOf("<p>") > -1
})

module.exports = handleBar