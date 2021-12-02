"use strict";

const Glue = require("@hapi/glue");
const Manifest = require("./manifest");
const cron = require("node-cron");
const CONSTANTS = require("../lib/constants");
const knexfile = require("../knexfile");
const knex = require("knex")(knexfile);
// taking mode of node environment from .env file.
const Dotenv = require("dotenv");
const { sendPartnersReports } = require("../lib/helpers/sendEmail");
const { getTemplateData } = require("../lib/helpers/partnersEmailReport");
Dotenv.config({ path: `${__dirname}/../.env` });
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

  partnersReports.map(async (report) => {
    // console.log(report.partner_id);
    const data = await partnerService.progressMade(report.partner_id);
    // console.log(data);
    const res = getTemplateData(data);
    console.log(res);
    sendPartnersReports(res, report.emails);
  });
  // email sedhuler for partners
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  cron.schedule("0 8 * * *", () => {
    var d = new Date(dateString);
    var dayName = days[d.getDay()];
    data.forEach((e) => {
      if (e.repeat == dayName) {
        // send mail

        SESEmail();
      }
    });
  });
  return server;
};;

if (!module.parent) {
  try {
    if (process.env.NODE_ENV) {
      exports.deployment(true);
      process.on("unhandledRejection", (err) => {
        throw err;
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
