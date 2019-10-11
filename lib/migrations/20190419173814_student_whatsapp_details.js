exports.up = function (knex, Promise) {
  return knex.schema.table('contacts', (t) => {
    t.boolean('isWhatsapp').after('mobile').default(0);
  });
};

exports.down = function (knex, Promise) {
  return knex.schema.table('contacts', (t) => {
    t.dropColumn('isWhatsapp');
  });
};
