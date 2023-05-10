exports.up = async (knex, Promise) => {
    await knex.schema.createTable('main.new_student_stages', (table)=>{
        table.increments('id').primary();
        table.string('stage');
    })

};

exports.down = async (knex, Promise) => {
    await knex.schema.dropTable('main.new_student_stages');
};
