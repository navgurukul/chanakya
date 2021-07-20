exports.seed = function (knex) {
  // Deletes ALL existing entries
  data = {
    droppedOutPune: "droppedOut",
    finallyJoinedPune: "finallyJoined",
    finalisedTravelPlansPune: "finalisedTravelPlans",
    selectedPune: "selected",
    droppedOutSarjapura: "droppedOut",
    finallyJoinedSarjapura: "finallyJoined",
    finalisedTravelPlansSarjapura: "finalisedTravelPlans",
    selectedSarjapura: "selected",
    droppedOutBangalore: "droppedOut",
    finallyJoinedBangalore: "finallyJoined",
    finalisedTravelPlansBangalore: "finalisedTravelPlans",
    selectedBangalore: "selected",
    droppedOutDharamshala: "droppedOut",
    finallyJoinedDharamshala: "finallyJoined",
    finalisedTravelPlansDharamshala: "finalisedTravelPlans",
    selectedDharamshala: "selected",
  };
  possibleList = Object.keys(data);
  return knex
    .select("*")
    .from("stage_transitions")
    .whereIn("from_stage", possibleList)
    .then(async (data) => {
      for (i of data) {
        // console.log(data[i.from_stage], i.from_stage);
        // console.log(i);
        await knex("stage_transitions")
          .update({ ...i, from_stage: data[i.from_stage] })
          .where("id", i.id);
      }
    })
    .then(async () => {
      return knex
        .select("*")
        .from("stage_transitions")
        .whereIn("to_stage", possibleList)
        .then(async (data) => {
          for (i of data) {
            // console.log(data[i.to_stage], i.to_stage);
            // console.log(i);
            await knex("stage_transitions")
              .update({ ...i, to_stage: data[i.to_stage] })
              .where("id", i.id);
          }
        });
    })
    .then(async () => {
      return knex
        .select("*")
        .from("students")
        .whereIn("stage", possibleList)
        .then(async (data) => {
          for (i of data) {
            // console.log(data[i.stage], i.stage, "students");
            // console.log(i);
            await knex("students")
              .update({ ...i, stage: data[i.stage] })
              .where("id", i.id);
          }
        });
    });
};
// knex seed:run --specific=removeCampusWiseData.js
