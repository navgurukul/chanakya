exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex("donor")
    .del()
    .then(() =>
      // Inserts seed entries
      knex("donor").insert([
        { id: 1, donor: "Accenture C1" },
        { id: 2, donor: "Accenture C2" },
        { id: 3, donor: "Accenture C3" },
        { id: 4, donor: "Microsoft C1" },
        { id: 5, donor: "KPMG C1" },
        { id: 6, donor: "Sinch" },
      ])
    );
};
// knex seed:run --specific=donor_data.js
