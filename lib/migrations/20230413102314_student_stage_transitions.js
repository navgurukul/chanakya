exports.up = async (knex, Promise) => {
    await knex.schema.createTable('main.student_stage_transitions', (table)=>{
        table.increments('id')
        table.integer('student_id')
        table.integer('from_stage')
        table.integer('to_stage')
        table.string('created_at');
        table.string('transition_done_by');
    })
};

exports.down = async (knex, Promise) => {
    await knex.schema.dropTable('main.student_stage_transitions');
};
