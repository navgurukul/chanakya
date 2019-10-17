
exports.up = async (knex) => {
  await knex.schema.createTable('english_options', (table) => {
    table.increments('id').notNullable();
    table.text('text').notNullable();
    table.integer('questionId').notNullable();
    table.boolean('correct').notNullable();
    table.datetime('createdAt').nullable();
  });
  await knex.schema.createTable('english_passages', (table) => {
    table.increments('id').notNullable();
    table.text('passage').notNullable();
    table.datetime('createdAt').nullable();
  });
  await knex.schema.createTable('english_questions', (table) => {
    table.increments('id').notNullable();
    table.text('question').notNullable();
    table.integer('passageId').notNullable();
    table.string('type').notNullable();
    table.datetime('createdAt').nullable();
  });
  await knex.schema.createTable('englishEnrolment_keys', (table) => {
    table.increments('id').notNullable();
    table.integer('keyId', 10).unsigned().references('id').inTable('enrolment_keys')
      .notNullable();
    table.datetime('startTime').nullable();
    table.datetime('endTime').nullable();
    table.integer('totalMarks').nullable();
    table.integer('passageId').nullable();
    table.datetime('createdAt').nullable();
  });
  await knex.schema.createTable('englishQuestion_attempts', (table) => {
    table.increments('id').notNullable();
    table.integer('enrolmentKeyId', 10).unsigned().references('id').inTable('englishEnrolment_keys')
      .notNullable();
    table.integer('questionId').nullable();
    table.integer('selectedOptionId').nullable();
    table.datetime('createdAt').nullable();
  });
};

exports.down = async () => {

};
