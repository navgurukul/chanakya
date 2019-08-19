'use strict';

const Glue = require('glue');
const Manifest = require('./manifest');
const cron = require("node-cron");
const CONSTANTS = require('../lib/constants')
const Dotenv = require('dotenv')
Dotenv.config({ path: `${__dirname}/../.env` });

exports.deployment = async (start) => {

    const manifest = Manifest.get('/');
    const server = await Glue.compose(manifest, { relativeTo: __dirname });

    // Printing a request log
    server.events.on('response', function (request) {
        request.log(request.info.remoteAddress + ': ' + request.method.toUpperCase() + ' ' + request.url.path + ' --> ' + request.response.statusCode);
    });


    await server.initialize();

    if (!start) {
        return server;
    }

    await server.start();

    console.log(`Server started at ${server.info.uri}`);

    // schedule the metric calculation cron
    cron.schedule(CONSTANTS.metricCalcCron, () => {
        const { metricsService } = server.services();
        metricsService.recordPendingMetrics();
    });

    // Inform students test result sending to SMS after 4 hours.
    cron.schedule(CONSTANTS.testResultCron, () =>{
        const { assessmentService } = server.services();
        assessmentService.informTestResult();
    });

    return server;
};

if (!module.parent) { 
    try{
        if (process.env.mode){
            exports.deployment(true);
            
            process.on('unhandledRejection', (err) => {
                throw err;
            });
        }else{
            var NODE_ENV = NodeEnvironmentMode;
        }
    } catch (err) {
        console.log( "Please defined Node Environment mode either development or production in .env file")
        throw err
    }
}
