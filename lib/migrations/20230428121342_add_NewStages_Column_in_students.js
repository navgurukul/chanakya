exports.up = async (knex) => {
    await knex.schema.alterTable('main.students', (table) => {
        table.string('new_stages')
    });
};
exports.down = async (knex) => {
    await knex.schema.alterTable('main.students', (table) => {
        table.dropColumn('new_stages')
    });
};
