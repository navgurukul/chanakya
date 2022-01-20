const handleBar = require("handlebars");
const CONSTANTS = require("../constants");
const fs = require("fs");
var res = {
  /**
   * stage wise update
   */
  partnerName: "",
  link: "",
  timeLine: "",
  pendingEnglishInterview: 0,
  pendingAlgebraInterview: 0,
  pendingCultureFitInterview: 0,
  //
  selectedAndJoiningAwaited: 0,
  offerLetterSent: 0,
  finallyJoined: 0,
  //

  /**
   * We need your support
   */
  "1st Call Done, Unreachable": 0,
  "2nd Call Done, Unreachable": 0,
  "3rd Call Done, Unreachable": 0,
  "1st Call Done, Not Responding": 0,
  "2nd Call Done, Not Responding": 0,
  "3rd Done,Not Responding": 0,
};
exports.getTemplateData = (data) => {
  res.pendingEnglishInterview =
    data["Need Action"].pendingEnglishInterview.length;
  res.pendingAlgebraInterview =
    data["Need Action"].pendingAlgebraInterview.length;
  res.pendingCultureFitInterview =
    data["Need Action"].pendingCultureFitInterview.length;

  res.selectedAndJoiningAwaited =
    data[
      "Selected for Navgurukul One-year Fellowship"
    ].selectedAndJoiningAwaited.length;
  res.offerLetterSent =
    data["Selected for Navgurukul One-year Fellowship"].offerLetterSent.length;
  res.finallyJoined =
    data["Selected for Navgurukul One-year Fellowship"].finallyJoined.length;

  getCount(data, "pendingEnglishInterview");
  getCount(data, "pendingAlgebraInterview");
  getCount(data, "pendingCultureFitInterview");

  return res;
};

const getCount = (data, stage) => {
  data["Need Action"][stage].map((e) => {
    if (e.status === "unreachable(1st call done)") {
      res["1st Call Done, Unreachable"] += 1;
    } else if (e.status === "unreachable(2nd call done)") {
      res["2nd Call Done, Unreachable"] += 1;
    } else if (e.status === "unreachable(3rd call done)") {
      res["3rd Call Done, Unreachable"] += 1;
    } else if (e.status === "notResponding(1st call done)") {
      res["1st Call Done, Not Responding"] += 1;
    } else if (e.status === "notResponding(2nd call done)") {
      res["2nd Call Done, Not Responding"] += 1;
    } else if (e.status === "notResponding(3rd call done)") {
      res["3rd Done,Not Responding"] += 1;
    }
  });
};