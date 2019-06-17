const _ = require('underscore');

exports.up = async function(knex, Promise) {
    await knex.schema.createTable("matrics_for_tracking", (table) => {
        table.increments('id');
        table.string("matricsName");
        table.integer("value");
        table.date('date');
        table.datetime('createdAt');
    })

};

exports.down = async function(knex, Promise) {
    return knex.schema.dropTable('matrics_for_tracking');
};
