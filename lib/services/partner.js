'use strict';

const Schmervice = require('schmervice');

module.exports = class PartnerService extends Schmervice.Service {

    async findById(id, txn=null) {
        const { Partner } = this.server.models();
        return await Partner.query(txn).throwIfNotFound().findById(id)
    }

    async findAll(txn) {
        const { Partner } = this.server.models();
        return await Partner.query(txn);
    }

    async update(id, details, txn=null) {
        const { Partner } = this.server.models();
        return await Partner.query(txn).update(details).where({id: id});
    }

    async create(details, txn=null) {
        const { Partner } = this.server.models();
        return await Partner.query(txn).insert(details);
    }

};
