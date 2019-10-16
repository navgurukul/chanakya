exports.up = async (knex) => {
  await knex.schema.table('students', (t) => {
    t.integer('partnerId', 11).after('stage').references('id').inTable('partners');
  });
};

exports.down = async (knex) => {
  await knex.schema.table('students', (t) => {
    t.dropForeign('partnerId');
    t.dropColumn('partnerId');
  });
};
