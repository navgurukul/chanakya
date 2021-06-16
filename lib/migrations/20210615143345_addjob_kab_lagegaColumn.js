exports.up = async (knex) => {
  await knex.schema.alterTable("main.student_campus", (table) => {
    table.date("joined_campus_on");
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable("main.student_campus", (table) => {
    table.dropColumn("joined_campus_on");
  });
};
