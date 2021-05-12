exports.up = async (knex, Promise) => {
    await knex.schema.createTable('main.campus', (table) => {
        table.increments();
        table.integer('student_id').references('id').inTable('main.students');
        table.string('campus', 225);
      });
};

exports.down = async (knex, Promise) => {
    await knex.schema.dropTable("main.campus");
};
