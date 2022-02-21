exports.up = async (knex) => {
  await knex.schema.createTable("main.interview_slot_resource", (table) => {
    table.increments();
    table
      .integer("owner_id")
      .references("id")
      .inTable("main.interview_owners")
      .notNullable();
    table.string("duration");
    table.string("start_time");
    table.string("end_time");
    table.date("date");
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable("main.interview_slot_resource");
};
