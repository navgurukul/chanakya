
exports.up = async function(knex, Promise) {
    await knex.schema.alterTable("metrics", (table) => {
        table.integer('gender')
    })

};

exports.down = async function(knex, Promise) {
    await knex.schema.alterTable("metrics", (table) => {
        table.dropColumn('gender')
    })
};
