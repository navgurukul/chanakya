const _ = require("underscore");

exports.up = async function(knex, Promise) {

    await knex.select('*').from('students')
    // get list of all question sets to get the relevant enrolment keys attached to them
    .then((whatsappNumber) => {
        sets = [];
        _.each(whatsappNumber, (student) => {
            if (student.whatsapp) {
                sets.push([ student.whatsapp, student ]);
            }
        });
        sets = _.object(sets);
        return sets;
    })

    // update the isWhatsapp with the studentId of the attached whatsapp number
    .then((whatsappNumber) => {
        let promises = [];
        _.each(whatsappNumber, (student, id) => {
            let whatsapp = student.whatsapp;
            promises.push(
                knex('contacts').where({
                    mobile: whatsapp
                }).update({
                    isWhatsapp: true
                })
            );
        });
        return Promise.all(promises);
    })
    // delete the column of whatsapp from the student table
    .then(() => {
        return knex.schema.table('students', (t) => {
            t.dropColumn('whatsapp');
        });
    })

};

exports.down = async function(knex, Promise) {

};