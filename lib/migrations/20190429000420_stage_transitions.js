const _ = require('underscore');

exports.up = async (knex) => {
  await knex.schema.createTable('stage_transitions', (table) => {
    table.increments();
    table.integer('studentId').references('students.id');
    table.string('fromStage').nullable();
    table.string('toStage');
    table.datetime('createdAt');
  });

  const students = await knex('students').select('*');
  const promises = [];
  _.each(students, (student) => {
    let promise;
    // if stage is `requestCallback` then create a stage transition from null to `requestCallback`
    if (student.stage === 'requestCallback') {
      promise = knex('stage_transitions').insert({
        studentId: student.id,
        fromStage: null,
        toStage: 'requestCallback',
        createdAt: student.createdAt,
      });
    } else if (student.stage === 'enrolmentKeyGenerated' || student.stage === 'completedTest') {
      promise = knex('enrolment_keys').select('*').where('studentId', student.id)
        .then((Key) => {
          const [key] = Key;
          // key = key[0];
          // if stage is `enrolmentKeyGenerated` then create a stage transition from
          // null to `enrolmentKeyGenerated`
          if (student.stage === 'enrolmentKeyGenerated') {
            return knex('stage_transitions').insert({
              studentId: student.id,
              fromStage: null,
              toStage: 'enrolmentKeyGenerated',
              createdAt: key.createdAt,
            });
          }
          // if stage is `completedTest` then create 2 transitions. one from null to
          // enrolmentKeyGenerated and the other from `enrolmentKeyGenerated` to `completedTest`
          if (student.stage === 'completedTest') {
            return knex('stage_transitions').insert([
              {
                studentId: student.id,
                fromStage: null,
                toStage: 'enrolmentKeyGenerated',
                createdAt: key.createdAt,
              },
              {
                studentId: student.id,
                fromStage: 'enrolmentKeyGenerated',
                toStage: 'completedTest',
                createdAt: key.endTime || student.createdAt,
              },
            ]);
          }
        });
      promises.push(promise);
    }
  });
};

exports.down = async (knex) => {
  const dropTable = knex.schema.dropTable('stage_transitions');
  return dropTable;
};
