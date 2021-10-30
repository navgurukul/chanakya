exports.up = async (knex) => {
  await knex.schema.alterTable("students", (table) => {
    table.integer("partner_refer");
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable("students", (table) => {
    table.dropColumn("partner_refer");
  });
};
