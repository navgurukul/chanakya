'use strict';

/*
* 1. The rows can be related to one of the two tables - `incomingCalls` or `enrolmentKeys`
* 2. For the enrolment key it will be linked using the enrolment key and not the ID.
* 3. For the incomingCall it will be linked using the ID of the incoming Call.
* 4. So if a student has answered multiple tests, there will be multiple rows for him.
*/

const GoogleSpreadsheet = require("google-spreadsheet");
const { promisify } = require("util");
const CONSTANTS = require('../constants');
const sendEmail = require('./sendEmail');
const _ = require('underscore');
const { google } = require("googleapis");
const moment = require("moment");
const fs = require("fs");

let internals = {}

internals.getColumnNameFromPosition = function(num) {
  for (var ret = '', a = 1, b = 26; (num -= a) >= 0; a = b, b *= 26) {
    ret = String.fromCharCode(parseInt((num % b) / a) + 65) + ret;
  }
  return ret;
}

internals.getA1RangeNotation = function(startCol, startRow, endCol, endRow) {
    if ( Number.isInteger(Number(startCol)) ) {
        startCol = internals.getColumnNameFromPosition(startCol);
    }
    if ( Number.isInteger(Number(endCol)) ) {
        endCol = internals.getColumnNameFromPosition(endCol);
    }
    if (!startRow) {
        startRow = '';
    }
    if (!endRow) {
        endRow = '';
    }
    return `${startCol}${startRow}:${endCol}${endRow}`
}

internals.getDateStringForGSheets = function(isoDate) {
    if (!isoDate) {
        return null;
    }
    let date = moment(isoDate);
    return date.format("YYYY-MM-DD HH:mm:ss.000");
}

internals.swapValuesWithEnumKeys = function(obj) {
    let keysToSwap = ['gender', 'qualification', 'currentStatus', 'schoolMedium', 'religon', 'caste'];
    _.each(keysToSwap, (key) => {
        let invertedEnum = _.invert( CONSTANTS.studentDetails[key] );
        if (obj[key]) {
            obj[key] = invertedEnum[ obj[key] ];
        }
    });
    return obj;
}

internals.stages = {
    'requestCallback': 'requestCallback',
    'enrolmentKeyGenerated': 'enrolmentKeyGenerated',
    'completedTest': 'completedTest',
    'Pending Callback for Query': 'pendingCallbackForQuery',
    '(For Review) Callback Query Resolved': 'forReviewCallbackQueryResolved',
    'Query Resolved after Callback': 'queryResolvedAfterCallback',
    'Test Passed': 'testPassed',
    'Test Failed': 'testFailed',
    'Pending Algebra Interview': 'pendingAlgebraInterview',
    '(For Review) Algebra Interview Done': 'forReviewAlgebraInterviewDone',
    'Pending Algebra Re-Interview': 'pendingAlgebraReInterview',
    'Algebra Interview Fail': 'algebraInterviewFail',
    'Algebra Interview Waitlisted': 'algebraInterviewWaitlisted',
    'Pending Culture Fit Interview': 'pendingCultureFitInterview',
    'Culture Fit Re-Interview': 'pendingCultureFitReinterview',
    '(For Review) Culture Fit Interview Done': 'forReviewCultureFitInterviewDone',
    'Pending English Interview': 'pendingEnglishInterview',
    '(For Review) English Interview': 'forReviewEnglishInterview',
    'English Interview Fail': 'englishInterviewFail',
    'Culture Fit Interview Waitlisted': 'cultureFitInterviewWaitlisted',
    'Culture Fit Interview Fail': 'cultureFitInterviewFail',
    'Pending Parent Conversation': 'pendingParentConversation',
    'Parent Conversation Fail': 'parentConversationFail',
    'Pending Travel Planning': 'pendingTravelPlanning',
    'Finalised Travel Plans': 'finalisedTravelPlans',
    'Probation': 'probation',
    'Finally Joined': 'finallyJoined',
    'Dropped Out': 'droppedOut',
    'Became Disinterested': 'becameDisIntersested',
    'Possible Duplicate': 'possibleDuplicate',
    'Need Action': 'needAction',
    'Demo': 'demo',
    'Disqualified (Unreachable)': 'disqualifiedUnreachable',
    'English Interview Waitlisted': 'englishInterviewWaitlisted',
    'Sent Back After Probation': 'sentBackAfterProbation',
    'Caught Cheating': 'caughtCheating'
}
internals.stageMapping = (stage) => {
    // kept stage as it is if not present so
    // we can catch releative error and sent through email
    return _.keys(internals.stages).includes(stage) ? internals.stages[stage]: stage
}

