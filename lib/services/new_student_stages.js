const Schmervice = require('schmervice');
const { errorHandler } = require('../../errors');
const logger = require('../../server/logger');
const _ = require('lodash');

module.exports = class NewStageServices extends Schmervice.Service {
    // add new student stages
    async add_new_stages(details) {
        const { NewStages } = this.server.models();
        try {
            const addnew_stage = await NewStages.query().insert(details);
            return addnew_stage;
        } catch (error) {
            logger.error(JSON.stringify(error))
            return [errorHandler(error), null];
        }
    }

    // get all new stages
    async findall() {
        const { NewStages } = this.server.models();
        const data = await NewStages.query();
        return data;
    }

    // update New student stage by id
    async updateNewStudentStageById(data, id) {
        const { NewStages } = this.server.models();
        try {
            const updatedStage = await NewStages.query().update({ stage: data.stage }).where('id', id);
            return updatedStage;
        } catch (error) {
            logger.error(JSON.stringify(error))
            return [errorHandler(error), null];
        }
    }

    // Delete New stages by id
    async deleteNewStageById(id) {
        const { NewStages } = this.server.models();
        try {
            const deleteData = await NewStages.query().deleteById(id);
            return deleteData;
        } catch (error) {
            logger.error(JSON.stringify(error))
            return [errorHandler(error), null];
        }
    }
}