exports.up = async (knex) => {
  await knex.schema.createTable("interview_on_topic", (table) => {
    table.increments();
    table
      .integer("interview_slot_id")
      .references("id")
      .inTable("inteview_topic");
    table
      .integer("interview_topic_id")
      .references("id")
      .inTable("inteview_topic");
    table.timestamp("created_at");
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable("interview_on_topic");
};
