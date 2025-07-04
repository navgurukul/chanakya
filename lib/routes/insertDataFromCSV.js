const Joi = require('joi');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const Boom = require('@hapi/boom');

// Constants
const genderMap = {
    f: 1,
    m: 2,
    t: 3,
};

const casteMap = {
    obc: 1,
    scst: 2,
    general: 3,
    others: 4,
};

const religionMap = {
    hindu: 1,
    islam: 2,
    sikh: 3,
    jain: 4,
    christian: 5,
    others: 6,
    buddhism: 7,
};

const qualificationMap = {
    "less than 10th": 1,
    "10th": 2,
    "12th": 3,
    "graduate": 4,
    "b.a.": 5,
    "b.com.": 6,
    "m.com": 7,
    "m.sc.": 8,
    "bca": 9,
    "b.sc.": 10,
    "bba": 11,
    "iti": 12,
};

const currentStatusMap = {
    "nothing": 1,
    "job": 2,
    "study": 3,
    "other": 4,
};

// Clean and map row
function cleanRow(row) {
    const cleaned = {};
    const normalize = (val) => val?.toString().trim().toLowerCase();

    // Direct mappings
    if (row['Name']) cleaned.name = row['Name'];
    if (row['City']) cleaned.city = row['City'];
    if (row['Final Marks']) cleaned.evaluation = row['Final Marks'];
    if (row['LR Status']) cleaned.campus_status = row['LR Status'];
    if (row['Final Notes']) cleaned.other_activities = row['Final Notes'];
    if (row['Mobile No.']) cleaned.contact_no = row['Mobile No.'];
    if (row['WA NO.']) cleaned.whatsapp_no = row['WA NO.'];

    // Enum mappings
    const gender = normalize(row['Gender']);
    if (genderMap[gender]) cleaned.gender = genderMap[gender];

    const caste = normalize(row['Caste']);
    if (casteMap[caste]) cleaned.caste = casteMap[caste];

    const religion = normalize(row['Religion'] || row['Religon']);
    if (religionMap[religion]) cleaned.religon = religionMap[religion];

    const qualification = normalize(row['Qualification']);
    if (qualificationMap[qualification]) cleaned.qualification = qualificationMap[qualification];

    const status = normalize(row['Current Work']);
    if (currentStatusMap[status]) cleaned.current_status = currentStatusMap[status];

    // Optional integer fields
    // if (row['School']) cleaned.school_stage_id = parseInt(row['School']);
    if (row['DOB']) cleaned.dob = new Date(row['DOB']);
    if (row['Qualifying SOP/SOB']) cleaned.school_id = row['Qualifying SOP/SOB'] == 'SOP' ? 1 : 11;

    // Default values
    cleaned.stage = 'enrolmentKeyGenerated';

    return cleaned;
}

// API Route
module.exports = {
    method: 'POST',
    path: '/upload/csv',
    options: {
        description: 'Upload a CSV file and ingest student data into model',
        tags: ['api'],
        payload: {
            maxBytes: 1024 * 1024 * 10,
            multipart: { output: 'stream' },
            parse: true,
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
            },
        },
        validate: {
            payload: Joi.object({
                file: Joi.any().meta({ swaggerType: 'file' }).required(),
            }),
        },
        handler: async (request, h) => {
            const { Student, Contact, StudentSchool } = request.server.models();
            const { file } = request.payload;
            if (!file || !file.hapi || !file.hapi.filename) {
                return Boom.badRequest('No file provided');
            }

            const filename = `${Date.now()}-${file.hapi.filename}`;
            const uploadDir = path.join(__dirname, '../upload/CSV');
            const filePath = path.join(uploadDir, filename);
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

            const fileStream = fs.createWriteStream(filePath);
            await new Promise((resolve, reject) => {
                file.pipe(fileStream);
                file.on('end', resolve);
                file.on('error', reject);
            });

            try {
                const rows = [];
                await new Promise((resolve, reject) => {
                    fs.createReadStream(filePath)
                        .pipe(csv())
                        .on('data', (data) => rows.push(data))
                        .on('end', resolve)
                        .on('error', reject);
                });

                const inserted = [];
                const failed = [];

                for (const row of rows) {
                    try {
                        const cleanedRow = cleanRow(row);

                        const validated = await Student.joiSchema.validateAsync(cleanedRow, {
                            stripUnknown: true,
                            abortEarly: false,
                        });

                        const insertedStudent = await Student.query().insert(validated);
                        const studentId = insertedStudent.id;

                        // ✅ Insert Contact (mobile and WA no)
                        const contactPayload = [];

                        const mobile = row['Mobile No.']?.toString().trim();
                        if (mobile && mobile.length === 10) {
                            contactPayload.push({
                                student_id: studentId,
                                mobile,
                                is_whatsapp: false,
                                contact_type: 'primary',
                            });
                        }

                        const wa = row['WA NO.']?.toString().trim();
                        if (wa && wa.length === 10 && wa !== mobile) {
                            contactPayload.push({
                                student_id: studentId,
                                mobile: wa,
                                is_whatsapp: true,
                                contact_type: 'whatsapp',
                            });
                        }

                        for (const contact of contactPayload) {
                            const validContact = await Contact.joiSchema.validateAsync(contact);
                            await Contact.query().insert(validContact);
                        }

                        // ✅ Insert School Mapping
                        const schoolId = parseInt(row['School']);
                        if (!isNaN(schoolId)) {
                            const schoolPayload = await StudentSchool.joiSchema.validateAsync({
                                student_id: studentId,
                                school_id: schoolId,
                            });

                            await StudentSchool.query().insert(schoolPayload);
                        }

                        inserted.push({ id: studentId, name: insertedStudent.name });

                    } catch (err) {
                        failed.push({ row, errors: err.details || err.message });
                    }
                }

                return h.response({
                    message: 'CSV uploaded and processed',
                    insertedCount: inserted.length,
                    failedCount: failed.length,
                    failedRows: failed.slice(0, 5),
                }).code(200);
            } catch (err) {
                console.error('CSV ingestion error:', err);
                return Boom.internal('Failed to ingest CSV data');
            }
        },
    },
};
