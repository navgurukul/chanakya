
exports.up = async (knex) => {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').notNullable();
    table.integer('type').notNullable();
    table.string('name').notNullable();
    table.string('email').notNullable().unique();
    table.string('mobile').notNullable();
    table.binary('password').notNullable();
    table.integer('partnerId', 11).references('id').inTable('partners');
    table.datetime('createdAt').notNullable();
  });
};

exports.down = async (knex) => {
  const dropTable = await knex.schema.dropTable('users');
  return dropTable;
};
