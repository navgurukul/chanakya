exports.up = async (knex) => {
  await knex.schema.alterTable('partners', (t) => {
    t.string('slug').unique().after('notes');
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable('partners', (t) => {
    t.dropColumn('slug');
  });
};
