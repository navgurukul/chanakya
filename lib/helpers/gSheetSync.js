
'use strict';

const GoogleSpreadsheet = require('google-spreadsheet');
const { promisify } = require("util");
const CONSTANTS = require('../constants');
const _ = require('underscore');
const { google } = require("googleapis");
const fs = require("fs");
const axios = require('axios');
const readlineSync = require('readline-sync');

class ContactGSheetSync {
  constructor() {
    // using `google-spreadsheet` for some use cases
    // but it doesn't support bulk updates so will be using the raw google node lib too
    this.doc = new GoogleSpreadsheet(CONSTANTS.gSheet.sheetId);
    _.each(_.keys(this.doc), (key) => {
        this.doc[key] = promisify(this.doc[key]);
    })
    // read the private key from the file
    let privateKey = fs.readFileSync(CONSTANTS.gSheet.privateKey);
    this.privateKey = JSON.parse(privateKey.toString());
    // initializing the basic google node lib
    this.googleJwtClient = new google.auth.JWT(this.privateKey.client_email, null, this.privateKey.private_key, [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/calendar'
    ]);
    this.googleJwtClient.authorize = promisify(this.googleJwtClient.authorize);
    this.sheetsBaseApi = null;
    this.headers = {};
    this.numberOfrowsInEachSheet = null;
    this.rows = null;
    this.mainWorkSheetIndex = 0;
  }

  async syncGSheet() {
    await this.googleJwtClient.authorize();
    this.sheetsBaseApi = google.sheets({ version: "v4", auth: this.googleJwtClient });
    
    await this.doc.useServiceAccountAuth({
      client_email: CONSTANTS.gSheet.clientEmail,
      private_key: this.privateKey.private_key
    });
    
    // set the correct work sheet ID
    let spreadsheet = await (this.sheetsBaseApi.spreadsheets.get({
      spreadsheetId: CONSTANTS.gSheet.sheetId
    }));
    
    const numberOfrowsInEachSheet = []
    _.each(spreadsheet.data.sheets, (sheet, index) => {
      let prop = sheet.properties;
      if (prop.title == CONSTANTS.gSheet.contactSheetName[index]) {
        this.mainWorkSheetIndex = prop.index + 1;
        numberOfrowsInEachSheet.push({
          title: CONSTANTS.gSheet.contactSheetName[index],
          rows: prop.gridProperties.rowCount
        })
      }
    });
    
    this.numberOfrowsInEachSheet = numberOfrowsInEachSheet;
    await this.getHeaders()
    
    const data = await this.getContacts();
    let contacts = [];
    _.each(data, (response) => {
      let rows = response.data.values;
      let headerKeys = _.keys(this.headers);
      let sheetRows = _.map(rows, (row) => {
        let sheetRow = {};
        _.each(headerKeys, (key) => {
          sheetRow[key] = row[this.headers[key].col - 1];
          })
          return sheetRow
        });
      contacts.push(sheetRows)
    })
    
    const allContacts = [].concat(...contacts);
    const autoCalling = await axios.post(`${CONSTANTS.apiBaseUrl}/students/autoCalling`, {
      contacts: allContacts
    });
    return autoCalling;
  }
    
  async getContacts() {
    const promises = [];
    _.each(this.numberOfrowsInEachSheet, (sheet) => {
      promises.push(this.getAllRows(sheet))
    });
    return Promise.all(promises)
  }
  
  async getAllRows(sheet) {
    return await this.sheetsBaseApi.spreadsheets.values.get({
      spreadsheetId: CONSTANTS.gSheet.sheetId,
      range: `${sheet.title}!A2:C${sheet.rows}`,
    })
  }
  
  async getHeaders() {
    return this.doc.getCells(this.mainWorkSheetIndex, { 'min-row': 1, 'max-row': 1 })
    .then((cells) => {
      _.each(cells, (cell) => {
        this.headers[cell._value] = {
          row: cell.row,
          col: cell.col
        }
      });
    });
  }

  static showErrorAndExit(message) {
    console.log(message);
    console.log('Fix the above error and re-run this script.');
    process.exit();
  }

  static autoCallFlag() {
    if (process.argv.indexOf('--autoCallToFailedStudent') > -1) {
      return true;
    }
    return false;
  }

}

if (!module.parent) {
  const autoCallToFailedStudent = ContactGSheetSync.autoCallFlag();

  // confirm from the user if they are sure of running the script.
  if (autoCallToFailedStudent && !readlineSync.keyInYN('Are you sure you want to continue calling failed students?')) {
    ContactGSheetSync.showErrorAndExit('You said you were not sure of continuing to call with failed student.');
  }

  const autoCall = new ContactGSheetSync()
  autoCall.syncGSheet()
    .then((response) => {
      // inform the user about script is successfully runed
      const { status } = response;
      if (status == 200) {
        console.log(`\nYou've called all failed student to join Navgurukul's 3 month online traing programme.\n`);
        console.log('The script has successfully run');
        process.exit();
      }
      ContactGSheetSync.showErrorAndExit('Something went wrong in server!');
    })
}
