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
}





