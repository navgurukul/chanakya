const fs = require('fs');
const path = require('path');
const Joi = require('joi');
const AWS = require('aws-sdk');
const Dotenv = require('dotenv');
Dotenv.config({ path: `${__dirname}/../.env` });
const nodemailer = require('nodemailer');
const Boom = require('boom');
const _ = require('lodash');
const Student = require('../models/student');
const CONSTANTS = require('../constants');
const logger = require('../../server/logger');
const helper = require('../helpers/sendEmail');
const { chromium } = require('playwright');
const axios = require('axios');
const AI_SENSY_API_URL = "https://backend.aisensy.com/campaign/t1/api/v2"
AWS.config.update({
    region: 'us-east-1',
    accessKeyId: CONSTANTS.aws.ses.accessKey,
    secretAccessKey: CONSTANTS.aws.ses.secretKey,
});
const ses = new AWS.SES({ apiVersion: '2010-12-01' });

// Generate Offer Letter PDF

async function generateOfferLetterPDF(student, browser) {
    const templatePath = path.join(__dirname, '..', 'helpers', 'templates', 'Offer-Letter-Customizable-Template.html');
    let html = fs.readFileSync(templatePath, 'utf-8');

    const campusData = {
        'jashpur': {
            campus_en: 'Jashpur Campus',
            campus_hi: 'जशपुर परिसर',
            sender_en: 'Sakshi Gangwar',
            sender_hi: 'साक्षी गंगवार',
            designation_en: 'Campus Incharge',
            designation_hi: 'परिसर प्रभारी',
            contact: '7999546881',
            address: 'Livlihood college jashpur nagar'
        },
        'dantewada': {
            campus_en: 'Dantewada Campus',
            campus_hi: 'दंतेवाड़ा परिसर',
            sender_en: 'Bilqees',
            sender_hi: 'बिलक़ीस',
            designation_en: 'Campus Incharge',
            designation_hi: 'परिसर प्रभारी',
            contact: '6005838862',
            address: 'YUVA BPO, EDUCATION CITY, JAWANGA, Geedam, Dantewada, Chhattisgarh - 494441'
        },
        'dharmsala': {
            campus_en: 'Dharmsala Campus',
            campus_hi: 'धर्मशाला परिसर',
            sender_en: 'Ram Ashish Chauhan',
            sender_hi: 'राम आशीष चौहान',
            designation_en: 'Campus Incharge',
            designation_hi: 'परिसर प्रभारी',
            contact: '8052628214',
            address: 'Ward number 202, Sukkhad'
        },
        'kishanganj': {
            campus_en: 'Kishanganj Campus',
            campus_hi: 'किशनगंज परिसर',
            sender_en: 'Anuradha',
            sender_hi: 'अनुराधा',
            designation_en: 'Campus Manager',
            designation_hi: 'परिसर प्रबंधक',
            contact: '+91 7701951835',
            address: 'Bahadurganj Rd, Simalbari'
        },
        'pune': {
            campus_en: 'Pune Campus',
            campus_hi: 'पुणे परिसर',
            sender_en: 'Sakshi Gangwar',
            sender_hi: 'साक्षी गंगवार',
            designation_en: 'Campus Incharge',
            designation_hi: 'परिसर प्रभारी',
            contact: '7999546881',
            address: 'Anish Jadhav Memorial Foundation'
        },
        'raipur': {
            campus_en: 'Raipur Campus',
            campus_hi: 'रायपुर परिसर',
            sender_en: 'Varsha Langhi',
            sender_hi: 'वर्षा लांघी',
            designation_en: '',
            designation_hi: '',
            contact: '8871132818',
            address: ''
        },
        'sarjapur': {
            campus_en: 'Sarjapur Campus',
            campus_hi: 'सर्जापुर परिसर',
            sender_en: 'Samiksha',
            sender_hi: 'समिक्षा',
            designation_en: 'Community In-charge',
            designation_hi: 'सामुदायिक प्रभारी',
            contact: '9307192714',
            address: 'Halanayakana Halli village'
        },
        'udaipur': {
            campus_en: 'Udaipur Campus',
            campus_hi: 'उदयपुर परिसर',
            sender_en: 'Anshika Tripathi',
            sender_hi: 'अंशिका त्रिपाठी',
            designation_en: 'Campus Leader',
            designation_hi: 'परिसर लीडर',
            contact: '+7897735704',
            address: 'Vidya Bhawan Rural Institute'
        },
        'himachal': {
            campus_en: 'Himachal Campus',
            campus_hi: 'हिमाचल परिसर',
            sender_en: 'Amritpal',
            sender_hi: 'अमृतपाल',
            designation_en: 'Eternal University Admissions Office',
            designation_hi: 'एटरनल यूनिवर्सिटी प्रवेश कार्यालय',
            contact: '9816640660',
            address: 'Eternal University Baru Sahib'
        },
        'team': {
            campus_en: 'Navgurukul Campus Team',
            campus_hi: 'नवगुरुकुल टीम',
            sender_en: 'Karuna Lakra',
            sender_hi: 'करुणा लकड़ा',
            designation_en: '',
            designation_hi: '',
            contact: '+91 83196 28393',
            address: ''
        }
    };

    const campusKey = Object.keys(campusData).find(key =>
        student.name_of_campus_en.toLowerCase().includes(key)
    );

    const campusInfo = campusData[campusKey] || {};
    const isDantewada = campusKey === 'dantewada';

    html = html
        .replace(/{{CandidateName}}/g, student.name)
        .replace(/{{SchoolNameEnglish}}/g, student.name_of_school_en)
        .replace(/{{SchoolNameHindi}}/g, student.name_of_school_hi)
        .replace(/{{CampusNameEnglish}}/g, campusInfo.campus_en || '')
        .replace(/{{CampusNameHindi}}/g, campusInfo.campus_hi || '')
        .replace(/{{SenderNameEnglish}}/g, campusInfo.sender_en || 'Bilqees')
        .replace(/{{DesignationEnglish}}/g, campusInfo.designation_en || 'Campus Incharge')
        .replace(/{{SenderNameHindi}}/g, campusInfo.sender_hi || 'बिलक़ीस')
        .replace(/{{DesignationHindi}}/g, campusInfo.designation_hi || 'परिसर प्रभारी')
        .replace(/{{ContactNumberEnglish}}/g, campusInfo.contact || '6005838862')
        .replace(/{{FooterEnglish}}/g, `www.navgurukul.org | hi@navgurukul.org | ${campusInfo.address || ''}`)
        .replace(/{{FooterHindi}}/g, `www.navgurukul.org | hi@navgurukul.org | ${campusInfo.address || ''}`)
        .replace(/{{NavGurukulLogo}}/g, "https://dev-admissions.navgurukul.org/assets/logo.71054d69.png");

    if (isDantewada) {
        html = html.replace(/{{ChhattisgarhLogo}}/g, "https://erojgar.cg.gov.in/LandingSite/assets/images/cg-logo.png");
    } else {
        html = html.replace(/<img\s+src="\{\{ChhattisgarhLogo\}\}"\s+alt="Chhattisgarh Government Logo"\s*\/?>/g, '');
    }

    const context = await browser.newContext(); // ✅ Playwright context
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

    await context.close(); // ✅ Close context instead of full browser
    return pdfBuffer;
}

