const Schmervice = require('schmervice');

module.exports = class DemoCampusService extends Schmervice.Service {
    async insertDemoCampus(campus, phone_no) {
        const { DemoCampus } = this.server.models()
        try {
            const demo = await DemoCampus
                .query()
                .insert({ campus, phone_no })
            // return 'data inserted'
            return demo;
        } catch (error) {
            console.log(error);
            return 'Error is coming...'

        }
    }

    async findall(limit) {
        const { DemoCampus } = this.server.models();
        try {
            const demo = await DemoCampus
                .query().limit(limit)
            return demo;
        } catch (error) {
            // console.log(error);
            return 'Error is coming...'

        }
    }

    async readDatabyId(id) {
        const { DemoCampus } = this.server.models()
        try {
            const read = await DemoCampus.query()
                .where({ id })
            console.log(read);
            return read;
        } catch (error) {
            console.log(error);
            return 'data is not coming by id...'
        }
    }



    async updateDataById(id, campus, phone_no) {
        const { DemoCampus } = this.server.models();
        try {
            await DemoCampus.query()
                .where({ id }).update({ campus, phone_no })
            return 'updated';
        } catch (error) {
            console.log(error);
            return 'data is not updated';
        }
    }


    async deleteDataById(id) {
        const { DemoCampus } = this.server.models();
        try {
            const deleteData = await DemoCampus.query()
                .where({ id }).delete()
            return 'data deleted';
            // return deleteData;
        } catch (error) {
            console.log(error);
            return 'data NOT deleted'
        }
    }
}

