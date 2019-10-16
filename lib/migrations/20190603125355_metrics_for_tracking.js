
exports.up = async (knex) => {
  await knex.schema.createTable('daily_metrics', (table) => {
    table.increments('id');
    table.string('metricName');
    table.integer('value');
    table.date('date');
    table.datetime('createdAt');
  });
};

exports.down = async (knex) => {
  const dropTable = await knex.schema.dropTable('metrics');
  return dropTable;
};
