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
const _ = require('underscore');
const { google } = require("googleapis");
const moment = require("moment");

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


module.exports = class ChanakyaGSheetSync {
    constructor(studentService, assessmentService) {
        // using `google-spreadsheet` for some use cases
        // but it doesn't support bulk updates so will be using the raw google node lib too
        this.doc = new GoogleSpreadsheet(CONSTANTS.gSheet.sheetId);
        _.each(_.keys(this.doc), (key) => {
            this.doc[key] = promisify(this.doc[key]);
        })

        // initializing the basic google node lib
        this.googleJwtClient = new google.auth.JWT(CONSTANTS.gSheet.clientEmail, null, CONSTANTS.gSheet.privateKey, [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/calendar'
        ]);
        this.googleJwtClient.authorize = promisify(this.googleJwtClient.authorize);

        this.sheetsBaseApi = null;
        this.headers = {};
        this.initDone = false;
        this.rows = null;
        this.mainWorksheetId = 0;
        this.studentService = studentService;
        this.assessmentService = assessmentService;
    }

    async init() {

        await this.googleJwtClient.authorize();
        this.sheetsBaseApi = google.sheets({ version: "v4", auth: this.googleJwtClient});

        await this.doc.useServiceAccountAuth({
            client_email: CONSTANTS.gSheet.clientEmail,
            private_key: CONSTANTS.gSheet.privateKey
        });

        // set the correct work sheet ID
        let info = await this.doc.getInfo();
        _.each(info.worksheets, (sheet, index) => {
            if (sheet.title == CONSTANTS.gSheet.mainSheetName) {
                this.mainWorksheetId = index+1; // the index of worksheet for the sheets api starts with 1
            }
        });
        if (this.mainWorksheetId == 0) {
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
        return this.doc.getCells(this.mainWorksheetId, {'min-row': 1, 'max-row': 1})
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
        // get all rows from google sheets
        let allRows = await this.getAllRows();

        let sheetRows = _.map(rows, (row) => {
            let sheetRow = Array(_.keys(this.headers).length).fill(null);
            _.each(_.keys(row), (key) => {
                sheetRow[this.headers[key].col-1] = row[key];
            })
            return sheetRow;
        });


        let a1Range = internals.getA1RangeNotation("A", allRows.length+1, _.keys(this.headers).length, null);
        await this.sheetsBaseApi.spreadsheets.values.append({
            spreadsheetId: CONSTANTS.gSheet.sheetId,
            range: `${CONSTANTS.gSheet.mainSheetName}!${a1Range}`,
            insertDataOption: "INSERT_ROWS",
            valueInputOption: "RAW",
            resource: { values: sheetRows }
        });
    }

    _addStudentDetailsToRow(row, student) {
        row = _.extend(row, {
            name: student.name,
            whatsapp: student.whatsapp,
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
            caste: student.caste
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

    async addPendingEnrolmentKeys(existingKeys) {

        console.log("Adding pending enrolment keys.");

        // find the enrolment keys which are not a part of the existing key ids
        existingKeys = _.map(existingKeys, (key) => {
            return key.key;
        });
        let enrolmentKeys = await this.studentService.findEnrolmentKeyByKey(existingKeys, true);
        let rows = _.map(enrolmentKeys, (key) => {

            let row = {
                taskType: "test",
                enrolmentKey: key.key,
                stage: key.student.stage,
                studentCreatedAt: internals.getDateStringForGSheets(key.student.createdAt)
            }

            // add the student details
            row = this._addStudentDetailsToRow(row, key.student);

            // add test score if the student has attempted the test
            if ( this.assessmentService.getEnrolmentKeyStatus(key) == 'testAnswered' ) {
                row['testScore'] = key.totalMarks
            }
            return row;

        });

        await this.addRows(rows);
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
                    row: index+2
                })
            } else if (row.enrolmentKey) {
                entries.enrolmentKeys.push({
                    key: row.enrolmentKey,
                    row: index+2
                });
            }
        })

        return entries;
    }

    async updateExistingEnrolmentKeyEntries(existingKeys) {

        console.log("Updating existing enrolment keys.");

        // use this to build a list of all the updates need to be done to the google sheet
        let rangeUpdates = [];

        // get all the enrolment keys from the DB
        let enrolmentKeys = await this.studentService.findEnrolmentKeyByKey(_.map(existingKeys, (key) => {
            return key.key;
        }));
        enrolmentKeys = _.map(enrolmentKeys, (key) => {
            return [ key.key, key ]
        });
        enrolmentKeys = _.object(enrolmentKeys);

        // build a list of updates that need to be done
        let maxColNum = _.keys(this.headers).length;
        _.each(existingKeys, (key) => {
            let dbKey = enrolmentKeys[key.key];

            let row = {
                taskType: "test",
                enrolmentKey: dbKey.key,
                stage: dbKey.student.stage,
                studentCreatedAt: dbKey.student.createdAt
            }
            row = this._addStudentDetailsToRow(row, dbKey.student);

            // add test score if the student has attempted the test
            if ( this.assessmentService.getEnrolmentKeyStatus(dbKey) == 'testAnswered' ) {
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

        // get all the incoming call objects from the DB
        let incomingCalls = await this.studentService.findIncomingCallById(_.map(existingCallIds, (id) => {
            return id.id;
        }));
        incomingCalls = _.map(incomingCalls, (call) => {
            return [ call.id, call ];
        });
        incomingCalls = _.object(incomingCalls);

        // build a list of updates that need to be done
        let maxColNum = _.keys(this.headers).length;
        _.each(existingCallIds, (id) => {
            let dbCall = incomingCalls[id.id];

            let row = {
                taskType: "incomingCall",
                callIncomingId: dbCall.id,
                stage: dbCall.contact.student.stage,
                studentCreatedAt: dbCall.contact.student.createdAt
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
            valueInputOption: "RAW",
            resource: {
                data: rangeUpdates
            }
        });
    }

    async startSync() {
        // get the ids of existing incoming call ids and enrolment keys in the spreadsheet
        let entries = await this.getExistingEntries();

        // add the pending incoming calls & enrolment keys
        // && update the existing incoming call and enrolment key rows
        this.addPendingEnrolmentKeys(entries.enrolmentKeys).then(() => {
            this.updateExistingIncomingCallEntries(entries.incomingCallIds);
        });
        this.addPendingIncomingCalls(entries.incomingCallIds).then(() => {
            this.updateExistingEnrolmentKeyEntries(entries.enrolmentKeys);
        });


    }
}
