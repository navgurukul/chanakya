const _ = require('underscore');

exports.up = async function(knex, Promise) {
    await knex.schema.createTable("metrics", (table) => {
        table.increments('id');
        table.string("metricsName");
        table.integer("value");
        table.date('date');
        table.datetime('createdAt');
    })

};

exports.down = async function(knex, Promise) {
    return await knex.schema.dropTable('metrics');
};
