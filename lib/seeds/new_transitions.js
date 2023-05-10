/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
//   // Deletes ALL existing entries

exports.seed = async function (knex) {
  try {
    const transition1 = await knex.select('*').from('stage_transitions');
    const stage = await knex.select('*').from('new_student_stages');
    // console.log(stage,"get array with object the form of id and stages...11")
    const stageMap = new Map();
    // console.log(stageMap, "came object...13")
    for (const row of stage) {
      const { id, stage } = row;
      // console.log(id,stage,"all id and stages,...16")
      const p = stageMap.set(stage, id);
      // console.log(p,"get stages with ids like,'pendingAlgebraReInterview' => 2 ,iytr...")
    }
    for (const row of transition1) {
      let { student_id, from_stage, to_stage, created_at, transition_done_by } = row;
      let from_stage_id;
      let to_stage_id;
      if (from_stage == null) {
        from_stage_id = null
      }
      if (to_stage == null) {
        to_stage_id = null
      }
      to_stage_id = stageMap.get(to_stage);
      from_stage_id = stageMap.get(from_stage);
      // console.log(from_stage_id, from_stage, "eescxx")

      await knex("student_stage_transitions").insert({ student_id: student_id, from_stage: from_stage_id, to_stage: to_stage_id, created_at: created_at, transition_done_by: transition_done_by })
    }
  } catch (error) {
    console.log(error)
    return error
  }
}