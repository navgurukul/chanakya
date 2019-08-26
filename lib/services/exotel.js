'use strict';

const Schmervice = require('schmervice');
const axios = require("axios");
const querystring = require('querystring');
const CONSTANTS = require('../constants');

module.exports = class ExotelService extends Schmervice.Service {

    constructor() {
        super();
        this.axios = axios.create({
            baseURL: 'https://api.exotel.in/v1/Accounts/' + CONSTANTS.exotel.sid,
            auth: {
                username: CONSTANTS.exotel.sid,
                password: CONSTANTS.exotel.token
            }
        });
    }
    
    hasTemplateForStage(stage){
        return stage in CONSTANTS.smsTemplates
    }

    async sendSMS(mobile, template, templateContext={}) {
        let response;
        return true;
        try{
            console.log(CONSTANTS.smsTemplates[template](templateContext));
            return await this.axios.post('/Sms/send', querystring.stringify({
                From: CONSTANTS.exotel.senderId,
                To: mobile,
                Body: CONSTANTS.smsTemplates[template](templateContext)
            }));
        } catch(e) {
            console.log(e);
            throw e;
        }
    }

};
