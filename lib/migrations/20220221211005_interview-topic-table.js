exports.up = async (knex) => {
  await knex.schema.createTable("main.interview_topic", (table) => {
    table.increments();
    table.string("name");
    table.timestamp("created_at");
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable("main.interview_topic");
};
