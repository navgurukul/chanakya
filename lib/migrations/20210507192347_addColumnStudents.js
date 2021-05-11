exports.up = async (knex) => {
    await knex.schema.alterTable('students', table => {
        table.string('campus', 225);
        table.string('sub_stage', 225);
      })
};

exports.down = async (knex) => {
    await knex.schema.alterTable('students', table => {
        table.dropColumn('campus');
        table.dropColumn('sub_stage');
      })
};
