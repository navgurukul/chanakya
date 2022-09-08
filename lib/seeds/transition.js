const { knex } = require("../models/student");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  // await knex('table_name').del()
  const a = await knex('stage_transitions').select();
  const to_stage = ['enrolmentKeyGenerated', 'basicDetailsEntered', 'englishInterviewFail', 'pendingAlgebraInterview', 'algebraInterviewFail', 'pendingCultureFitInterview', 'pendingCultureFitReinterview', 'cultureFitInterviewFail', 'pendingParentConversation', 'parentConversationFail', 'selected', 'selectedAndJoiningAwaited', 'selectedButNotJoined', 'offerLetterSent', 'pendingTravelPlanning', 'finalisedTravelPlans', 'deferredJoining', 'finallyJoined', 'becameDisIntersested', 'notReachable', 'disqualifiedAfterDiversityFilter', 'diversityBasedDecisionPending', 'possibleDuplicate', 'caughtCheating', 'tuitionGroup', 'requestCallback', 'queryResolvedAfterCallback', 'testFailed'];
  for (const i of a) {
    delete i.id;
    if (to_stage.includes(i.to_stage)) {
      await knex('interview_transition').insert(i);
    } else {
      await knex('milestone_transition').insert(i);
    }
  }
};
