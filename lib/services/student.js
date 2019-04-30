'use strict';
const Schmervice = require('schmervice');
const _ = require("underscore");
const CONSTANTS = require('../constants');

module.exports = class StudentService extends Schmervice.Service {

    async findById(id, txn=null) {
        const { Student } = this.server.models();
        return await Student.query(txn).throwIfNotFound().findById(id).eager('contacts');
    }

    async findEnrolmentKeyByKey(key, notIn=false) {
        const { EnrolmentKey } = this.server.models();
        let q = EnrolmentKey.query().eager({
            student: {
                partner: true,
                contacts: true
            }
        });

        if (Array.isArray(key)) {
            if (notIn) {
                return await q.whereNotIn('key', key);
            } else {
                return await q.whereIn('key', key);
            }
        } else {
            if (notIn) {
                return await q.whereNotIn('key', key);
            } else {
                return await q.where({key: key});
            }
        }


    }

    async findIncomingCallById(id, notIn=false) {
        const { IncomingCall } = this.server.models();
        let q = IncomingCall.query().eager({
            contact: {
                student: {
                    partner: true
                }
            }
        });

        if (Array.isArray(id)) {
            if (notIn) {
                return await q.whereNotIn('id', id);
            } else {
                return await q.whereIn('id', id);
            }
        } else {
            if (notIn) {
                return await q.whereNot('id', id);
            } else {
                return await q.findById(id);
            }
        }
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

    async create(stage, incomingCall=null, details={}, txn=null) {
        const { Student } = this.server.models();
        details.stage = stage;

        // pull out whatsapp & mobile keys
        let whatsapp = details.whatsapp;
        delete details.whatsapp
        let mobile = details.mobile;
        delete details.mobile

        // add mobile & whatsapp as contacts
        details.contacts = [
            {mobile: mobile, isWhatsapp: false}
        ]
        if (whatsapp) {
            details.contacts.push({
                mobile: whatsapp,
                isWhatsapp: true
            });
        }

        // if incoming call is specified create it on the first contact
        // TODO: this might be shitty logic need to change it sometime
        if (incomingCall != null) {
            details.contacts[0].incomingCalls = [
                { callType: incomingCall }
            ];
        }

        // add a transition
        details.transitions = [
            {fromStage: null, toStage: stage}
        ];

        return await Student.query(txn).insertGraph(details);
    }

    async sendEnrolmentKey(options, txn=null) {
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
            let student = await this.create("enrolmentKeyGenerated", options.fromHelpline ? "getEnrolmentKey" : null, {mobile: options.mobile});
            let key = await EnrolmentKey.generateNewKey(student.id);
            let smsResponse = await exotelService.sendSMS(options.mobile, "enrolmentKeyGenerated", key);
        }
    }

    swapEnumKeysWithValues(details) {
        // some fields are ints on model but string on API for more usability
        // do the required massaging as per the model using mappings in constants
        let specialFields = ['gender', 'qualification', 'currentStatus', 'caste', 'religon', 'schoolMedium'];
        _.each(specialFields, (field) => {
            if (details[field]) {
                details[field] = CONSTANTS.studentDetails[field][ details[field] ]
            }
        });
        return details;
    }

};
