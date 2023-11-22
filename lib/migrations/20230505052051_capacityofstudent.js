exports.up = async (knex) => {
    await knex.schema.alterTable('main.campus_school', (table) => {
        table.datetime('capacity_of_student');
    });
};
exports.down = async (knex) => {
    await knex.schema.alterTable('main.campus_school', (table) => {
        table.dropColumn('capacity_of_student');
    });
};