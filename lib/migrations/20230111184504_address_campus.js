exports.up = async (knex) => {
    await knex.schema.alterTable('main.campus', (table) => {
        table.string('address')
    });
};

exports.down = async (knex) => {
    await knex.schema.alterTable('main.campus', (table) => {
        table.dropColumn('address')
    });
};
