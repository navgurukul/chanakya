exports.up = async (knex) => {
    await knex.schema.createTable('milestone_transition', (table) => {
      table.increments('id');
      table.integer('student_id').unsigned().references('id').inTable('main.students').notNullable();
      table.string('from_milestone');
      table.string('to_milestone');
      table.text('mentors_feedback');
      table.string('transition_done_by');
      table.datetime('created_at').notNullable();;
    });
  };
  
  exports.down = async (knex) => {
    await knex.schema.dropTable('milestone_transition');
  };
  