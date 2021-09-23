const _ = require("lodash");
exports.seed = function (knex) {
  var a = {};
  // Deletes ALL existing entries
  return knex("students")
    .where("stage", "like", "%pending%")
    .join("feedbacks", { "students.id": "feedbacks.student_id" })
    .whereNotNull("to_assign")
    .distinct("to_assign")
    .then(async (data) => {
      console.log(data);
      for (var i of data) {
        const ale = await knex("c_users").where(
          "email",
          i.to_assign + "@navgurukul.org"
        );
        console.log(ale, i.to_assign);
        if (ale.length > 0) {
          console.log(ale[0].id);
          const value = await knex("interview_owners").where(
            "user_id",
            ale[0].id
          );
          var type = await knex("feedbacks")
            .distinct("student_stage")
            .where("to_assign", i.to_assign)
            .where("student_stage", "like", "%pending%");
          type = type
            .map((e) => {
              if (
                [
                  "pendingEnglishInterview",
                  "pendingAlgebraInterview",
                  "pendingCultureFitInterview",
                ].includes(e.student_stage)
              ) {
                return e.student_stage;
              }
              return null;
            })
            .filter((e) => e);
          console.log(type, "type");
          var count = 0;
          var count_i = await knex("students")
            .join("feedbacks", { "students.id": "feedbacks.student_id" })
            .where("to_assign", i.to_assign)
            .whereIn("student_stage", type);
          count_i = count_i.filter((e) => {
            return e.stage === e.student_stage;
          });
          count += count_i.length;
          type = type.map((e) => e.slice(7));
          console.log(type, "tye");
          if (value.length === 0) {
            if (count_i.length > 0) {
              await knex("interview_owners").insert({
                user_id: ale[0].id,
                available: true,
                type: type,
                pending_interview_count: count,
              });
              console.log({
                user_id: ale[0].id,
                available: true,
                type: type,
                pending_interview_count: count,
              });
            }

            console.log("create owner");
          } else {
            await knex("interview_owners")
              .update({
                type: type,
                pending_interview_count: count,
              })
              .where("user_id", ale[0].id);
          }
        }
      }
      console.log(a);
    });
};
// knex seed:run --specific=remove_duplicate.js
// [
//   { stage: 'pendingAlgebraReInterview' },
//   { stage: 'pendingAlgebraInterview' },
//   { stage: 'pendingEnglishInterview' },
//   { stage: 'pendingCultureFitReinterview' },
//   { stage: 'pendingAlgebraInterview_Unreachable' },
//   { stage: 'pendingTravelPlanning' },
//   { stage: 'pendingParentConversation' },
//   { stage: 'pendingCultureFitInterview' },
//   { stage: 'pendingTravelPlanning_Unreachable' }
// ]
