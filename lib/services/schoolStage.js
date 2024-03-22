const Schmervice = require("schmervice");
const { errorHandler } = require('../../errors');
const logger = require('../../server/logger');
const _ = require('lodash');

module.exports = class StageServices extends Schmervice.Service {
    // add sub stages
    async add_sub_stage(details, stage_id) {
        console.log('details', details)
        const data = details.sub_stages.map((item, index) => {
            return {
                school_id: details.school_id,
                stage_id: stage_id,
                stage_name: details.stage_name,
                sub_stages: item,
                // sub_stages_id: details.sub_stages_id[index]
            }
        })
        console.log('data', data)
        const { SubStage } = this.server.models();
        try {
            console.log('Lets see if it is coming here or not')
            const subStageArr = []
            for (const i of data) {
                const addSubStage = await SubStage.query().insert(i);
                subStageArr.push(addSubStage)
            }
            console.log('Chal gya?')
            return subStageArr;
        } catch (error) {
            logger.error(JSON.stringify(error))
            return [errorHandler(error), null];
        }
    }

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
            const allStage = await Stage.query()
            .where('school_id',school_id)
            .withGraphFetched('school_name')
            .then(data => data.map(item => 
                {
                    console.log('item', item)
                    return ({
                    id: item.id,
                    school_id: item.school_id,
                    stageName: item.stageName,
                    stageType: item.stageType,
                    name: item.school_name.name
            })}));
             return allStage           
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

}





