
/**
 * Syncs all the partners name and Id to partners Sheet.
 */

const GoogleSpreadsheet = require('google-spreadsheet');
const { promisify } = require('util');
const _ = require('underscore');
const { google } = require('googleapis');
const fs = require('fs');
const CONSTANTS = require('../constants');

const internals = {};

function createPartnerSchemaAsOnSheet(partner) {
  return {
    partnerName: partner.name,
    partnerId: partner.id,
  };
}

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


module.exports = class SyncPartnerSheet {
  constructor(partnerService) {
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
    this.partnerSheetIndex = 0;
    this.partnerSheetId = null;
    this.partnerService = partnerService;
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
      if (prop.title === CONSTANTS.gSheet.partnerSheetName) {
        this.partnerSheetIndex = prop.index + 1;
        this.partnerSheetId = prop.sheetId;
      }
    });
    if (this.partnerSheetIndex === 0) {
      throw Error("The worksheet with the name `{}` doesn't exist.".format(CONSTANTS.gSheet.partnerSheetName));
    }

    // get the headers
    await this.getHeaders();

    this.initDone = true;
  }

  async getAllRows() {
    const a1Range = internals.getA1RangeNotation('A', 2, _.keys(this.headers).length, null);
    return promisify(this.sheetsBaseApi.spreadsheets.values.get)({
      spreadsheetId: CONSTANTS.gSheet.sheetId,
      range: `${CONSTANTS.gSheet.partnerSheetName}!${a1Range}`,
    })
      .then((response) => {
        const rows = response.data.values;
        const headerKeys = _.keys(this.headers);
        let sheetRows = _.map(rows, (row, index) => {
          const sheetRow = {};
          _.each(headerKeys, (key) => {
            sheetRow[key] = row[this.headers[key].col - 1];
          });
          sheetRow.row = index + 2;
          if (sheetRow.partnerId) {
            return sheetRow;
          }
          return null;
        });
        sheetRows = _.filter(sheetRows);
        return sheetRows;
      });
  }

  async getHeaders() {
    // TODO: If there is a gap of a column among two headers then return an error
    return this.doc.getCells(this.partnerSheetIndex, { 'min-row': 1, 'max-row': 1 })
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
    console.log(sheetRows);
    // make the api call to add the rows
    const a1Range = internals.getA1RangeNotation('A', allRows.length + 1, _.keys(this.headers).length, null);
    await this.sheetsBaseApi.spreadsheets.values.append({
      spreadsheetId: CONSTANTS.gSheet.sheetId,
      range: `${CONSTANTS.gSheet.partnerSheetName}!${a1Range}`,
      insertDataOption: 'INSERT_ROWS',
      valueInputOption: 'USER_ENTERED',
      resource: { values: sheetRows },
    });
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

  async addNewPartnersOnSheet(allRows) {
    console.log('Adding new partners.');
    const partnerIds = _.map(allRows, (row) => row.partnerId);
    console.log(partnerIds);
    const partners = await this.partnerService.findPartnerById(partnerIds, true);
    const rows = [];
    _.each(partners, (partner) => {
      const row = createPartnerSchemaAsOnSheet(partner);

      rows.push(row);
    });
    await this.addRows(rows);
  }

  async getParntersObject(allRows) {
    const partnerIds = _.map(allRows, (row) => row.partnerId);
    // get all the incoming call objects from the DB
    let partners = await this.partnerService.findPartnerById(partnerIds);
    partners = _.map(partners, (partner) => [partner.id, partner]);
    partners = _.object(partners);
    return partners;
  }

  async updatePartnersOnSheet(allRows) {
    console.log('Updating Partners on gSheet.');

    // use this to build a list of all the updates need to be done to the google sheet
    const rangeUpdates = [];

    const partners = await this.getParntersObject(allRows);

    // build a list of updates that need to be done
    const maxColNum = _.keys(this.headers).length;
    _.each(allRows, (partner) => {
      const dbPartner = partners[partner.id];
      if (!dbPartner) {
        // TODO: dbPartner means the id on the gSheet is not in the db
        // should sent an error message later
        return;
      }
      const row = createPartnerSchemaAsOnSheet(dbPartner);

      const sheetRow = Array(maxColNum).fill(null);
      _.each(row, (value, key) => {
        sheetRow[this.headers[key].col - 1] = value;
      });

      const a1Range = internals.getA1RangeNotation(1, partner.row, maxColNum, partner.row);
      rangeUpdates.push({
        range: `${CONSTANTS.gSheet.partnerSheetName}!${a1Range}`,
        values: [sheetRow],
      });
    });

    // finall update the sheet
    const rangeUpdate = await this.batchUpdateGoogleSheet(rangeUpdates);
    return rangeUpdate;
  }

  async startSync() {
    const allRows = await this.getAllRows();
    await this.addNewPartnersOnSheet(allRows);
    await this.updatePartnersOnSheet(allRows);
  }
};
