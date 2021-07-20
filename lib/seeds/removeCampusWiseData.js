exports.seed = function (knex) {
  // Deletes ALL existing entries
  dataCampusWise = {
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
  possibleList = Object.keys(dataCampusWise);
  return knex
    .select("*")
    .from("stage_transitions")
    .whereIn("from_stage", possibleList)
    .then(async (data) => {
      for (i of data) {
        // console.log(dataCampusWise[i.from_stage], i.from_stage);
        // console.log(i);
        await knex("stage_transitions")
          .update({ ...i, from_stage: dataCampusWise[i.from_stage] })
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
            // console.log(dataCampusWise[i.to_stage], i.to_stage);
            // console.log(i);
            await knex("stage_transitions")
              .update({ ...i, to_stage: dataCampusWise[i.to_stage] })
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
            // console.log(dataCampusWise[i.stage], i.stage, "students");
            // console.log(i);
            await knex("students")
              .update({ ...i, stage: dataCampusWise[i.stage] })
              .where("id", i.id);
          }
        });
    });
};
// knex seed:run --specific=removeCampusWiseData.js
