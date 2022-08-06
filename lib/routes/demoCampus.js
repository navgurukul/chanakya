const joi = require('joi');

module.exports = [
    {
        method: 'POST',
        path: '/demoCampus',
        options: {
            description: 'post your data.',
            tags: ['api'],
            validate: {
                payload: joi.object({
                    campus: joi.string(),
                    phone_no: joi.number().integer()
                }),
            },
        },

        handler: async (request) => {
            const { demoCampusService } = request.services();
            // console.log(request.payload,'////////////////////////');
            return { data: await demoCampusService.insertDemoCampus(request.payload.campus, request.payload.phone_no) };

        }

    },


    {
        method: 'GET',
        path: '/demoCampus',
        options: {
            description: 'get all campuses',
            tags: ['api'],
            validate: {
                query: joi.object({
                    limit: joi.number().integer().required()
                })
            }
        },

        handler: async (request) => {
            const { demoCampusService } = request.services();
            console.log((request.query.limit));
            const data = await demoCampusService.findall(request.query.limit);
            // console.log(data, "???????????????");
            return data;

        }

    },

    {
        method: 'GET',
        path: '/demoCampus/{id}',
        options: {
            description: 'get campus data by ID',
            tags: ['api'],
            validate: {
                params: joi.object({
                    id: joi.number().integer()
                }),
            }
        },
        handler: async (request) => {
            const { demoCampusService } = request.services();
            const datas = demoCampusService.readDatabyId(request.params.id);
            return datas;
        }
    },


    {
        method: 'PUT',
        path: '/demoCampus/{id}',
        options: {
            description: 'update campus data by Id',
            tags: ['api'],
            validate: {
                params: joi.object({
                    id: joi.number().integer(),
                }),
                payload: joi.object({
                    campus: joi.string(),
                    phone_no: joi.number().integer()

                })
            }
        },
        handler: async (request) => {
            const { demoCampusService } = request.services();
            const data = await demoCampusService.updateDataById(request.params.id, request.payload.campus, request.payload.phone_no);
            return data;
        }

    },

    {
        method: 'DELETE',
        path: '/demoCampus/{id}',
        options: {
            description: 'delete data by Id',
            tags: ['api'],
            validate: {
                params: joi.object({
                    id: joi.number().integer()
                })
            }
        },
        handler: async (request) => {
            const { demoCampusService } = request.services();
            const deleteDataById = await demoCampusService.deleteDataById(request.params.id)
            return deleteDataById;
        }
    }


]

