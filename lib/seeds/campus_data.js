exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex("campus")
    .del()
    .then(() =>
      // Inserts seed entries
      knex("campus").insert([
        { id: 1, campus: "Pune" },
        { id: 2, campus: "Dharamshala" },
        { id: 3, campus: "Bangalore" },
        { id: 4, campus: "Sarjapura" },
      ])
    );
};
