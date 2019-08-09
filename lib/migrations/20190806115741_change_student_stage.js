const _ = require("underscore")

exports.up = async function(knex, Promise) {
    let students = await knex('students').select('*');
    let promises = [];
    _.each(students, (student) => {
        // change all students stage if it is completedTest change their toStage as completedTestWithDetails
        if (student.stage == "completedTest") {
            let promise = knex('stage_transitions').insert({
                fromStage: student.stage,
                toStage: "completedTestWithDetails",
                studentId: student.id,
                createdAt: new Date()
            })
            
            let promise2 = knex('students').update({
                stage: "completedTestWithDetails"
            }).where('id', student.id)
            promises.push(promise)
            promises.push(promise2)
        }
    })
    return Promise.all(promises)
};

exports.down = async function(knex, Promise) {
    
};
