exports.up = async function(knex, Promise) {
    await knex.schema.createTable('english_options', (table) => {
        table.increments('id')
        table.text('text').nullable()
        table.integer('questionId').nullable();
        table.boolean('correct').nullable();
        table.datetime('createdAt').nullable();
    });

    await knex.schema.createTable('english_passages', (table) => {
        table.increments('id').nullable();
        table.text('passage').nullable();
        table.datetime('createdAt').nullable();
    })

    await knex.schema.createTable('english_questions', (table) => {
        table.increments('id')
        table.text('question').nullable();
        table.integer('passageId').nullable();
        table.string('type').nullable();
        table.datetime('createdAt').nullable();
    })

    await knex.schema.createTable("englishEnrolment_keys", (table) => {
        table.increments('id').nullable();
        table.string('key').nullable()
        table.datetime('startTime').nullable()
        table.datetime('endTime').nullable()
        table.integer('totalMarks').nullable()
        table.integer('passageId').nullable()
        table.datetime("createdAt").nullable();
    });

    await knex.schema.createTable('englishQuestion_attempts', (table) => {
        table.increments('id')
        table.integer('enrolmentKeyId', 10).unsigned().references('id').inTable('englishEnrolment_keys').nullable();
        table.integer('questionId').nullable()
        table.integer('selectedOptionId').nullable()
        table.datetime('createdAt').nullable()
    })
};

exports.down = async function(knex, Promise) {
    
};