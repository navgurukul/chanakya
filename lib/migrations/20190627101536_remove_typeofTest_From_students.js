const _ = require('underscore');

exports.up = async (knex) => {
  await knex.schema.table('enrolment_keys', (t) => {
    t.string('typeOfTest').after('totalMarks').nullable();
  });

  const students = await knex('students').select('*');
  const promises = [];
  _.each(students, (student) => {
    // update the typeOfTest in enrolment_key table
    if (student.typeOfTest) {
      const promise = knex('enrolment_keys').update({
        typeOfTest: student.typeOfTest,
      }).where('studentId', student.id);
      promises.push(promise);
    }
  });

  return Promise.all(promises)

    // delete the column of typeOfTest from the student table
    .then(() => knex.schema.table('students', (t) => {
      t.dropColumn('typeOfTest');
    }));
};

exports.down = async (knex) => {
  const dropTable = knex.schema.table('enrolment_keys', (t) => {
    t.dropColumn('typeOfTest');
  });
  return dropTable;
};
