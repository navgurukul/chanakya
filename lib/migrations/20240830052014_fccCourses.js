exports.up = async function (knex) {
    await knex.schema.createTable("fcc_courses", function (table) {
      table.increments("id").primary();
      table.string("certification");
      table.string("course_name");
      table.string("challenge_name");
      table.string("challenge_id").unique();
    });
  };
  
  exports.down = async function (knex) {
    await knex.schema.dropTableIfExists("fcc_courses");
  };