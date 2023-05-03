exports.up = async (knex) => {
    await knex.schema.createTable('student_stage', (table) => {
      table.increments('id');
      table.integer('student_id').unsigned().references('id').inTable('main.students').notNullable();
      table.string('stage');
    });
  };
  
  exports.down = async (knex) => {
    await knex.schema.dropTable('student_stage');
  };
  