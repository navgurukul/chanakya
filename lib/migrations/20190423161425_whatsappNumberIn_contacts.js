const _ = require("underscore");

exports.up = async function(knex, Promise) {

    await knex.select('*').from('students')
    // create new contacts from the whatsapp column
    .then((students) => {
        let promises = [];
        _.each(students, (student) => {
            // a chunk of students might not have anything in the whatsapp field
            if (student.whatsapp == null) return
            // check if the whatsapp number already exists as a contact for the student
            let promise = knex('contacts').where({
                mobile: student.whatsapp,
                studentId: student.id
            })
            .then((contacts) => {
                // create a new contact if it doesn't exist
                if(contacts.length == 0) {
                    return knex('contacts').insert({
                        studentId: student.id,
                        mobile: student.whatsapp,
                        isWhatsapp: true,
                        createdAt: new Date()
                    });
                }
                // else update isWhatsapp of the existing contact
                else {
                    let contact = contacts[0];
                    return knex('contacts').update({
                        isWhatsapp: true
                    }).where({id: contact.id});
                }
            })
            promises.push(promise);
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
