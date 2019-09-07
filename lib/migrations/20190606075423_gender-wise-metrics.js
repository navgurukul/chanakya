
exports.up = async function(knex, Promise) {
    await knex.schema.alterTable("daily_metrics", (table) => {
        table.integer('gender')
    })

};

exports.down = async function(knex, Promise) {
    await knex.schema.alterTable("daily_metrics", (table) => {
        table.dropColumn('gender')
    })
};
