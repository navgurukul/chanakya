exports.up = async (knex) => {
  // await knex.schema.table('main.users', (table) => {
  //   table.datetime('created_at').after('linkedin_link');
  // });
  // await knex('main.users').update({
  //   createdAt: new Date(),
  // });
};

exports.down = async (knex) => {
  // await knex.schema.table('main.users', (table) => {
  //   table.dropColumn('created_at');
  // });
};
