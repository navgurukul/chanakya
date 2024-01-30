const Joi = require('joi');
const logger = require('../../server/logger');

module.exports = [
    {
        method: 'GET',
        path: '/current_student_stages/{current_stage}',
        options: {
            description: "Get all current stages by id",
            tags: ['api'],
            // auth:{
            //     strategy:'jwt'
            // },
            // validate: {
            //     params: Joi.object({
            //         current_stage: Joi.number().integer(),
            //     }),
            // },
            handler: async (request) => {
                const { currentStageServices } = request.services();
                try {
                    // const id = request.params.current_stage
                    // console.log(id)
                    const getStages = await currentStageServices.getStagesByCurrentStageID();
                    logger.info('get all current stages')
                    // console.log(getStages,"kjhfd25...")
                    return getStages;
                } catch (error) {
                    return error;
                }
            },
        }
    },

    {
        method: 'POST',
        path: '/current_student_stages/{option_stage}',
        options: {
            description: 'add stages by current_stage or option_stage options',
            tags: ['api'],
            // auth:{
            //     strategy:'jwt'
            // },
            validate: {
                payload: Joi.object({
                    current_stage: Joi.number().integer(),
                    option_stage: Joi.number().integer()
                })
            },
            handler: async (request) => {
                const { currentStageServices } = request.services();
                try {
                    // console.log(request.payload)
                    const student_stagesData = await currentStageServices.add_stages_by_current_student_stage(request.payload)
                    logger.info('add student stages in current_stage and option_stage')
                    return student_stagesData;
                } catch (error) {
                    return error;
                }
            },
        },
    },
    {
        method: 'PUT',
        path: '/current_student_stages/update/{id}',
        options: {
            description: 'update student stage by current and stage id',
            tags: ['api'],
            // auth:{
            //     strategy:'jwt',
            // }
            validate: {
                params: Joi.object({
                    id: Joi.number().integer().required(),
                }),
                payload: Joi.object({
                    current_stage: Joi.number().integer(),
                    option_stage: Joi.number().integer()
                })
            },
            handler: async (request) => {
                const { currentStageServices } = request.services();
                try {
                    const updatedata = await currentStageServices.updateStudentStageById(request.payload, request.params.id);
                    logger.info('update stage by id')
                    return updatedata;
                    // console.log(updatedata)
                } catch (error) {
                    return error;
                }
            },
        },
    },
    {
        method: 'DELETE',
        path: '/current_student_stages/delete/{id}',
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
                const { currentStageServices } = request.services();
                try {
                    const data = await currentStageServices.deleteStudentStageById(
                        request.params.id
                    );
                    return data
                } catch (error) {
                    return error;
                }
            },
        },
    },
]