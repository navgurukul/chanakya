const _ = require("underscore");

exports.up = async function(knex, Promise) {
    await knex.schema.table("students", function(t) {
        t.string("typeOfTest").after('stage').nullable();
    })
    let students = await knex("students").select("*");
    let promises = [];

    _.each((students), student => {
        
        if (student.partnerId) {
            let promise = knex('students').update({
                typeOfTest: "offlineTest"
            }).where('id', student.id)
            promises.push(promise)
        
        }else {
            let promise1 = knex('students').update({
                typeOfTest: 'onlineTest'
            }).where('id', student.id)
            
            promises.push(promise1)
        }
    });
    return Promise.all(promises);

};

exports.down = async function(knex, Promise) {
    return knex.schema.table('students', function(t) {
        t.dropColumn('typeOfTest');
    });
};