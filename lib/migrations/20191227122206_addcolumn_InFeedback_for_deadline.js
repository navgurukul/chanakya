
exports.up = async (knex) => {
  await knex.schema.table('feedbacks', (t) => {
    t.datetime('deadlineAt').after('toAssign').nullable();
    t.datetime('finishedAt').after('deadlineAt').nullable();
  });

  await knex.schema.table('users', (t) => {
    t.string('mailId').after('user_name').notNullable();
  });
};

exports.down = async (knex) => {
  await knex.schema.table('feedbacks', (t) => {
    t.dropColumn('deadlineAt');
    t.dropColumn('finishedAt');
  });
  
  await knex.schema.table('users', (t) => {
    t.dropColumn('mailId')
  });
};
  