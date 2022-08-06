exports.up = async (knex) => {
    await knex.schema.alterTable('main.demo_campus', (table) => {
        table.string('phone_no')
    });
}
exports.down = async (knex) => {
    await knex.schema.alterTable('main.demo_campus', (table) => {
        table.dropColumn('phone_no');
    });
};
