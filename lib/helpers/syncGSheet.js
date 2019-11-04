
/*
* 1. The rows can be related to one of the two tables - `incomingCalls` or `enrolmentKeys`
* 2. For the enrolment key it will be linked using the enrolment key and not the ID.
* 3. For the incomingCall it will be linked using the ID of the incoming Call.
* 4. So if a student has answered multiple tests, there will be multiple rows for him.
*/

const GoogleSpreadsheet = require('google-spreadsheet');
const { promisify } = require('util');
const _ = require('underscore');
const { google } = require('googleapis');
const moment = require('moment');
const fs = require('fs');
const sendEmail = require('./sendEmail');
const CONSTANTS = require('../constants');

const internals = {};

const addActualStageToRow = (Row) => {
  const row = Row;
  if (row.stage === 'testPassed') {
    row['Actual Stage'] = 'Test Passed';
  } else if (row.stage === 'testFailed') {
    row['Actual Stage'] = 'Test Failed';
  }
  return row;
};


internals.getColumnNameFromPosition = (Num) => {
  let num = Num;

  let ret = '';
  let a = 1;
  let b = 26;

  for (;num >= a;) {
    num -= a;
    ret = String.fromCharCode(parseInt((num % b) / a, 10) + 65) + ret;
    a = b;
    b *= 26;
  }

  return ret;
};

internals.getA1RangeNotation = (StartCol, StartRow, EndCol, EndRow) => {
  let startCol = StartCol; let startRow = StartRow; let endCol = EndCol; let endRow = EndRow;
  if (Number.isInteger(Number(startCol))) {
    startCol = internals.getColumnNameFromPosition(startCol);
  }
  if (Number.isInteger(Number(endCol))) {
    endCol = internals.getColumnNameFromPosition(endCol);
  }
  if (!startRow) {
    startRow = '';
  }
  if (!endRow) {
    endRow = '';
  }
  return `${startCol}${startRow}:${endCol}${endRow}`;
};

internals.getDateStringForGSheets = (isoDate) => {
  if (!isoDate) {
    return null;
  }
  const date = moment(isoDate);
  return date.format('YYYY-MM-DD HH:mm:ss.000');
};

internals.swapValuesWithEnumKeys = (object) => {
  const obj = object;
  const keysToSwap = ['gender', 'qualification', 'currentStatus', 'schoolMedium', 'religon', 'caste'];
  _.each(keysToSwap, (key) => {
    const invertedEnum = _.invert(CONSTANTS.studentDetails[key]);
    if (obj[key]) {
      obj[key] = invertedEnum[obj[key]];
    }
  });
  return obj;
};

internals.stages = {
  requestCallback: 'requestCallback',
  enrolmentKeyGenerated: 'enrolmentKeyGenerated',
  completedTest: 'completedTest',
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
  Probation: 'probation',
  'Finally Joined': 'finallyJoined',
  'Dropped Out': 'droppedOut',
  'Became Disinterested': 'becameDisIntersested',
  'Possible Duplicate': 'possibleDuplicate',
  'Need Action': 'needAction',
  Demo: 'demo',
  'Disqualified (Unreachable)': 'disqualifiedUnreachable',
  'English Interview Waitlisted': 'englishInterviewWaitlisted',
  'Sent Back After Probation': 'sentBackAfterProbation',
  'Caught Cheating': 'caughtCheating',

  'Diversity Based Decision Pending': 'diversityBasedDecisionPending',
  'Disqualified After Diversity Filter': 'disqualifiedAfterDiversityFilter',
};

// kept stage as it is if not present so
// we can catch releative error and sent through email
internals.stageMapping = (stage) => (_.keys(internals.stages)
  .includes(stage) ? internals.stages[stage] : stage);

