exports.up = async (knex) => {
  const table = await knex.schema.table('contacts', (t) => {
    t.boolean('isWhatsapp').after('mobile').default(0);
  });
  return table;
};

exports.down = async (knex) => {
  const dropTable = await knex.schema.table('contacts', (t) => {
    t.dropColumn('isWhatsapp');
  });
  return dropTable;
};
