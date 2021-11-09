exports.up = async (knex, Promise) => {
  await knex.schema.alterTable('students', (table) => {
    table.string('provisions');
  });
};

exports.down = async (knex, Promise) => {
  await knex.schema.alterTable('students', (table) => {
    table.dropColumn('provisions');
  });
};
