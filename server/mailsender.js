const cron = require("node-cron");
const { SESEmail } = require("../lib/helpers/sendEmail");
exports.sendMails = () => {
  cron.schedule("* * * *", () => {
    SESEmail();
  });
};
