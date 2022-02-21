exports.up = async (knex) => {
  await knex.schema.createTable("inteview_topic", (table) => {
    table.increments();
    table.string("name");
    table.timestamp("created_at");
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable("inteview_topic");
};
