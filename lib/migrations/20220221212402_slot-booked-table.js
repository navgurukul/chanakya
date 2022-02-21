exports.up = async (knex) => {
  await knex.schema.createTable("slot_booked", (table) => {
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
  await knex.schema.dropTable("slot_booked");
};
