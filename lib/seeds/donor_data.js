exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex('donor').del()
    .then(() =>
      // Inserts seed entries
      knex('donor').insert([
        { donor: 'Microsoft' },
        { donor: 'KPMG' },
        { donor: 'Accenture' },
      ]));
};
