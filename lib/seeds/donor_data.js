exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex("donor")
    .del()
    .then(() =>
      // Inserts seed entries
      knex("donor").insert([
        { donor: "Accenture C1" },
        { donor: "Accenture C2" },
        { donor: "Accenture C3" },
        { donor: "Microsoft" },
        { donor: "KPMG C1" },
      ])
    );
};