module.exports = class ChanakyaGSheetSync {
  constructor(services) {
    // using `google-spreadsheet` for some use cases
    // but it doesn't support bulk updates so will be using the raw google node lib too
    this.doc = new GoogleSpreadsheet(CONSTANTS.gSheet.sheetId);
    _.each(_.keys(this.doc), (key) => {
      this.doc[key] = promisify(this.doc[key]);
    });

    // read the private key from the file
    const privateKey = fs.readFileSync(CONSTANTS.gSheet.privateKey);
    this.privateKey = privateKey.toString();

    // initializing the basic google node lib
    this.googleJwtClient = new google.auth.JWT(CONSTANTS.gSheet.clientEmail, null, this.privateKey,
      [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/calendar',
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
    this.partnerService = services.partnerService;
    this.reports = {
      keysAdded: 0,
      incomingCallAdded: 0,
      syncErrors: {
        platform: {
          enrolmentKeys: [], // {key: 'EDT567', errors: ['errors']}
          incomingCalls: [], // {id: 3, errors: ['errors']}
        },
      },
    };
  }

  async init() {
    await this.googleJwtClient.authorize();
    this.sheetsBaseApi = google.sheets({ version: 'v4', auth: this.googleJwtClient });

    await this.doc.useServiceAccountAuth({
      client_email: CONSTANTS.gSheet.clientEmail,
      private_key: this.privateKey,
    });

    // set the correct work sheet ID
    const spreadsheet = await promisify(this.sheetsBaseApi.spreadsheets.get)({
      spreadsheetId: CONSTANTS.gSheet.sheetId,
    });
    _.each(spreadsheet.data.sheets, (sheet) => {
      const prop = sheet.properties;
      if (prop.title === CONSTANTS.gSheet.mainSheetName) {
        this.mainWorkSheetIndex = prop.index + 1;
        this.mainWorkSheetId = prop.sheetId;
      }
    });
    if (this.mainWorkSheetIndex === 0) {
      throw Error("The worksheet with the name `{}` doesn't exist.".format(CONSTANTS.gSheet.mainSheetName));
    }

    // get the headers
    await this.getHeaders();

    this.initDone = true;
  }

  async getAllRows() {
    const a1Range = internals.getA1RangeNotation('A', 2, _.keys(this.headers).length, null);
    return promisify(this.sheetsBaseApi.spreadsheets.values.get)({
      spreadsheetId: CONSTANTS.gSheet.sheetId,
      range: `${CONSTANTS.gSheet.mainSheetName}!${a1Range}`,
    })
      .then((response) => {
        const rows = response.data.values;
        const headerKeys = _.keys(this.headers);
        const sheetRows = _.map(rows, (row) => {
          const sheetRow = {};
          _.each(headerKeys, (key) => {
            sheetRow[key] = row[this.headers[key].col - 1];
          });
          return sheetRow;
        });
        return sheetRows;
      });
  }

  async getHeaders() {
    // TODO: If there is a gap of a column among two headers then return an error
    return this.doc.getCells(this.mainWorkSheetIndex, { 'min-row': 1, 'max-row': 1 })
      .then((cells) => {
        _.each(cells, (cell) => {
          this.headers[cell._value] = {
            row: cell.row,
            col: cell.col,
          };
        });
      });
  }

  async addRows(rows) {
    // get all rows from google sheets
    const allRows = await this.getAllRows();

    const sheetRows = _.map(rows, (row) => {
      const sheetRow = Array(_.keys(this.headers).length).fill(null);
      _.each(_.keys(row), (key) => {
        sheetRow[this.headers[key].col - 1] = row[key];
      });
      return sheetRow;
    });

    // make the api call to add the rows
    const a1Range = internals.getA1RangeNotation('A', allRows.length + 2, _.keys(this.headers).length, null);
    console.log(`${CONSTANTS.gSheet.mainSheetName}!${a1Range}`);
    await this.sheetsBaseApi.spreadsheets.values.append({
      spreadsheetId: CONSTANTS.gSheet.sheetId,
      range: `${CONSTANTS.gSheet.mainSheetName}!${a1Range}`,
      insertDataOption: 'INSERT_ROWS',
      valueInputOption: 'USER_ENTERED',
      resource: { values: sheetRows },
    });
  }

  addStudentDetailsToRow(Row, student) {
    let row = Row;
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
      stageNotChangeSince,
    });

    // add gps/lat long if they exist
    if (student.gpsLat != null && student.gpsLong != null) {
      row.gpsLatLong = `${student.gpsLat}, ${student.gpsLong}`;
    }

    // add contacts
    _.each(student.contacts, (contact, index) => {
      row[`mobile${index + 1}`] = contact.mobile;
    });

    // add partner name (if partner details are available)
    if (student.partner) {
      row.partnerName = student.partner.name;
    }

    row = internals.swapValuesWithEnumKeys(row);
    return row;
  }

  async syncPlatformIncomingCallsWithGSheet(existingCallIds) {
    console.log('Updating the students record on the platform from gSheet for IncomingCalls.');
    const incomingCalls = await this.getIncomingCallsObject(existingCallIds);
    const partners = await this.getPartnersObject();

    _.each(existingCallIds, async (call) => {
      const dbCall = incomingCalls[call.id];

      if (!dbCall) {
        return;
      }

      const syncError = {
        id: dbCall.id,
        errors: [],
        row: call.row,
      };

      const studentDetails = {};

      // Record Stage change
      const transitionResponse = this.studentService.shouldRecordStudentTranisition(
        dbCall.contact.student,
        call.student.actualStage,
      );

      // Recording the Actual Stage Column
      if (transitionResponse.shouldRecord === true) {
        studentDetails.stage = call.student.actualStage;
      } else if (transitionResponse.errorMessage !== null) {
        // recording errors to send through email
        syncError.errors.push(transitionResponse.errorMessage);
      }


      const partnerResponse = this.studentService.hasPartnerNameChangedOnSheet(
        partners,
        dbCall.contact.student,
        call.student.partnerName,
      );
      if (partnerResponse.partnerId) {
        studentDetails.partnerId = partnerResponse.partnerId;
      } else if (partnerResponse.errorMessage !== null) {
        // recording errors to send through email
        syncError.errors.push(partnerResponse.errorMessage);
      }


      // Only the keys which has any errors
      if (syncError.errors.length > 0) {
        this.reports.syncErrors.platform.incomingCalls.push(syncError);
      }

      //  call the api only if any column has changed
      if (_.keys(studentDetails.length !== 0)) {
        await this.assessmentService.patchStudentDetailsWithoutKeys(dbCall.contact.student,
          studentDetails);
      }
    });
  }

  async syncPlatformEnrolmentKeysWithGSheet(existingKeys) {
    console.log('Updating the students record on the platform from gSheet for enrolmentKeys.');
    const enrolmentKeys = await this.getEnrolmentKeysObject(existingKeys);
    const partners = await this.getPartnersObject();

    _.each(existingKeys, async (key) => {
      const dbKey = enrolmentKeys[key.key];
      if (!dbKey) {
        return;
      }

      const syncError = {
        key: dbKey.key,
        errors: [],
        row: key.row,
      };

      const studentDetails = {};

      const transitionResponse = this.studentService.shouldRecordStudentTranisition(
        dbKey.student,
        key.student.actualStage,
      );

      // Recording the Actual Stage Column
      if (transitionResponse.shouldRecord === true) {
        studentDetails.stage = key.student.actualStage;
      } else if (transitionResponse.errorMessage !== null) {
        // recording errors to send through email
        syncError.errors.push(transitionResponse.errorMessage);
      }

      const partnerResponse = this.studentService.hasPartnerNameChangedOnSheet(
        partners,
        dbKey.student,
        key.student.partnerName,
      );
      if (partnerResponse.partnerId) {
        studentDetails.partnerId = partnerResponse.partnerId;
      } else if (partnerResponse.errorMessage !== null) {
        // recording errors to send through email
        syncError.errors.push(partnerResponse.errorMessage);
      }

      // Only the keys which has any errors
      if (syncError.errors.length > 0) {
        this.reports.syncErrors.platform.enrolmentKeys.push(syncError);
      }
      //  call the api only if any column has changed
      if (_.keys(studentDetails.length !== 0)) {
        await this.assessmentService.patchStudentDetails(dbKey, studentDetails);
      }
    });
  }

  async addPendingEnrolmentKeys(ExistingKeys) {
    console.log('Adding pending enrolment keys.');
    let existingKeys = ExistingKeys;
    // find the enrolment keys which are not a part of the existing key ids
    existingKeys = _.map(existingKeys, (key) => key.key);
    const enrolmentKeys = await this.studentService.findEnrolmentKeyByKey(existingKeys, true);
    const rows = _.map(enrolmentKeys, (key) => {
      let row = {
        taskType: 'test',
        enrolmentKey: key.key,
        stage: key.student.stage,
        studentCreatedAt: internals.getDateStringForGSheets(key.student.createdAt),
        testVersion: null,
        typeOfTest: key.typeOfTest, // add students type of test in gsheet
      };
      // when question Set is exist then we can get the totalmarks of student and test version.
      if (key.questionSet !== null) {
        const testVersion = key.questionSet.testVersion.name;
        row.testVersion = testVersion;
      }

      // add actual stage
      row = addActualStageToRow(row);

      // add the student details
      row = this.addStudentDetailsToRow(row, key.student);

      // add test score if the student has attempted the test
      if (key.totalMarks) {
        row.testScore = key.totalMarks;
      }
      return row;
    });
    this.reports.keysAdded += rows.length;
    await this.addRows(rows);
  }

  // reusable functions for desiding students test result.
  static testPass(studentStage) {
    if (studentStage === 'testPassed') {
      return true;
    }
    return false;
  }

  static testFailed(studentStage) {
    if (studentStage === 'testFailed') {
      return true;
    }
    return false;
  }

  async addPendingIncomingCalls(ExistingCallIds) {
    console.log('Adding pending pending incoming calls.');
    let existingCallIds = ExistingCallIds;

    existingCallIds = _.map(existingCallIds, (id) => id.id);
    const incomingCalls = await this.studentService.findIncomingCallById(existingCallIds, true);
    const rows = _.map(incomingCalls, (incomingCall) => {
      let row = {
        taskType: 'incomingCall',
        callIncomingId: incomingCall.id,
        mobile1: incomingCall.contact.mobile,
        stage: incomingCall.contact.student.stage,
      };
      row = this.addStudentDetailsToRow(row, incomingCall.contact.student);
      return row;
    });
    this.reports.incomingCallAdded += rows.length;
    await this.addRows(rows);
  }

  async getExistingEntries() {
    const entries = {
      incomingCallIds: [],
      enrolmentKeys: [],
    };

    const allRows = await this.getAllRows();
    _.each(allRows, (row, index) => {
      if (row.callIncomingId) {
        entries.incomingCallIds.push({
          id: row.callIncomingId,
          row: index + 2,
          // For the 2 way sync we can record the column here
          // to dump it in the Platform.
          student: {
            actualStage: internals.stageMapping(row['Actual Stage']),
            partnerName: row.partnerName,
          },
        });
      } else if (row.enrolmentKey) {
        entries.enrolmentKeys.push({
          key: row.enrolmentKey,
          row: index + 2,
          // For the 2 way sync we can record the column here
          // to dump it in the Platform.
          student: {
            actualStage: internals.stageMapping(row['Actual Stage']),
            partnerName: row.partnerName,
          },
        });
      }
    });
    return entries;
  }

  async getPartnersObject() {
    const dbPartners = await this.partnerService.findAll();
    return _.object(_.map(dbPartners, (partner) => [partner.name, partner]));
  }

  async getEnrolmentKeysObject(existingKeys) {
    // get all the enrolment keys from the DB
    let enrolmentKeys = await this.studentService.findEnrolmentKeyByKey(_.map(existingKeys,
      (key) => key.key));
    enrolmentKeys = _.map(enrolmentKeys, (key) => [key.key, key]);
    enrolmentKeys = _.object(enrolmentKeys);

    return enrolmentKeys;
  }

  async getIncomingCallsObject(existingCallIds) {
    // get all the incoming call objects from the DB
    let incomingCalls = await this.studentService.findIncomingCallById(_.map(existingCallIds,
      (id) => id.id));
    incomingCalls = _.map(incomingCalls, (call) => [call.id, call]);
    incomingCalls = _.object(incomingCalls);

    return incomingCalls;
  }

  async updateExistingEnrolmentKeyEntries(existingKeys) {
    console.log('Updating existing enrolment keys.');

    // use this to build a list of all the updates need to be done to the google sheet
    const rangeUpdates = [];
    const enrolmentKeys = await this.getEnrolmentKeysObject(existingKeys);
    // build a list of updates that need to be done
    const maxColNum = _.keys(this.headers).length;
    // const tribeCount = 0;
    _.each(existingKeys, (key) => {
      const dbKey = enrolmentKeys[key.key];
      // const { actualStage } = key.student;
      if (!dbKey) {
        return;
      }

      let row = {
        taskType: 'test',
        enrolmentKey: dbKey.key,
        studentCreatedAt: internals.getDateStringForGSheets(dbKey.student.createdAt),
        testVersion: null,
      };
      if (dbKey.questionSet !== null) {
        row.testVersion = dbKey.questionSet.testVersion.name;
      }

      // add actual stage
      row = addActualStageToRow(row);

      row = this.addStudentDetailsToRow(row, dbKey.student);

      // add test score if the student has attempted the test
      if (dbKey.totalMarks) {
        row.testScore = dbKey.totalMarks;
      }

      const sheetRow = Array(maxColNum).fill(null);
      _.each(row, (value, keys) => {
        sheetRow[this.headers[keys].col - 1] = value;
      });

      const a1Range = internals.getA1RangeNotation(1, key.row, maxColNum, key.row);
      rangeUpdates.push({
        range: `${CONSTANTS.gSheet.mainSheetName}!${a1Range}`,
        values: [sheetRow],
      });
    });

    // finall update the sheet
    const RangeUpdates = await this.batchUpdateGoogleSheet(rangeUpdates);
    return RangeUpdates;
  }

  async updateExistingIncomingCallEntries(existingCallIds) {
    console.log('Updating existing incoming call entries.');

    // use this to build a list of all the updates need to be done to the google sheet
    const rangeUpdates = [];
    const incomingCalls = await this.getIncomingCallsObject(existingCallIds);

    // build a list of updates that need to be done
    const maxColNum = _.keys(this.headers).length;
    _.each(existingCallIds, (id) => {
      const dbCall = incomingCalls[id.id];

      if (!dbCall) {
        return;
      }

      let row = {
        taskType: 'incomingCall',
        callIncomingId: dbCall.id,
        stage: dbCall.contact.student.stage,
        studentCreatedAt: internals.getDateStringForGSheets(dbCall.contact.student.createdAt),
      };
      row = this.addStudentDetailsToRow(row, dbCall.contact.student);


      const sheetRow = Array(maxColNum).fill(null);
      _.each(row, (value, key) => {
        sheetRow[this.headers[key].col - 1] = value;
      });

      const a1Range = internals.getA1RangeNotation(1, id.row, maxColNum, id.row);
      rangeUpdates.push({
        range: `${CONSTANTS.gSheet.mainSheetName}!${a1Range}`,
        values: [sheetRow],
      });
    });

    // finall update the sheet
    const RangeUpdates = await this.batchUpdateGoogleSheet(rangeUpdates);
    return RangeUpdates;
  }

  async batchUpdateGoogleSheet(rangeUpdates) {
    const updateRange = await promisify(this.sheetsBaseApi.spreadsheets.values.batchUpdate)({
      spreadsheetId: CONSTANTS.gSheet.sheetId,
      valueInputOption: 'USER_ENTERED',
      resource: {
        data: rangeUpdates,
      },
    });
    return updateRange;
  }

  async syncFromSheet() {
    // get the ids of existing incoming call ids and enrolment keys in the spreadsheet
    const entries = await this.getExistingEntries();

    // update the database syncing Gsheet and update students's actual stage and Id's
    this.syncPlatformEnrolmentKeysWithGSheet(entries.enrolmentKeys);
  }

  async addDataToSheet() {
    // get the ids of existing incoming call ids and enrolment keys in the spreadsheet
    const entries = await this.getExistingEntries();
    // Reupdating Gsheet from database onces databse is updated with students
    // actual stage and pending enrolment_keys and student's details.
    this.addPendingEnrolmentKeys(entries.enrolmentKeys)
      .then(() => this.updateExistingIncomingCallEntries(entries.incomingCallIds))
      .then(() => this.addPendingIncomingCalls(entries.incomingCallIds))
      .then(() => this.updateExistingEnrolmentKeyEntries(entries.enrolmentKeys))
      .then(() => sendEmail.sendEmailReport(this.reports));


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
};
