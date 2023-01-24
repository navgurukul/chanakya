exports.up = async (knex) => {
    await knex.schema.alterTable('main.students', (table) => {
        table.integer('school_stage_id').references('id').inTable('main.school_stage')
    });
};

exports.down = async (knex) => {
    await knex.schema.alterTable('main.students', (table) => {
        table.dropColumn('school_stage_id')
    });
};