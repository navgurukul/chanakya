exports.up = function(knex, Promise) {
    return knex.schema.table('contacts', function(t) {
        t.boolean('isWhatsapp').after('mobile').default(0);
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('contacts', function(t) {
        t.dropColumn('isWhatsapp');
    });
};  