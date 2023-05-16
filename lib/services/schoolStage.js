const Schmervice = require("schmervice");
const { errorHandler } = require('../../errors');
const logger = require('../../server/logger');
const _ = require('lodash');

module.exports = class StageServices extends Schmervice.Service {
    // add stages
    async add_stage(details) {
        const { Stage } = this.server.models();
        try {
            const addStage = await Stage.query().insert(details);
            return addStage;
        } catch (error) {
            logger.error(JSON.stringify(error))
            return [errorHandler(error), null];
        }
    }

    // get all stage
    async getStagesBySchoolID(school_id) {
        const { Stage } = this.server.models();
        try {
            const allStage = await Stage.query().where('school_id',school_id).withGraphFetched('school_name');
            return allStage;
        } catch (error) {
            logger.error(JSON.stringify(error))
            return [errorHandler(error), null];
        }
    }

    // update stage by id
    async updateStage(data, stageId) {
        const { Stage } = this.server.models();
        try {
            const updateStage = await Stage.query().update({ stageName: data.stageName, stageType: data.stageType }).where('id', stageId);
            return updateStage;
        } catch (error) {
            logger.error(JSON.stringify(error))
            return [errorHandler(error), null];
        }
    }

    // Delete stage by id
    async deleteStage(stageId) {
        const { Stage, Student } = this.server.models();
        try {
            const getDetails = await Student.query().select('id').where('school_stage_id', stageId)
            // console.log(getDetails)
            for (const i of getDetails) {
                await Student.query().update({ school_stage_id: null }).where('id', i.id)
            }
            const data = await Stage.query().deleteById(stageId);
            return data;
        } catch (error) {
            logger.error(JSON.stringify(error))
            return [errorHandler(error), null];
        }
    }

    // update stages in students by id 
    async updateStagesInStudentsById(receive) {
        const { StudentStage, Student } = this.server.models()
        try {
            let sortByTime;
            let updateStage;
            const stageId = await Student.query().update({school_stage_id:receive.stage_id}).where('id',receive.student_id)
            const data = await StudentStage.query().where('student_id', receive.student_id)
            sortByTime = _.sortBy(data, 'created_at');
            if (data.length == 0) {
                updateStage = await StudentStage.query().insert({
                    student_id: receive.student_id,
                    to_stage: receive.student_stage
                })

            } else {
                updateStage = await StudentStage.query().insert({
                    student_id: receive.student_id,
                    from_stage: sortByTime[sortByTime.length - 1].to_stage,
                    to_stage: receive.student_stage
                })
            }

            return updateStage
        } catch (error) {
            return error
        }
    }

}





