exports.up = async (knex) => {
  await knex.schema.createTable('main.school', (table) => {
    table.increments('id').primary();
    table.string('name');
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable('main.school');
};
