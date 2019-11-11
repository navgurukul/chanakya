
exports.up = async (knex) => {
  await knex.schema.createTable('feedbacks', (table) => {
    table.increments('id').notNullable();
    table.integer('studentId', 11).references('id').inTable('students');
    table.integer('userId').unsigned();
    table.foreign('userId').references('id').inTable('user');
    table.string('student_stage').notNullable();
    table.string('feedback_type').notNullable();
    table.text('feedback').notNullable();
    table.string('state').notNullable();
    table.datetime('last_updated').notNullable();
    table.datetime('createdAt').notNullable();
  });
};  

exports.down = async (knex) => {
  const dropTable = await knex.schema.dropTable('feedbacks');
  return dropTable;
};
  