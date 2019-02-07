'use strict';

const Schmervice = require('schmervice');

module.exports = class StudentService extends Schmervice.Service {

    async findById(id, txn=null) {
        const { Student } = this.server.models();
        return await Student.query(txn).throwIfNotFound().findById(id).eager('contacts');
    }

    async findAllByContact(mobile, txn=null) {
        const { Contact } = this.server.models();
        return await Contact.query(txn).where({mobile: mobile}).eager('student');
    }

    async findOneByContact(mobile, latest=true, txn=null) {
        /* if latest is true then does a descending sort otherwise an ascending one */
        const { Contact } = this.server.models();
        const sortType = latest ? "desc" : "asc";
        let results = await Contact.query(txn).where({mobile: mobile}).joinRelation('student').
                                orderBy('student.createdAt', sortType).limit(1).eager('student');
        return results[0];
    }

    async addIncomingCall(callType, contact, txn=null) {
        const { IncomingCall } = this.server.models();
        const incomingCall = await IncomingCall.query(txn).insert({
            contactId: contact.id,
            callType: callType
        })
        return incomingCall;
    }

    async create(mobile, stage, incomingCall=null, txn=null) {
        const { Student } = this.server.models();
        let graph = {
            stage: stage,
            contacts: [
                {mobile: mobile}
            ]
        }
        if (incomingCall != null) {
            graph.contacts[0].incomingCalls = [
                { callType: incomingCall }
            ];
        }
        return await Student.query(txn).insertGraph(graph);
    }

    async sendEnrolmentKey(options) {
        /* if mobile is present in options then creates a new student
           otherwise sends the enrolment key to an existing one */
        if (options.studentOrId && options.mobile) {
            throw "Both studentOrId and mobile cannot be present.";
        }
        if(options.fromHelpline == null) {
            options.fromHelpline = false
        }

        const { EnrolmentKey } = this.server.models();
        const { exotelService } = this.server.services();

        if (options.mobile) {
            let student = await this.create(options.mobile, "enrolmentKeyGenerated", options.fromHelpline ? "getEnrolmentKey" : null);
            let key = await EnrolmentKey.generateNewKey(student.id);
            let smsResponse = await exotelService.sendSMS(options.mobile, "enrolmentKeyGenerated", key);
        }
    }

};
