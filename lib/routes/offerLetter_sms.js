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
const puppeteer = require('puppeteer');
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

    const isDantewada = student.name_of_campus_en.toLowerCase().includes('dantewada');

    html = html
        .replace(/{{CandidateName}}/g, student.name)
        .replace(/{{CampusNameEnglish}}/g, student.name_of_campus_en)
        .replace(/{{CampusNameHindi}}/g, student.name_of_campus_hi)
        .replace(/{{SenderNameEnglish}}/g, student.sender_name_en || 'Bilqees')
        .replace(/{{DesignationEnglish}}/g, student.designation_en || 'Campus Incharge')
        .replace(/{{SenderNameHindi}}/g, student.sender_name_hi || 'बिलक़ीस')
        .replace(/{{DesignationHindi}}/g, student.designation_hi || 'परिसर प्रभारी')
        .replace(/{{ContactNumberEnglish}}/g, student.contactNumber || '9090909090')
        .replace(/{{FooterEnglish}}/g, 'www.navgurukul.org | hi@navgurukul.org | YUVA BPO, EDUCATION CITY, JAWANGA, Geedam, Dantewada, Chhattisgarh - 494441')
        .replace(/{{FooterHindi}}/g, 'www.navgurukul.org | hi@navgurukul.org | YUVA BPO, EDUCATION CITY, JAWANGA, Geedam, Dantewada, Chhattisgarh - 494441')
        .replace(/{{NavGurukulLogo}}/g, "https://dev-admissions.navgurukul.org/assets/logo.71054d69.png");

    if (isDantewada) {
        html = html.replace(/{{ChhattisgarhLogo}}/g, "https://erojgar.cg.gov.in/LandingSite/assets/images/cg-logo.png");
    } else {
        html = html.replace(/<img\s+src="\{\{ChhattisgarhLogo\}\}"\s+alt="Chhattisgarh Government Logo"\s*\/?>/g, '');
    }

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await page.close(); // only close page, not browser

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
                    students: Joi.array()
                        .items(
                            Joi.object({
                                name: Joi.string().required(),
                                email: Joi.string().email().required(),
                                name_of_campus_en: Joi.string().required(),
                                name_of_campus_hi: Joi.string().required(),
                                sender_name_en: Joi.string().optional(),
                                designation_en: Joi.string().optional(),
                                sender_name_hi: Joi.string().optional(),
                                designation_hi: Joi.string().optional(),
                                footer_en: Joi.string().optional(),
                                footer_hi: Joi.string().optional(),
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
                    browser = await puppeteer.launch(); // Launch once here

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
                        await browser.close(); // Close browser after all work is done
                    }
                }
            },
        },
    }
]