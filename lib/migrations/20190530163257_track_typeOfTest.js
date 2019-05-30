const _ = require('underscore');

exports.up = async function(knex, Promise) {
    await knex.schema.table('students', function(t){
        t.string('typeOfTest').after('stage').nullable();
    });

    let students = await knex('students').select('*');
    let promises = [];
    
    _.each(students, (student) => {
        if (student.partnerId) {
            promise = knex('students').update({
                typeOfTest: "offlineTest"
            })
            promises.push(promise)
        }else{
            promise = knex('students').update({
                typeOfTest: "onlineTest"
            })
            promises.push(promise)
        }
    })
    return Promise.all(promises)
};

exports.down = async function(knex, Promise) {
    return knex.schema.table('students', function(t) {
        t.dropColumn('typeOfTest');
    });
};
