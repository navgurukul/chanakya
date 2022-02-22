exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex("interview_topic")
    .del()
    .then(() =>
      // Inserts seed entries
      knex("interview_topic").insert([
        { id: 1, name: "English and Algebra interview" ,created_at:new Date()},
        { id: 2, name: "Culture Fit interview" ,created_at:new Date()}
      ])
    );
};
// knex seed:run --specific=interview_topic.js
