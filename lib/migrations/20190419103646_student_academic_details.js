exports.up = async (knex) => {
  const table = await knex.schema.table('students', (t) => {
    t.string('percentageIn10th').after('caste').nullable();
    t.integer('mathMarksIn10th').after('percentageIn10th').nullable();
    t.string('percentageIn12th').after('mathMarksIn10th').nullable();
    t.integer('mathMarksIn12th').after('percentageIn12th').nullable();
  });
  return table;
};

exports.down = async (knex) => {
  const dropTable = await knex.schema.table('products', (t) => {
    t.dropColumn('percentageIn10th');
    t.dropColumn('mathMarksIn10th');
    t.dropColumn('percentageIn12th');
    t.dropColumn('mathMarksIn12th');
  });
  return dropTable;
};
