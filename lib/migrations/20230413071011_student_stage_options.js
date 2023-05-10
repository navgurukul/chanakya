exports.up = async (knex, Promise) => {
    await knex.schema.createTable('main.student_stage_options', (table)=>{
        table.increments('id')
        table.integer('current_stage').references('id').inTable('new_student_stages')
        table.integer('option_stage').references('id').inTable('new_student_stages')
    })

};

exports.down = async (knex, Promise) => {
    await knex.schema.dropTable('main.student_stage_options');
};
