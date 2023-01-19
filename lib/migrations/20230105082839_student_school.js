exports.up = async (knex) => {
  await knex.schema.createTable('main.students_school', (table) => {
    table.increments('id').primary();
    table.integer('school_id').references('id').inTable('main.school');
    table.integer('student_id').references('id').inTable('main.students');
  });
  await knex.schema.createTable('main.campus_school', (table) => {
    table.increments('id').primary();
    table.integer('campus_id').references('id').inTable('main.campus');
    table.integer('school_id').references('id').inTable('main.school');
    table.unique(["campus_id", "school_id"]);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable('main.students_school');
  await knex.schema.dropTable('main.campus_school');
};
