"use strict";
const Glue = require("@hapi/glue");
const Manifest = require("./manifest");
const cron = require("node-cron");
const CONSTANTS = require("../lib/constants");
const knexfile = require("../knexfile");
const knex = require("knex")(knexfile);
const validate = require("@hapi/validate");
// taking mode of node environment from .env file.
const Dotenv = require("dotenv");
const { sendPartnersReports } = require("../lib/helpers/sendEmail");
const { getTemplateData } = require("../lib/helpers/partnersEmailReport");
Dotenv.config({ path: `${__dirname}/../.env` });
console.log("starting ", __dirname);
exports.deployment = async (start) => {
  const manifest = Manifest.get("/");
  const server = await Glue.compose(manifest, { relativeTo: __dirname });

  // Printing a request log
  server.events.on("response", function (request) {
    request.log(
      request.info.remoteAddress +
        ": " +
        request.method.toUpperCase() +
        " " +
        request.url.path +
        " --> " +
        request.response.statusCode
    );
  });
  await server.initialize();

  if (!start) {
    return server;
  }

  await server.start();

  console.log(`Server started at ${server.info.uri}`);

  // cron is throwing error I dont know why after talking with Abhishek bhaiya I commented this.
  // schedule the metric calculation cron
  // cron.schedule(CONSTANTS.metricCalcCron, () => {
  //     const { metricsService } = server.services();
  //     metricsService.recordPendingMetrics();
  // });
  cron.schedule(`2 * * * * *`, () => {
    knex.raw(`WITH inactive_connections AS (
      SELECT
          pid,
          rank() over (partition by client_addr order by backend_start ASC) as rank
      FROM
          pg_stat_activity
      WHERE
          -- Exclude the thread owned connection (ie no auto-kill)
          pid <> pg_backend_pid( )
      AND
          -- Exclude known applications connections
          application_name !~ '(?:psql)|(?:pgAdmin.+)'
      AND
          -- Include connections to the same database the thread is connected to
          datname = current_database()
      AND
          -- Include connections using the same thread username connection
          usename = current_user
      AND
          -- Include inactive connections only
          state in ('idle', 'idle in transaction', 'idle in transaction (aborted)', 'disabled')
      AND
          -- Include old connections (found with the state_change field)
          current_timestamp - state_change > interval '5 minutes'
  )
  SELECT
      pg_terminate_backend(pid)
  FROM
      inactive_connections
  WHERE
      rank > 1 -- Leave one connection for each application connected to the database`);
  });

  // Inform pending mobilization work to user sending to SMS after 1 hours.
  // cron.schedule(CONSTANTS.deadlineResultCron, () => {
  //   const { feedbackService } = server.services();
  //   feedbackService.informPendingMobilizationWorkto_assignUser();
  // });
  // Inform student to complete the pending online test after 3 hours
  cron.schedule(CONSTANTS.informToCompleteTheTestCron, () => {
    const { studentService } = server.services();
    studentService.informToCompleteTheTest();
  });

  const { emailReportService } = server.services();
  const partnersReports = await emailReportService.getPartners();
  const { partnerService } = server.services();

  cron.schedule("0 00 8 * * *", () => {
    console.log("sending ......");
    var today = new Date().toLocaleDateString(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      weekday: "long",
    });
    //[day,"12/10/21"]
    partnersReports.map(async (report) => {
      const data = await partnerService.progressMade(report.partner_id);
      const res = getTemplateData(data);
      const repeat = report.repeat.trim().toLocaleLowerCase().split(" ");

      //adding some extra data link and name and timeline

      res.link = `https://admissions.navgurukul.org/partner/${report.partner_id}`;
      res.timeLine = repeat;
      let name = await partnerService.findById(report.partner_id);
      res.partnerName = name.name;
      // console.log("Repeat ...................", res);

      //if lenght of the array is 1
      //sending mails daily
      if (repeat.length == 1 && repeat[0] == "daily") {
        sendPartnersReports(res, report.emails);
      }
      // if the length of the array is 2
      //[daily or weekly, day or date]
      else if (repeat.length == 2) {
        if (
          repeat[0] == "weekly" &&
          repeat[1] == today.split(",")[0].toLocaleLowerCase()
        ) {
          sendPartnersReports(res, report.emails);
        }
        if (
          repeat[0] == "monthly" &&
          repeat[1] == today.split(",")[1].split("/")[1].trim()
        ) {
          sendPartnersReports(res, report.emails);
        }
      }
      //if the length of the array is 3
      //[name of month or week,day or date,day or date]
      //bi-weekly(sending mails)
      else if (repeat.length == 3) {
        if (
          repeat[0] == "bi-weekly" &&
          (repeat[1] == today.split(",")[0].toLocaleLowerCase() ||
            repeat[2] == today.split(",")[0].toLocaleLowerCase())
        ) {
          sendPartnersReports(res, report.emails);
        }
        if (
          repeat[0] == "bi-monthly" &&
          (repeat[1] == today.split(",")[1].split("/")[1].trim() ||
            repeat[2] == today.split(",")[1].split("/")[1].trim())
        ) {
          sendPartnersReports(res, report.emails);
        }
      }
    });
  });

  // email sedhuler for partners

  return server;
};

if (!module.parent) {
  try {
    if (process.env.NODE_ENV) {
      exports.deployment(true);
      process.on("unhandledRejection", (err) => {
        console.log("error ::::::", err);
      });
    } else {
      throw Error("An environment variable needs to be defined.");
    }
  } catch (err) {
    // if mode is not defiend then inform to user defined mode.
    console.log(
      "Please defined Node Environment mode either development or production in .env file"
    );
    throw err;
  }
}
