exports.up = async (knex) => {
    await knex.schema.alterTable('main.questions', (table) => {
      table.integer('schoolId');
    });
  };
  
  exports.down = async (knex) => {
    await knex.schema.alterTable('main.questions', (table) => {
      table.dropColumn('schoolId');
    });
  };
  