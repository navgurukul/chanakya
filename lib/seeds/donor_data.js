
exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('donor').del()
    .then(function () {
      // Inserts seed entries
      return knex('donor').insert([
        {id: 1, donor: 'Microsoft'},
        {id: 2, donor: 'KPMG'},
        {id: 3, donor: 'Accenture'}
      ]);
    });
};
