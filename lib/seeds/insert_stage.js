/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {

  try {
    // -- Get all unique stages from the stage_transition table
    await knex.raw(
    'INSERT INTO new_student_stages (stage) SELECT DISTINCT to_stage FROM stage_transitions'
    );
  } catch (error) {
    console.log(error)
    return error
  }
};




[
  {

    "pendingEnglishInterview": [
      { id: 67, option_stage:"englishInterviewFail"},
      { id: 4, option_stage:"pendingAlgebraInterview"},
      { id: 45, option_stage: 'notRechable' },
      { id: 76, option_stage:"becameDisIntersested"},
      { id: 65, option_stage:"possibleDuplicate"}
    ]
  },
  {
    "pendingAlgebraInterview": [
      { id: 38, option_stage: 'algebraInterviewFail' },
      { id: 45, option_stage: 'notRechable' },
      { id: 76, option_stage: 'becameDisIntrested' },
      { id: 65, option_stage: 'possibleDuplicate' },
      { id: 69, option_stage: 'tutionGroup' }  
    ]
  }
]

