'use strict';

const Schmervice = require('schmervice');

module.exports = class PartnerService extends Schmervice.Service {

    async findById(id, eagerExpr=null, txn=null) {
        const { Partner } = this.server.models();
        let query = Partner.query(txn).throwIfNotFound().findById(id);
        if (eagerExpr) {
            query = query.eager(eagerExpr);
        }
        return await query;
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

    async createAssessment(partner, assessmentName, txn=null) {
        const { PartnerAssessment } = this.server.models();
        const { assessmentService } = this.server.services();

        let { questions, questionSet } = await assessmentService.createQuestionSetForPartner();
        return questions;
        let partnerAssessment = PartnerAssessment.query(txn).insertGraph({
            name: assessmentName,
            questionSetId: questionSet.id,
            partnerId: partner.id
        });

        return partnerAssessment;
    }
};
