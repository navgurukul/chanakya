exports.up = async (knex) => {
    await knex.schema.createTable("main.owner_schedule", (table) => {
        table.increments();
        table
            .integer("owner_id")
            .references("id")
            .inTable("main.interview_owners")
            .notNullable().unique();
        table.string("from");
        table.string("to");
        table.timestamp("created_at");
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTable("main.owner_schedule");
};
