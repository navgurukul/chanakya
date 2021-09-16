exports.up = async (knex) => {
  await knex.schema.createTable("main.owners", (table) => {
    table.increments();
    table
      .integer("user_id")
      .unique()
      .unsigned()
      .references("id")
      .inTable("main.c_users")
      .notNullable();
    table.string("name", 225);
    table.string("available", 10);
    table.integer("pending_interview_count");
    table.datetime("createdOrUpdated_at");
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable("main.owners");
};
