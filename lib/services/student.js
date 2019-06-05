'use strict';
const Schmervice = require('schmervice');
const _ = require("underscore");
const CONSTANTS = require('../constants');
const moment = require('moment')

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
                contacts: true,
                transitions: true,
            },
            questionSet: {
                testVersion: true
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
                    partner: true,
                    transitions: true,
                    contacts: true
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
    
    async findStudentsByPartnerId(partnerId, eagerExp=null, notIn=false, txn=null) {
        const { Student } = this.server.models();
        let q = Student.query(txn).eager(eagerExp);

        if (Array.isArray(partnerId)) {
            if (notIn) {
                return await q.whereNotIn('partnerId', partnerId);
            } else {
                return await q.whereIn('partnerId', partnerId);
            }
        } else {
            if (notIn) {
                return await q.whereNot('partnerId', partnerId);
            } else {
                return await q.where(('partnerId', partnerId))
            }
        }
    }
    
    async findAll(eagerExp=null, txn=null) {
        const { Student } = this.server.models();
        return await Student.query(txn).eager(eagerExp);
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
        details.transitions = [{ toStage: stage }];
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

        let student, key, smsResponse;
        if (options.mobile) {
            student = await this.create("enrolmentKeyGenerated", options.fromHelpline ? "getEnrolmentKey" : null, {mobile: options.mobile});
            key = await EnrolmentKey.generateNewKey(student.id);
            smsResponse = await exotelService.sendSMS(options.mobile, "enrolmentKeyGenerated", key);
        }

        return key;
    }

    _hasStudentStageChanged(student, currentStageOnSheet) {
        return student.stage !== currentStageOnSheet;
    }

    _isStageValid(currentStageOnSheet) {
        return CONSTANTS.studentStages.includes(currentStageOnSheet) === true;
    }

    shouldRecordStudentTranisition(student, currentStageOnSheet) {
        // if any stage would be added in the sheet in the future.
        if (!currentStageOnSheet)  {
            return {
                errorMessage: null,
                shouldRecord: false
            }
        }
        if (!this._isStageValid(currentStageOnSheet)) {
            return {
                errorMessage: `Can't recognize the stage ${currentStageOnSheet}`,
                shouldRecord: false
            }
        }

        // update student stage with the stage on the gSheet & create a stage transition record.
        if (this._hasStudentStageChanged(student, currentStageOnSheet)) {
            return {
                errorMessage: null,
                shouldRecord: true
            };
        } else {
            return {
                errorMessage: null,
                shouldRecord: false
            };
        }
    }


    hasPartnerNameChangedOnSheet(partners, student, partnerNameOnSheet) {        
        if (!partnerNameOnSheet){
            return {
                errorMessage: null,
                partnerId: null,
            }
        }

        const partner = partners[partnerNameOnSheet];

        if (partner) {
            if (partner.id !== student.partnerId) {
                return {
                    errorMessage: null,
                    partnerId: partner.id
                }
            } else {
                return {
                    errorMessage: null,
                    partnerId: null
                }
            }
            
        } else {
            return {
                partnerId: null,
                errorMessage: `Can't recognized partner name ${partnerNameOnSheet}`,
            }
        }
        // when partner name is in DB but not in gSheet.
    }

    studentStageNotChangeSince(student) {
        
        if (!student.transitions) {
            await student.$relatedQuery('transitions');
        }

        if(student.transitions.length > 0) {
            const lastStageChangeAt = _.max(_.map(student.transitions, (transitions) => transitions.createdAt))
            const currentDate = moment(new Date());
            return currentDate.diff(moment(lastStageChangeAt), 'days');
        } else {
            return null
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
