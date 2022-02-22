exports.up = async (knex) => {
  await knex.schema.createTable("main.interview_on_topic", (table) => {
    table.increments();
    table
      .integer("interview_slot_id")
      .references("id")
      .inTable("interview_topic");
    table
      .integer("interview_topic_id")
      .references("id")
      .inTable("interview_topic");
    table.timestamp("created_at");
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable("main.interview_on_topic");
};
