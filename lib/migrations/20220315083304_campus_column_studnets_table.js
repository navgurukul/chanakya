exports.up = async (knex, Promise) => {
  await knex.schema.alterTable('students', (table) => {
    table.integer('campus_id');
  });
};

exports.down = async (knex, Promise) => {
  await knex.schema.alterTable('students', (table) => {
    table.dropColumn('campus_id');
  });
};
