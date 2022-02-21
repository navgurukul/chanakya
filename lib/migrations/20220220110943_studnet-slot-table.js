exports.up = async (knex) => {
  await knex.schema.createTable("main.studnet_slot", (table) => {
    table.increments();
    table
      .integer("student_id")
      .references("id")
      .inTable("main.students")
      .notNullable();
    table
      .integer("owner_id")
      .references("id")
      .inTable("main.interview_owners")
      .notNullable();
    table
      .integer("transition_id")
      .references("id")
      .inTable("main.stage_transitions");
    table.string("status");
    table.string("duration");
    table.string("start_time");
    table.string("end_time");
    table.date("date");
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable("main.student_slot");
};
