exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex('campus').del()
    .then(() =>
      // Inserts seed entries
      knex('campus').insert([
        { campus: 'Pune' },
        { campus: 'Dharamshala' },
        { campus: 'Bangalore' },
        { campus: 'Sarjapura' },
      ]));
};
