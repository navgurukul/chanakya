'use strict';

const Schmervice = require('schmervice');
const axios = require("axios");
const querystring = require('querystring');
const CONSTANTS = require('../constants');
const Dotenv = require('dotenv')
Dotenv.config({ path: `${__dirname}/../../.env` });


module.exports = class ExotelService extends Schmervice.Service {

    constructor() {
        super();
        // Do not send the SMS when we are doing debugging in our local system.
        if (process.env.mode != "development" && process.env.mode){
            this.axios = axios.create({
                baseURL: 'https://api.exotel.in/v1/Accounts/' + CONSTANTS.exotel.sid,
                auth: {
                    username: CONSTANTS.exotel.sid,
                    password: CONSTANTS.exotel.token
                }
            });   
        }
    }
    
    hasTemplateForStage(stage){
        return stage in CONSTANTS.smsTemplates
    }

    async sendSMS(mobile, template, templateContext={}) {
        let response;
        try{
            console.log(CONSTANTS.smsTemplates[template](templateContext));
            // if project is working on production level then send the SMS. 
            if (this.axios){
                return await this.axios.post('/Sms/send', querystring.stringify({
                    From: CONSTANTS.exotel.senderId,
                    To: mobile,
                    Body: CONSTANTS.smsTemplates[template](templateContext)
                }));
            }
        } catch(e) {
            console.log(e);
            throw e;
        }
    }

};
