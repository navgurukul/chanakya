
exports.up = async (knex) => {
  await knex.schema.dropTableIfExists('users');

  await knex.schema.createTable('users', (table) => {
    table.increments('id').notNullable();
    table.string('user_name').notNullable();
    table.string('email').notNullable().unique();
    table.binary('password').nullable();
    table.string('profilePic').nullable();
    table.string('googleUserId').nullable();
    table.datetime('createdAt').notNullable();
  });

  await knex.schema.createTable('feedbacks', (table) => {
    table.increments('id').notNullable();
    table.integer('studentId', 11).references('id').inTable('students');
    table.integer('userId').unsigned();
    table.foreign('userId').references('id').inTable('users');
    table.string('student_stage').notNullable();
    table.text('feedback').nullable();
    table.string('state').nullable();
    table.datetime('last_updated').nullable();
    table.datetime('createdAt').notNullable();
  });
};

exports.down = async (knex) => {
  const dropTable = await knex.schema.dropTable('users');
  return dropTable;
};
