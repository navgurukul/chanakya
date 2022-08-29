exports.up = async (knex) => {
    await knex.schema.createTable('interview_transition', t => {
        t.increments("id")
        t.integer("student_id").references("id").inTable("main.students").notNullable();
        t.string("from_stage")
        t.string("to_stage")
        t.datetime('created_at')
        t.string("transition_done_by")

    });

    await knex.schema.createTable('milestone_transition', t => {
        t.increments("id")
        t.integer("student_id").references("id").inTable("main.students").notNullable();
        t.string("from_stage")
        t.string("to_stage")
        t.datetime('created_at')
        t.string("transition_done_by")
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTable('milestone_transition').dropTable("interview_transition")
};

