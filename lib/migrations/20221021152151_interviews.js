exports.up = async (knex) => {
  await knex.schema.createTable('interview_transition', (table) => {
    table.increments('id');
    table.integer('student_id').unsigned().references('id').inTable('main.students').notNullable();
    table.string('from_stage');
    table.string('to_stage');
    table.string('interviewer_feedback').notNullable();
    table.string('transition_done_by');
    table.datetime('created_at').notNullable();;
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable('interview_transition');
};