module.exports = class ChanakyaGSheetSync {
    constructor(services) {
        // using `google-spreadsheet` for some use cases
        // but it doesn't support bulk updates so will be using the raw google node lib too
        this.doc = new GoogleSpreadsheet(CONSTANTS.gSheet.sheetId);
        _.each(_.keys(this.doc), (key) => {
            this.doc[key] = promisify(this.doc[key]);
        })

        // read the private key from the file
        let privateKey = fs.readFileSync(CONSTANTS.gSheet.privateKey);
        this.privateKey = privateKey.toString();

        // initializing the basic google node lib
        this.googleJwtClient = new google.auth.JWT(CONSTANTS.gSheet.clientEmail, null, this.privateKey, [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/calendar'
        ]);
        this.googleJwtClient.authorize = promisify(this.googleJwtClient.authorize);

        this.sheetsBaseApi = null;
        this.headers = {};
        this.initDone = false;
        this.rows = null;
        this.mainWorkSheetIndex = 0;
        this.mainWorkSheetId = null;
        this.studentService = services.studentService;
        this.assessmentService = services.assessmentService;
        this.partnerService = services.partnerService
        this.reports = {
            keysAdded: 0,
            incomingCallAdded: 0,
            syncErrors: {
                platform : {
                    enrolmentKeys: [], // {key: 'EDT567', errors: ['errors']}
                    incomingCalls: []  // {id: 3, errors: ['errors']}
                },
            }
        }
    }

    async init() {

        await this.googleJwtClient.authorize();
        this.sheetsBaseApi = google.sheets({ version: "v4", auth: this.googleJwtClient});

        await this.doc.useServiceAccountAuth({
            client_email: CONSTANTS.gSheet.clientEmail,
            private_key: this.privateKey
        });

        // set the correct work sheet ID
        let spreadsheet = await promisify(this.sheetsBaseApi.spreadsheets.get)({
            spreadsheetId: CONSTANTS.gSheet.sheetId
        });
        _.each(spreadsheet.data.sheets, (sheet) => {
            let prop = sheet.properties;
            if (prop.title == CONSTANTS.gSheet.mainSheetName) {
                this.mainWorkSheetIndex = prop.index + 1;
                this.mainWorkSheetId = prop.sheetId
            }
        });
        if (this.mainWorkSheetIndex == 0) {
            throw Error("The worksheet with the name `{}` doesn't exist.".format(CONSTANTS.gSheet.mainSheetName));
        }

        // get the headers
        await this._getHeaders()

        this.initDone = true;
    }

    async getAllRows() {

        let a1Range = internals.getA1RangeNotation("A", 2, _.keys(this.headers).length, null);
        return promisify(this.sheetsBaseApi.spreadsheets.values.get)({
            spreadsheetId: CONSTANTS.gSheet.sheetId,
            range: `${CONSTANTS.gSheet.mainSheetName}!${a1Range}`
        })
        .then((response) => {
            let rows = response.data.values;
            let headerKeys = _.keys(this.headers);
            let sheetRows = _.map(rows, (row) => {
                let sheetRow = {};
                _.each(headerKeys, (key) => {
                    sheetRow[key] = row[ this.headers[key].col-1 ];
                })
                return sheetRow
            });
            return sheetRows;
        })
    }

    async _getHeaders() {
        // TODO: If there is a gap of a column among two headers then return an error
        return this.doc.getCells(this.mainWorkSheetIndex, {'min-row': 1, 'max-row': 1})
            .then((cells) => {
                _.each(cells, (cell) => {
                    this.headers[cell._value] = {
                        row: cell.row,
                        col: cell.col
                    }
                });
            });
    }

    async addRows(rows) {
        console.log(rows)
        // get all rows from google sheets
        let allRows = await this.getAllRows();

        let sheetRows = _.map(rows, (row) => {
            let sheetRow = Array(_.keys(this.headers).length).fill(null);
            _.each(_.keys(row), (key) => {
                sheetRow[this.headers[key].col-1] = row[key];
            })
            return sheetRow;
        });

        // make the api call to add the rows
        let a1Range = internals.getA1RangeNotation("A", allRows.length+1, _.keys(this.headers).length, null);
        await this.sheetsBaseApi.spreadsheets.values.append({
            spreadsheetId: CONSTANTS.gSheet.sheetId,
            range: `${CONSTANTS.gSheet.mainSheetName}!${a1Range}`,
            insertDataOption: "INSERT_ROWS",
            valueInputOption: "USER_ENTERED",
            resource: { values: sheetRows }
        });
    }

    _addStudentDetailsToRow(row, student) {
        const stageNotChangeSince = this.studentService.studentStageNotChangeSince(student);
        row = _.extend(row, {
            name: student.name,
            dob: internals.getDateStringForGSheets(student.dob),
            gender: student.gender,
            email: student.email,
            state: CONSTANTS.studentDetails.states[student.state] || null,
            city: student.city,
            pinCode: student.pinCode,
            qualification: student.qualification,
            currentStatus: student.currentStatus,
            schoolMedium: student.schoolMedium,
            religon: student.religon,
            caste: student.caste,
            stageNotChangeSince: stageNotChangeSince
        });

        // add gps/lat long if they exist
        if (student.gpsLat != null && student.gpsLong != null) {
            row['gpsLatLong'] = `${student.gpsLat}, ${student.gpsLong}`;
        }

        // add contacts
        _.each(student.contacts, (contact, index) => {
            row['mobile'+(index+1)] = contact.mobile;
        });

        // add partner name (if partner details are available)
        if (student.partner) {
            row.partnerName = student.partner.name
        }
        
        row = internals.swapValuesWithEnumKeys(row);
        return row
    }
    async syncPlatformIncomingCallsWithGSheet(existingCallIds) {
        console.log('Updating the students record on the platform from gSheet for IncomingCalls.')
        let incomingCalls = await this.getIncomingCallsObject(existingCallIds);
        let partners = await this.getPartnersObject()

        _.each(existingCallIds, async (call) => {
            let  dbCall = incomingCalls[call.id]

            if(!dbCall){
                return
            }

            let syncError = {
                id: dbCall.id,
                errors: [],
                row: call.row
            }

            let studentDetails = {}

            // Record Stage change
            let transitionResponse =
                this.studentService.shouldRecordStudentTranisition(
                    dbCall.contact.student,
                    call.student.actualStage,
                )

            // Recording the Actual Stage Column
            if (transitionResponse.shouldRecord === true) {
                studentDetails['stage'] = call.student.actualStage
            } else if (transitionResponse.errorMessage !== null) {
                // recording errors to send through email
                syncError['errors'].push(transitionResponse.errorMessage)
            }


            let partnerResponse = 
                this.studentService.hasPartnerNameChangedOnSheet(
                    partners,
                    dbCall.contact.student,
                    call.student.partnerName
                )
            if (partnerResponse.partnerId) {
                studentDetails['partnerId'] = partnerResponse.partnerId
            } else if (partnerResponse.errorMessage !== null) {
                // recording errors to send through email
                syncError['errors'].push(partnerResponse.errorMessage)
            }


            // Only the keys which has any errors
            if (syncError.errors.length > 0) {
                this.reports.syncErrors.platform.incomingCalls.push(syncError)
            }

            //  call the api only if any column has changed
            if (_.keys(studentDetails.length !== 0)) {
                await this.assessmentService.patchStudentDetailsWithoutKeys(dbCall.contact.student, studentDetails)
            }
        });
    }

    async syncPlatformEnrolmentKeysWithGSheet(existingKeys) {
        console.log("Updating the students record on the platform from gSheet for enrolmentKeys.")
        let enrolmentKeys = await this.getEnrolmentKeysObject(existingKeys);
        let partners = await this.getPartnersObject()

        _.each(existingKeys, async (key) => {
            let  dbKey = enrolmentKeys[key.key]

            if(!dbKey){
                return
            }

            let syncError = {
                key: dbKey.key,
                errors: [],
                row: key.row
            }

            let studentDetails = {}

            let transitionResponse =
                this.studentService.shouldRecordStudentTranisition(
                    dbKey.student,
                    key.student.actualStage,
                )

            // Recording the Actual Stage Column
            if (transitionResponse.shouldRecord === true) {
                studentDetails['stage'] = key.student.actualStage
            } else if (transitionResponse.errorMessage !== null) {
                // recording errors to send through email
                syncError['errors'].push(transitionResponse.errorMessage)
            }
            
            let partnerResponse = 
                this.studentService.hasPartnerNameChangedOnSheet(
                    partners,
                    dbKey.student,
                    key.student.partnerName
                )
            if (partnerResponse.partnerId) {
                console.log(dbKey.student)
                studentDetails['partnerId'] = partnerResponse.partnerId
            } else if (partnerResponse.errorMessage !== null) {
                // recording errors to send through email
                syncError['errors'].push(partnerResponse.errorMessage)
            }

            // Only the keys which has any errors
            if (syncError.errors.length > 0) {
                this.reports.syncErrors.platform.enrolmentKeys.push(syncError)
            }
            //  call the api only if any column has changed
            if (_.keys(studentDetails.length !== 0)) {
                await this.assessmentService.patchStudentDetails(dbKey, studentDetails);
            }
        });
    }

    async addPendingEnrolmentKeys(existingKeys) {

        console.log("Adding pending enrolment keys.");

        // find the enrolment keys which are not a part of the existing key ids
        existingKeys = _.map(existingKeys, (key) => {
            return key.key;
        });
        let enrolmentKeys = await this.studentService.findEnrolmentKeyByKey(existingKeys, true);
        // let paperSet = await this.studentService.paperSet(300);
        // console.log(paperSet)
        let rows = await _.map(enrolmentKeys, async (key,index) => {
            let row = {
                taskType: "test",
                enrolmentKey: key.key,
                stage: key.student.stage,
                studentCreatedAt: internals.getDateStringForGSheets(key.student.createdAt),
                testVersion: null,
                typeOfTest: key.typeOfTest // add students type of test into gsheet
            }
            if (key.questionSet !== null){
                row["testVersion"] = key.questionSet.testVersion.name
            }

            // add the student details
            row = this._addStudentDetailsToRow(row, key.student);
            
            // add test score if the student has attempted the test
            if (key.totalMarks) {
                row['testScore'] = key.totalMarks
            }
            
            if (key.questionSetId !== null) {
                let paperSet = await this.studentService.paperSet(key.questionSetId);
                if (paperSet){
                    row["paperSet"] = paperSet.name
                }
            }
            return row
        });
        
        let rowes = await Promise.all(rows)
        console.log(rowes)
        this.reports.keysAdded += rowes.length
        await this.addRows(rowes);
    }

    async addPendingIncomingCalls(existingCallIds) {

        console.log("Adding pending pending incoming calls.");
        existingCallIds = _.map(existingCallIds, (id) => {
            return id.id;
        });
        let incomingCalls = await this.studentService.findIncomingCallById(existingCallIds, true);
        let rows = _.map(incomingCalls, (incomingCall) => {
            let row = {
                taskType: "incomingCall",
                callIncomingId: incomingCall.id,
                mobile1: incomingCall.contact.mobile,
                stage: incomingCall.contact.student.stage
            }
            row = this._addStudentDetailsToRow(row, incomingCall.contact.student);
            return row;
        });
        this.reports.incomingCallAdded += rows.length
        await this.addRows(rows);
    }

    async getExistingEntries() {
        let entries = {
            incomingCallIds: [],
            enrolmentKeys: []
        };

        let allRows = await this.getAllRows();

        _.each(allRows, (row, index) => {
            if (row.callIncomingId) {
                entries.incomingCallIds.push({
                    id: row.callIncomingId,
                    row: index+2,
                    // For the 2 way sync we can record the column here
                    // to dump it in the Platform.
                    student: {
                        actualStage: internals.stageMapping(row["Actual Stage"]),
                        partnerName: row.partnerName
                    }
                })
            } else if (row.enrolmentKey) {
                entries.enrolmentKeys.push({
                    key: row.enrolmentKey,
                    row: index+2,
                    // For the 2 way sync we can record the column here
                    // to dump it in the Platform.
                    student: {
                        actualStage: internals.stageMapping(row["Actual Stage"]),
                        partnerName: row.partnerName
                    }
                });
            }
        })
        return entries;
    }

    async getPartnersObject() {
        let dbPartners = await this.partnerService.findAll();
        return _.object(_.map(dbPartners, partner => [partner.name, partner]))
    }

    async getEnrolmentKeysObject(existingKeys) {
        // get all the enrolment keys from the DB
        let enrolmentKeys = await this.studentService.findEnrolmentKeyByKey(_.map(existingKeys, (key) => {
            return key.key;
        }));
        enrolmentKeys = _.map(enrolmentKeys, (key) => {
            return [ key.key, key ]
        });
        enrolmentKeys = _.object(enrolmentKeys);

        return enrolmentKeys;
    }

    async getIncomingCallsObject(existingCallIds) {
        // get all the incoming call objects from the DB
        let incomingCalls = await this.studentService.findIncomingCallById(_.map(existingCallIds, (id) => {
            return id.id;
        }));
        incomingCalls = _.map(incomingCalls, (call) => {
            return [ call.id, call ];
        });
        incomingCalls = _.object(incomingCalls);

        return incomingCalls
    }

    async updateExistingEnrolmentKeyEntries(existingKeys) {

        console.log("Updating existing enrolment keys.");

        // use this to build a list of all the updates need to be done to the google sheet
        let rangeUpdates = [];

        let enrolmentKeys = await this.getEnrolmentKeysObject(existingKeys)

        // build a list of updates that need to be done
        let maxColNum = _.keys(this.headers).length;
        _.each(existingKeys, (key) => {
            let dbKey = enrolmentKeys[key.key];

            if(!dbKey) {
                return
            }

            let row = {
                taskType: "test",
                enrolmentKey: dbKey.key,
                stage: dbKey.student.stage,
                studentCreatedAt: internals.getDateStringForGSheets(dbKey.student.createdAt),
                testVersion: null
            }
            if (dbKey.questionSet !== null){
                row["testVersion"] = dbKey.questionSet.testVersion.name
            }

            row = this._addStudentDetailsToRow(row, dbKey.student);

            // add test score if the student has attempted the test
            if ( dbKey.totalMarks ) {
                row['testScore'] = dbKey.totalMarks
            }

            let sheetRow = Array(maxColNum).fill(null);
            _.each(row, (value, key) => {
                sheetRow[ this.headers[key].col - 1 ] = value;
            });

            let a1Range = internals.getA1RangeNotation(1, key.row, maxColNum, key.row);
            rangeUpdates.push({
                range: `${CONSTANTS.gSheet.mainSheetName}!${a1Range}`,
                values: [sheetRow]
            });

        });

        // finall update the sheet
        return await this.batchUpdateGoogleSheet(rangeUpdates);
    }

    async updateExistingIncomingCallEntries(existingCallIds) {

        console.log("Updating existing incoming call entries.");

        // use this to build a list of all the updates need to be done to the google sheet
        let rangeUpdates = [];
        let incomingCalls = await this.getIncomingCallsObject(existingCallIds)

        // build a list of updates that need to be done
        let maxColNum = _.keys(this.headers).length;
        _.each(existingCallIds, (id) => {
            let dbCall = incomingCalls[id.id];

            if(!dbCall) {
                return
            }

            let row = {
                taskType: "incomingCall",
                callIncomingId: dbCall.id,
                stage: dbCall.contact.student.stage,
                studentCreatedAt: internals.getDateStringForGSheets(dbCall.contact.student.createdAt)
            }
            row = this._addStudentDetailsToRow(row, dbCall.contact.student);



            let sheetRow = Array(maxColNum).fill(null);
            _.each(row, (value, key) => {
                sheetRow[ this.headers[key].col - 1 ] = value;
            });

            let a1Range = internals.getA1RangeNotation(1, id.row, maxColNum, id.row);
            rangeUpdates.push({
                range: `${CONSTANTS.gSheet.mainSheetName}!${a1Range}`,
                values: [sheetRow]
            });

        });

        // finall update the sheet
        return await this.batchUpdateGoogleSheet(rangeUpdates);
    }

    async batchUpdateGoogleSheet(rangeUpdates) {
        return await promisify(this.sheetsBaseApi.spreadsheets.values.batchUpdate)({
            spreadsheetId: CONSTANTS.gSheet.sheetId,
            valueInputOption: "USER_ENTERED",
            resource: {
                data: rangeUpdates
            }
        });
    }

    async startSync() {
        // get the ids of existing incoming call ids and enrolment keys in the spreadsheet
        let entries = await this.getExistingEntries();

        // syncing the platform with GSheet, then
        // add the pending incoming calls & enrolment keys
        // && update the existing incoming call and enrolment key rows
        this.syncPlatformEnrolmentKeysWithGSheet(entries.enrolmentKeys)
        // .then(() => {
        //     return this.syncPlatformIncomingCallsWithGSheet(entries.incomingCallIds)
        // })
        .then(() => {
            return this.addPendingEnrolmentKeys(entries.enrolmentKeys)
        }).then(() => {
            return this.updateExistingIncomingCallEntries(entries.incomingCallIds);
        }).then(() => {
            return this.addPendingIncomingCalls(entries.incomingCallIds);
        }).then(() => {
            return this.updateExistingEnrolmentKeyEntries(entries.enrolmentKeys);
        }).then(() => {
            return sendEmail.sendEmailReport(this.reports)
        })


        // TODO: Code for setting formats. Might be of use later.
        // console.log("Hello??");
        // let req = {
        //     insertDimension: {
        //         range: {
        //             sheetId: this.mainWorkSheetId,
        //             dimension: "ROWS",
        //             startIndex: 3,
        //             endIndex: 5
        //         }
        //     }
        // };
        // let req = {
        //     repeatCell: {
        //         range: {
        //             sheetId: this.mainWorkSheetId,
        //             startColumnIndex: 19,
        //             endColumnIndex: 19,
        //             startRowIndex: 2
        //         },
        //         cell: {
        //             userEnteredFormat: {
        //                 numberFormat: {
        //                     type: "NUMBER",
        //                     pattern: "#.#"
        //                 }
        //             }
        //         },
        //         fields: "userEnteredFormat(numberFormat)"
        //     }
        // }
        // return await promisify(this.sheetsBaseApi.spreadsheets.batchUpdate)({
        //     spreadsheetId: CONSTANTS.gSheet.sheetId,
        //     resource: {
        //         requests: [req]
        //     }
        // })
        // .then((e) => {
        //     console.log(e);
        // });
    }
}
