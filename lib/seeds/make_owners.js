const _ = require('lodash');

const userFunction = async (knex, owner) => {
  const user = await knex('c_users').where('email', `${owner}@navgurukul.org`);
  if (user.length > 0) {
    return user[0].id;
  }
  return null;
};
const ownerFunction = async (
  knex,
  user_id,
  type = [],
  pending_interview_count = 0,
) => {
  const user = await knex('interview_owners').where('user_id', user_id);
  if (user.length > 0) {
    console.log('update', user_id, user);
    await knex('interview_owners')
      .update({
        available: true,
        type: type,
        pending_interview_count: pending_interview_count,
      })
      .where('user_id', user_id);
  } else {
    console.log('create', user_id);

    await knex('interview_owners').insert({
      user_id: user_id,
      available: true,
      type: type,
      pending_interview_count: pending_interview_count,
    });
  }
};
const userToAssign = async (knex, user_id) => {
  const user = await knex('c_users').where('id', user_id);
  if (user.length > 0) {
    return user[0].email.split('@')[0];
  }
  return null;
};
const feedbackStudents = async (knex, to_assign) => {
  let students = await knex('students')
    .whereIn('stage', [
      'pendingEnglishInterview',
      'pendingAlgebraInterview',
      'pendingCultureFitInterview',
    ])
    .join('feedbacks', { 'students.id': 'feedbacks.student_id' })
    .where('to_assign', to_assign)
    .distinct('student_id', 'stage', 'student_stage');
  students = students.filter(
    (student) => student.stage === student.student_stage,
  );
  return students;
};
const interviewType = (knex, to_assign) => knex('students')
  .whereIn('stage', [
    'pendingEnglishInterview',
    'pendingAlgebraInterview',
    'pendingCultureFitInterview',
  ])
  .join('feedbacks', { 'students.id': 'feedbacks.student_id' })
  .where('to_assign', to_assign)
  .distinct('stage');
const updateStudentOwner = (knex, studentIds, ownerId) => {
  console.log(studentIds, ownerId);
  return knex('students')
    .update({ current_owner_id: ownerId })
    .whereIn('id', studentIds);
};
const studentByOwner = async (knex, ownerId) => await knex('students').where('current_owner_id', ownerId);
const updateOwnerInterviewCount = async (knex, count, id) => await knex('interview_owners')
  .update({ pending_interview_count: count })
  .where('id', id);
const updateOwnerTableAndStudentTable = async (knex) => {
  await knex('students').update('current_owner_id', null);
  let user = await knex('interview_owners');
  // console.log(user, "user", user.length);
  for (var i of user) {
    const usertoassign = await userToAssign(knex, i.user_id);
    var students = await feedbackStudents(knex, usertoassign);
    students = students.map((student) => student.student_id);
    students = _.uniq(students);
    let type = await interviewType(knex, usertoassign);
    await updateStudentOwner(knex, students, i.id);
    type = type.map((types) => types.stage.slice(7));
    await ownerFunction(knex, i.user_id, type, students.length);
    console.log(students, 'students', type, usertoassign, i);
    // break;
  }
  user = await knex('interview_owners');
  for (var i of user) {
    students = await studentByOwner(knex, i.id);
    students = students.map((student) => student.id);
    students = _.uniq(students);
    await updateOwnerInterviewCount(knex, students.length, i.id);
  }
  console.log(user, 'user', user.length);

  return 0;
};
const notFoundUsers = [];
const mainFunction = async (knex) => {
  await knex('students')
    // .select("id", "user_id")
    .whereIn('stage', [
      'pendingEnglishInterview',
      'pendingAlgebraInterview',
      'pendingCultureFitInterview',
    ])
    .join('feedbacks', { 'students.id': 'feedbacks.student_id' })
    .whereNotNull('to_assign')
    .distinct('to_assign')
    // .whereNotNull("user_id")
    .then(async (students) => {
      // var da = await knex("interview_owners");
      console.log(students, students.length);
      for (const i of students) {
        const user_id = await userFunction(knex, i.to_assign);
        if (user_id != null) {
          await ownerFunction(knex, user_id);
        } else {
          notFoundUsers.push(i.to_assign);
        }
        // break;
      }
      await updateOwnerTableAndStudentTable(knex);
      console.log(notFoundUsers, 'notFoundUsers');
    });
};
const check = async (knex) => {};
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  return await mainFunction(knex);
};
// knex seed:run --specific=make_owners.js
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
