exports.up = function(knex, Promise) {
    return knex.schema.table('students', function(t) {
        t.string('percentageIn10th').after('caste').nullable();
        t.integer('mathMarksIn10th').after('percentageIn10th').nullable();
        t.string('percentageIn12th').after('mathMarksIn10th').nullable();
        t.integer('mathMarksIn12th').after('percentageIn12th').nullable();
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('products', function(t) {
        t.dropColumn('percentageIn10th');
        t.dropColumn('mathMarksIn10th');
        t.dropColumn('percentageIn12th');
        t.dropColumn('mathMarksIn12th');
        
    }); 
};  