exports.up = async (knex) => {
  await knex.schema.createTable("main.interview_slot", (table) => {
    table.increments();
    table
      .integer("owner_id")
      .references("id")
      .inTable("main.interview_owners")
      .notNullable();
    table
      .integer("student_id")
      .references("id")
      .inTable("main.students")
      .notNullable();
    table.string("student_name");
    table
      .integer("transition_id")
      .references("id")
      .inTable("main.stage_transitions");
    table.string("start_time");
    table.string("end_time");
    table.string("end_time_expected");
    table.date("on_date");
    table.string("duration");
    table.string("status");
    table.boolean("is_cancelled");
    table.string("cancelltion_reason");
    table.datetime("created_at").notNullable();
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable("main.interview_slot");
};
