const _ = require('underscore');

exports.up = async function (knex, Promise) {
  // await knex.schema.table('enrolment_keys', (t) => {

  await knex.select('*').from('question_sets')
    // get list of all question sets to get the relevant enrolment keys attached to them
    .then((questionSets) => {
      sets = [];
      _.each(questionSets, (qSet) => {
        if (qSet.enrolmentKeyId) {
          sets.push([qSet.id, qSet]);
        }
      });
      sets = _.object(sets);
      return sets;
    })
    // create the column to track question set ID on the enrolment keys table
    .then((questionSets) => knex.schema.table('enrolment_keys', (t) => {
      t.integer('questionSetId', 11).after('totalMarks').references('id').inTable('question_sets');
    }).then(() => questionSets))
    // update the enrolment keys with the id of the attached question set
    .then((questionSets) => {
      const promises = [];
      _.each(questionSets, (qSet, id) => {
        const { enrolmentKeyId } = qSet;
        promises.push(
          knex('enrolment_keys').where({
            id: enrolmentKeyId,
          }).update({
            questionSetId: qSet.id,
          }),
        );
      });
      return Promise.all(promises);
    })
    // delete the column of enrolment key id from the question sets table
    .then(() => knex.schema.table('question_sets', (t2) => {
      t2.dropForeign('enrolmentKeyId', 'enrolmentKey');
      t2.dropIndex('enrolmentKeyId', 'enrolmentKey_idx');
      t2.dropColumn('enrolmentKeyId');
    }));

  // });
};

exports.down = async function (knex, Promise) {

};
