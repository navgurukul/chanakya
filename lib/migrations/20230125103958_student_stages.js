exports.up = async (knex) => {
    // await knex.schema.createTable('main.students_stages', (table)=>{
    //     table.increments('id')
    //     table.integer('student_id').references('id').inTable('students');
    //     table.string('from_stage');
    //     table.string('to_stage');
    //     table.string('created_at');
    // })
};
exports.down = async (knex) => {
    // await knex.schema.dropTable('main.students_stages');
};

