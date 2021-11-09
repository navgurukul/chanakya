exports.seed = function (knex) {
  return knex('students')
    .select('*')
    .then(async (data) => {
      for (var i of data) {
        // console.log(i);
        await knex('stage_transitions')
          .select('*')
          .where('student_id', i.id)
          .where('to_stage', i.stage)
          .orderBy('id')
          .then(async (data) => {
            if (data.length > 0) {
              const time = data.slice(-1)[0].created_at;
              console.log(time, i.id);
              await knex('students')
                .update({ last_updated: time })
                .where('id', i.id);
              // flag = true;
            }
          });
        // break;
      }

      return 0;
    });
};
// knex seed:run --specific=updateStudentsLatestUpdate.js
