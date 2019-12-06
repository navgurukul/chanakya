exports.up = async (knex) => {
  const table = await knex.schema.table('feedbacks', (t) => {
    t.string('whoAssinge').after('state').nullable();
    t.string('toAssinge').after('whoAssinge').nullable();
  });
  return table;
};

exports.down = async (knex) => {
  const dropTable = await knex.schema.table('feedbacks', (t) => {
    t.dropColumn('whoAssinge');
    t.dropColumn('toAssinge');
  });
  return dropTable;
};
