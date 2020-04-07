
exports.up = async (knex) => {
    await knex.schema.table('feedbacks', (t) => {
      t.string('audioRecording').after('toAssign').nullable();
    });
    
    await knex.schema.alterTable('feedbacks', (table) => {
      table.text('feedback').nullable().alter();
    });
};
  
exports.down = async (knex) => {
    await knex.schema.table('feedbacks', (t) => {
      t.dropColumn('audioRecording');
    });

    await knex.schema.alterTable('feedbacks', table => {
      table.text('feedback').notNullable().alter();
    });
};
  