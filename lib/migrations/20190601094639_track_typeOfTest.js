const _ = require('underscore');

exports.up = async (knex, Promise) => {
  await knex.schema.table('students', (t) => {
    t.string('typeOfTest').after('stage').nullable();
  });
  const students = await knex('students').select('*');
  const promises = [];

  _.each((students), (student) => {
    if (student.partnerId) {
      const promise = knex('students').update({
        typeOfTest: 'offlineTest',
      }).where('id', student.id);
      promises.push(promise);
    } else {
      const promise1 = knex('students').update({
        typeOfTest: 'onlineTest',
      }).where('id', student.id);

      promises.push(promise1);
    }
  });
  return Promise.all(promises);
};

exports.down = async (knex) => {
  const dropTable = knex.schema.table('students', (t) => {
    t.dropColumn('typeOfTest');
  });
  return dropTable;
};
