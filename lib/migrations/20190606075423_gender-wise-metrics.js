
exports.up = async (knex) => {
  await knex.schema.alterTable('daily_metrics', (table) => {
    table.integer('gender');
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable('daily_metrics', (table) => {
    table.dropColumn('gender');
  });
};
