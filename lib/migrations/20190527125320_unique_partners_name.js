
exports.up = async (knex) => {
  await knex.schema.alterTable('partners', (t) => {
    t.unique('name', 'partner_name');
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable('partners', (t) => {
    t.dropUnique('name', 'partner_name');
  });
};
