exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex('campus').insert([
    { id: 5, campus: 'Agartala (Tripura)' },
    { id: 6, campus: 'Delhi' },
    { id: 7, campus: 'Punjab' },
  ]);
};
// knex seed:run --specific=new_campus_data.js
