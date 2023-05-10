const Schmervice = require('schmervice');
const { errorHandler } = require('../../errors');
const logger = require('../../server/logger');
const _ = require('lodash');


module.exports = class StageTransitionsService extends Schmervice.Service {

    // update stages in students by id 
    async updateAndPostStagesInStudentsById(student_id, stage_id) {
        const { StudentTransitions, Student, NewStages } = this.server.models()
        try {
            // getting name from new_stage
            const find_stage = await NewStages.query().select().where({id:stage_id});
            let stageName = find_stage[0].stage

            const student_stage_update = await Student.query().where("id", student_id).update({ new_stages:stageName})

            // let sortByTime;
            // let updateStage;
            const data = await StudentTransitions.query().where('student_id', student_id)

            // get existing transitions
            const existingTransitions = await StudentTransitions.query().where('student_id', student_id).orderBy('created_at', 'desc');

            // insert new transition
            let transitionData = { student_id: student_id, to_stage: stage_id };
            if (existingTransitions.length > 0) {
                transitionData.from_stage = existingTransitions[0].to_stage;
            }

            const newTransition = await StudentTransitions.query().insert(transitionData);
            return newTransition;


        } catch (error) {
            return error
        }
    }


}