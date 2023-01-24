const Joi = require('joi');
const logger = require('../../server/logger');

module.exports = [
    {
        method: 'POST',
        path: '/stage',
        options: {
            description: 'add stages',
            tags: ['api'],
            // auth:{
            //     strategy:'jwt'
            // },
            validate: {
                payload: Joi.object({
                    school_id: Joi.number(),
                    stageName: Joi.string(),
                    stageType: Joi.string(),
                })
            },
            handler: async (request) => {
                const { stageServices } = request.services();
                try {
                    console.log(request.payload)
                    const stageData = await stageServices.add_stage(
                        request.payload
                    )
                    logger.info('add stages in school')
                    return stageData;
                } catch (error) {
                    return error;
                }
            },
        },
    },
    {
        method: 'GET',
        path: '/stage/all',
        options: {
            description: "Get all stage",
            tags: ['api'],
            // auth:{
            //     strategy:'jwt'
            // },
            handler: async (request) => {
                const { stageServices } = request.services();
                try {
                    const getStage = await stageServices.getAllStage();
                    logger.info('get all school stages')
                    return getStage;
                } catch (error) {
                    return error;
                }
            },
        },
    },
];