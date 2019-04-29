
exports.up = function(knex, Promise) {
    return knex.schema.createTable("stage_transitions", (table) => {
        table.increments();
        table.integer('studentId').references('students.id') 
        table.string('fromStage').nullable();
        table.string('toStage');
        table.datetime('createdAt')
    })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('stage_transitions');
};
