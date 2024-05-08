exports.up = async (knex) => {
    await knex.schema.alterTable('main.questions', (table) => {
      table.string('school_test');
    });
  };
  
  exports.down = async (knex) => {
    await knex.schema.alterTable('main.questions', (table) => {
      table.dropColumn('school_test');
    });
  };
  