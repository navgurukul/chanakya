const Schmervice = require("schmervice");
const { logger } = require("handlebars");

module.exports = class StageServices extends Schmervice.Service{
    // add stages
    async add_stage(details){
        const {Stage}=this.server.models();
        try {
            const addStage = await Stage.query().insert(details);
            return addStage;
        } catch (error) {
            return error;
    }
}

    // get all stage
    async getAllStage(){
        const {Stage}=this.server.models();
        try {
            const allStage = await Stage.query();
            return allStage;
        } catch (error) {
            return error
        }
    }
}





