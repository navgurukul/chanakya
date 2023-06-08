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
        path: '/stage/{school_id}',
        options: {
            description: "Get all stage",
            tags: ['api'],
            // auth:{
            //     strategy:'jwt'
            // },
            validate: {
                params: Joi.object({
                    school_id: Joi.number().integer().required(),
                }),
            },
            handler: async (request) => {
                const { stageServices } = request.services();
                try {
                    const getStage = await stageServices.getStagesBySchoolID(request.params.school_id);
                    logger.info('get all school stages')
                    return getStage;
                } catch (error) {
                    return error;
                }
            },
        },
    },

    {
        method: 'PUT',
        path: '/stage/update/{id}',
        options: {
            description: 'update stage',
            tags: ['api'],
            // auth:{
            //     strategy:'jwt',
            // }
            validate: {
                params: Joi.object({
                    id: Joi.number().integer().required(),
                }),
                payload: Joi.object({
                    stageName: Joi.string().optional(),
                    stageType: Joi.string().optional(),
                })
            },
            handler: async (request) => {
                const { stageServices } = request.services();
                try {
                    const data = await stageServices.updateStage(request.payload, request.params.id);
                    logger.info('update stage')
                    return data;
                } catch (error) {
                    return error;
                }
            },
        },
    },

    {
        method: 'DELETE',
        path: '/stage/{id}',
        options: {
            tags: ['api'],
            // auth:{
            //     strategy:'jwt'
            // }
            validate: {
                params: Joi.object({
                    id: Joi.number().integer().required(),
                }),
            },
            handler: async (request) => {
                const { stageServices } = request.services();
                try {
                    const data = await stageServices.deleteStage(
                        request.params.id
                    );
                    return data
                } catch (error) {
                    return error;
                }
            },
        },
    },

    {
        method: 'POST',
        path: '/stage/students',
        options: {
            description: 'add stages',
            tags: ['api'],
            // auth:{
            //     strategy:'jwt'
            // },
            validate: {
                payload:Joi.object({
                    student_id:Joi.number().integer().required(),
                    stage_id: Joi.number().integer().required(),
                    student_stage:Joi.string(),
                    transition_done_by:Joi.string()
                })                
            },
            handler: async (request) => {
                const { stageServices } = request.services();
                try {
                    const stageStudent = await stageServices.updateStagesInStudentsById(
                        request.payload
                    )
                    logger.info('add stages in school')
                    return stageStudent;
                } catch (error) {
                    return error;
                }
            },
        },
    },

];