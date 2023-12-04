exports.up = async (knex) => {
    await knex.schema.createTable('main.school_stage', (table)=>{
        table.increments('id');
        table.integer('school_id').references('id').inTable('main.school');
        table.string('stageName');
        table.string('stageType');
    })
};
exports.down = async (knex) => {
    await knex.schema.dropTable('school_stage');
};
