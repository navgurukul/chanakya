const Schmervice = require("schmervice");
const { errorHandler } = require('../../errors');
const logger = require('../../server/logger');

module.exports = class StageServices extends Schmervice.Service{
    // add stages
    async add_stage(details){
        const {Stage}=this.server.models();
        try {
            const addStage = await Stage.query().insert(details);
            return addStage;
        } catch (error) {
            logger.error(JSON.stringify(error))
            return[errorHandler(error),null];
    }
}

    // get all stage
    async getAllStage(){
        const {Stage}=this.server.models();
        try {
            const allStage = await Stage.query();
            return allStage;
        } catch (error) {
            logger.error(JSON.stringify(error))
            return[errorHandler(error),null];
        }
    }

    // update stage by id
   async updateStage(data,stageId){
    const {Stage}=this.server.models();
    try {        
        const updateStage = await Stage.query().update({stageName:data.stageName,stageType:data.stageType}).where('id',stageId);
        return updateStage;
    } catch (error) {
        logger.error(JSON.stringify(error))
        return[errorHandler(error),null];
    }
    }

    // Delete stage by id
   async deleteStage(stageId){
        const {Stage, Student}=this.server.models();
        try {
            const getDetails = await Student.query().select('id').where('school_stage_id',stageId)
            // console.log(getDetails)
            for(const i of getDetails){
                await Student.query().update({school_stage_id:null}).where('id',i.id)
            }
            const data = await Stage.query().deleteById(stageId);
            return data;
        } catch (error) {
            logger.error(JSON.stringify(error))
            return[errorHandler(error),null];
        }
    }

}





