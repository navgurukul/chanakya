
exports.up = async (knex) => {
  await knex.schema.createTable('user', (table) => {
    table.increments('id').notNullable();
    table.string('user_name').notNullable();
    table.string('email').notNullable().unique();
    table.binary('password').nullable();
    table.string('profilePic').nullable();
    table.string('googleUserId').nullable();
    table.datetime('createdAt').notNullable();
  });
};

exports.down = async (knex) => {
  const dropTable = await knex.schema.dropTable('user');
  return dropTable;
};