function getStaticAttachments(campusName) {
    const basePath = path.join(__dirname, '..', 'helpers', 'templates');
    const isDantewada = campusName.toLowerCase().includes('dantewada');

    const commonFiles = isDantewada
        ? [
            'Consent-Form-English-Dhantewada.pdf',
            'Consent-Form-Hindi-Dhantewada.pdf',
        ]
        : [
            'Consent-Form-English-General.pdf',
            'Consent-Form-Hindi-General.pdf',
        ];

    return commonFiles.map((filename) => {
        const filePath = path.join(basePath, filename);
        return {
            filename,
            content: fs.readFileSync(filePath),
        };
    });
}

async function sendEmailWithAttachments(to, subject, htmlBody, attachments) {
    const transporter = nodemailer.createTransport({ SES: ses });
    await transporter.sendMail({
        from: process.env.OTP_SENDER_EMAIL,
        to,
        subject,
        html: htmlBody,
        attachments,
    });
}

module.exports = [
    {
        method: 'POST',
        path: '/student/sendSmsWhenSendOfferLeterToStudents/{studentId}',
        options: {
            description: 'send SMS When The Students Gets OfferLetter.',
            tags: ['api'],
            validate: {
                params: Joi.object({
                    studentId: Joi.number().integer().required(),
                }),
            },
            handler: async (request) => {
                const { sendingSmsToStudents } = request.services();
                const stage = await sendingSmsToStudents.getStage(request.params.studentId)
                if (stage == 'offerLetterSent') {
                    const smsData = await sendingSmsToStudents.prepareSmsTemplate(request.params.studentId);
                    const { formattedData, templateId } = smsData;
                    const smsSend = await sendingSmsToStudents.sendSmsToStudents(formattedData, request.params.studentId, templateId)
                    logger.info('send SMS When The Students Gets OfferLetter.');
                    return { message: 'SMS sent successfully!' };
                } else {
                    logger.error('Invalid stage for sending SMS: ' + stage);
                    throw Boom.badRequest('Invalid stage for sending SMS.');
                }
            },
        },
    },
    {
        method: 'POST',
        path: '/student/sendOfferLetterViaEmail',
        options: {
            description: 'Send Offer Letter via Email with PDF and Static Attachments.',
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    students: Joi.array().items(
                        Joi.object({
                            name: Joi.string().required(),
                            email: Joi.string().email().required(),
                            name_of_campus_en: Joi.string().required(),
                            name_of_school_en: Joi.string().required(),
                            name_of_school_hi: Joi.string().required(),
                            subject: Joi.string().optional(),
                        })
                    ).required(),
                }),
            },
            handler: async (request) => {
                const { students } = request.payload;
                const results = [];

                let browser;
                try {
                    browser = await chromium.launch({ headless: true }); // ✅ Launch Playwright Chromium

                    for (const student of students) {
                        const offerPDF = await generateOfferLetterPDF(student, browser);
                        const staticFiles = getStaticAttachments(student.name_of_campus_en);

                        const attachments = [
                            {
                                filename: `Offer_Letter_${student.name}.pdf`,
                                content: offerPDF,
                            },
                            ...staticFiles,
                        ];

                        const htmlBody = `<p>Dear ${student.name},</p><p>Please find attached your offer letter from NavGurukul along with required documents.</p>`;
                        const subject = student.subject || 'NavGurukul Offer Letter';

                        await sendEmailWithAttachments(student.email, subject, htmlBody, attachments);

                        results.push({ email: student.email, status: 'sent' });
                    }

                    return { success: true, message: 'All offer letters sent successfully.', results };
                } catch (error) {
                    return {
                        success: false,
                        message: 'Failed to send offer letters.',
                        error: error.message || error,
                    };
                } finally {
                    if (browser) {
                        await browser.close(); // ✅ Close Playwright browser
                    }
                }
            },
        },
    },
    {
        method: 'POST',
        path: '/student/outreach/whatsappMessage',
        options: {
            description: 'Send WhatsApp Message via AiSensy API Campaign',
            tags: ['api', 'whatsapp'],
            validate: {
                payload: Joi.object({
                    students: Joi.array().items(
                        Joi.object({
                            name: Joi.string().required(),
                            contactNumber: Joi.number().required()
                        })
                    ).required(),
                    campaignName: Joi.string().required(),
                    params: Joi.array().items(Joi.string()).optional()

                })
            },
            handler: async (request) => {
                const { students, campaignName, params } = request.payload;

                const results = [];

                for (const student of students) {
                    const payload = {
                        apiKey: CONSTANTS.AI_SENSY_API_KEY,
                        campaignName: campaignName, // Or dynamically set this if needed
                        destination: student.contactNumber.toString(),
                        userName: student.name,
                        templateParams: [student.name, ...params, 'Mukul'] 
                    };

                    try {
                        const resp = await axios.post(AI_SENSY_API_URL, payload, {
                            headers: { 'Content-Type': 'application/json' }
                        });
                        results.push({
                            number: student.contactNumber,
                            name: student.name,
                            status: 'sent',
                            response: resp.data
                        });
                    } catch (err) {
                        results.push({
                            number: student.contactNumber,
                            name: student.name,
                            status: 'failed',
                            error: err.response?.data || err.message
                        });
                    }
                }

                return {
                    success: true,
                    message: 'WhatsApp messages processed for outreach',
                    results
                };
            }
        }
    },
]