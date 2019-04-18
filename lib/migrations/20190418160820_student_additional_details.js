exports.up = function(knex, Promise) {
    return knex.schema.table('students', function(t) {
        t.integer('percentageIn10th').after('caste').defaultTo(0);
        t.integer('mathMarksIn10th').after('caste').defaultTo(0);
        t.integer('percentageIn12th').after('caste').defaultTo(0);
        t.integer('mathMarksIn12th').after('caste').defaultTo(0);
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