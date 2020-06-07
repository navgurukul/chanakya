
exports.up = async (knex) => {
  await knex.schema.table('students', (t) => {
    t.string('tag').after('stage').nullable();
  });
};

exports.down = async (knex) => {
  await knex.schema.table('students', (t) => {
    t.dropColumn('tag');
  });
};
