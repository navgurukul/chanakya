exports.up = async (knex) => {
  const table = await knex.schema.table('feedbacks', (t) => {
    t.string('whoAssign').after('state').nullable();
    t.string('toAssign').after('whoAssign').nullable();
  });
  return table;
};

exports.down = async (knex) => {
  const dropTable = await knex.schema.table('feedbacks', (t) => {
    t.dropColumn('whoAssign');
    t.dropColumn('toAssign');
  });
  return dropTable;
};
