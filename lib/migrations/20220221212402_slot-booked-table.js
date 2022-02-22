exports.up = async (knex) => {
  await knex.schema.createTable("main.slot_booked", (table) => {
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
  await knex.schema.dropTable("main.slot_booked");
};
