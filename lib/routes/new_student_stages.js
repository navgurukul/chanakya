const Joi = require('joi');
const logger = require('../../server/logger');

module.exports = [
    {
        method: 'POST',
        path: '/new_stages/{stage_transitions}',
        options: {
            description: 'add new stages',
            tags: ['api'],
            // auth:{
            //     strategy:'jwt'
            // },
            validate: {
                payload: Joi.object({
                    stage: Joi.string()
                })
            },
            handler: async (request) => {
                const { newStageServices } = request.services();
                try {
                    // console.log(request.payload)
                    const New_data = await newStageServices.add_new_stages(request.payload)
                    logger.info('add new student stages')
                    return New_data;
                } catch (error) {
                    return error;
                }
            },
        },
    },

    {
        method: 'GET',
        path: '/new_stages/{from_stage}',
        options: {
            description: "Get all New stages",
            tags: ['api'],
            // auth:{
            //     strategy:'jwt'
            // },
            handler: async (request) => {
                const { newStageServices } = request.services();
                logger.info('List of all new stages.');
                return { data: await newStageServices.findall() };
            },
        }
    },
    {
        method: 'PUT',
        path: '/new_stages/update/{id}',
        options: {
            description: 'update student new stage by stage id',
            tags: ['api'],
            // auth:{
            //     strategy:'jwt',
            // }
            validate: {
                params: Joi.object({
                    id: Joi.number().integer().required(),
                }),
                payload: Joi.object({
                    stage: Joi.string()
                })
            },
            handler: async (request) => {
                const { newStageServices } = request.services();
                try {
                    const updatedata = await newStageServices.updateNewStudentStageById(request.payload, request.params.id);
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
        path: '/new_stages/delete/{id}',
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
                const { newStageServices } = request.services();
                try {
                    const delData = await newStageServices.deleteNewStageById(request.params.id);
                    return delData;
                } catch (error) {
                    return error;
                }
            },
        },
    }

]