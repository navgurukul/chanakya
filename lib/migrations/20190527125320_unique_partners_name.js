
exports.up = async function (knex, Promise) {
  await knex.schema.alterTable('partners', (t) => {
    t.unique('name', 'partner_name');
  });
};

exports.down = async function (knex, Promise) {
  await knex.schema.alterTable('partners', (t) => {
    t.dropUnique('name', 'partner_name');
  });
};
