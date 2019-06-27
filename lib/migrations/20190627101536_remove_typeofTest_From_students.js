const _ = require("underscore");

exports.up = async function(knex, Promise) {
    await knex.schema.table('enrolment_keys', (t) => {
        t.string('typeOfTest').after('totalMarks').nullable();
    });
    
    let students = await knex('students').select('*');
    let promises = []
    _.each(students, (student) => {
        // update the typeOfTest in enrolment_key table
        if(student.typeOfTest){
            let promise = knex('enrolment_keys').update({
                typeOfTest: student.typeOfTest
            }).where('studentId', student.id)
            promises.push(promise)
        }
    });
    
    return Promise.all(promises)
    
    // delete the column of typeOfTest from the student table
    .then(() => {
        return knex.schema.table('students', (t) =>{
            t.dropColumn('typeOfTest')
        });
    })

};

exports.down = async function(knex, Promise) {
    return knex.schema.table('enrolment_keys', (t) => {
        t.dropColumn('typeOfTest');
    })
};
