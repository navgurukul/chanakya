const Schmervice = require('schmervice');
const { errorHandler } = require('../../errors');
const logger = require('../../server/logger');
const _ = require('lodash');
const { campusStageOfLearning } = require('../config/index.js')

module.exports = class CurrentStageServices extends Schmervice.Service {

    async getStagesByCurrentStageID(current_stage) {
        const { CurrentStage } = this.server.models()
        try {
            const stages = await CurrentStage.query().select('current_stage', 'option_stage', 'id')
                .skipUndefined()
                .where('current_stage', current_stage)
                .withGraphFetched('current_stages')
                .withGraphFetched('option_stages')
            let result = {};
            // let temp = {};

            stages.forEach(stage => {
                if (!result[stage.current_stages.stage]) {
                    result[stage.current_stages.stage] = [];
                }
                result[stage.current_stages.stage].push({ id: stage.option_stage, option_stage: stage.option_stages.stage });

            });

            const newData = {};
            Object.entries(result).forEach(([key, value]) => {
                const newKey = campusStageOfLearning[key] || key;
                newData[newKey] = value.map(obj => {
                    const newOptionStage = campusStageOfLearning[obj.option_stage] || obj.option_stage;
                    return { ...obj, option_stage: newOptionStage };
                });
            });        
            return [newData];

        } catch (error) {
            logger.error(JSON.stringify(error))
            return [errorHandler(error), null];
        }
    }

    // add current student stages
    async add_stages_by_current_student_stage(details) {
        const { CurrentStage } = this.server.models();
        try {
            const addstudent_stage = await CurrentStage.query().insert(details);
            return addstudent_stage;
            // console.log(addstudent_Stage,"iuytrdxcbn25...")
        } catch (error) {
            logger.error(JSON.stringify(error))
            return [errorHandler(error), null];
        }
    }
    // update student stage by id
    async updateStudentStageById(data, id) {
        const { CurrentStage } = this.server.models();
        try {
            const updateStudentStage = await CurrentStage.query().update({ current_stage: data.current_stage, option_stage: data.option_stage }).where('id', id);
            return updateStudentStage;
            // console.log(updateStudentStage,"oiurdresdc37..........")
        } catch (error) {
            logger.error(JSON.stringify(error))
            return [errorHandler(error), null];
        }
    }
    // Delete stage by id
    async deleteStudentStageById(id) {
        const { CurrentStage } = this.server.models();
        try {
            const studentData = await CurrentStage.query().deleteById(id);
            return studentData;
        } catch (error) {
            logger.error(JSON.stringify(error))
            return [errorHandler(error), null];
        }
    }
}

