exports.up = async (knex) => {
  await knex.schema.createTable('main.students_school', (table) => {
    table.increments('id').primary();
    table.integer('school_id').references('id').inTable('main.school').unique();
    table.integer('student_id').references('id').inTable('main.students').unique();
  });
  await knex.schema.createTable('main.campus_school', (table) => {
    table.increments('id').primary();
    table.integer('campus_id').references('id').inTable('main.campus').unique();
    table.integer('school_id').references('id').inTable('main.school').unique();
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable('main.students_school');
  await knex.schema.dropTable('main.campus_school');
};
