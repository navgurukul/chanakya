const { google } = require("googleapis");
const authCreds = require("./gsecrets.json")

let jwtClient = new google.auth.JWT(
       authCreds.client_email,
       null,
       authCreds.private_key,
       ['https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/calendar']);
//authenticate request
jwtClient.authorize(function (err, tokens) {
 if (err) {
   console.log(err);
   return;
 } else {
   console.log("Successfully connected!");
 }
});

let sheets = google.sheets({ version: "v4", auth: jwtClient});
sheets.spreadsheets.values.append({
    spreadsheetId: "1A82gNiL-QZLtA0ewE-Pup-mqhp8zKLU6KNxwj4oC25Q",
    range: "Main Data!A2:C3",
    insertDataOption: "INSERT_ROWS",
    valueInputOption: "RAW",
    resource: {
      values: [
        ["Xappend 1.1", null, "Rishabh append 1.3"],
        ["Xappend 2.1", "append 2.2", "append 2.3"],
        ["Xappend 3.1", "append 3.2", "append 3.3"]
      ]
    }
})
.then(() => {
    console.log("Done");
});
