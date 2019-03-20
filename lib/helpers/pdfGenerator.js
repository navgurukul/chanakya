'use strict';
let webpage = require("webpage");
let fs = require("fs");
let handleBar = require("handlebars");
let phantom = require("phantom");
let system = require("system");
const CONSTANTS = require('../constants');
const { uploadToS3 } = require('../helpers');
const FormData = require("form-data");
const _ = require("underscore");

/* Random Handlebar Stuff */
handleBar.registerHelper({
	eq: function(v1, v2) {
		return v1 === v2;
	},
	ne: function(v1, v2) {
		return v1 !== v2;
	},
	lt: function(v1, v2) {
		return v1 < v2;
	},
	gt: function(v1, v2) {
		return v1 > v2;
	},
	lte: function(v1, v2) {
		return v1 <= v2;
	},
	gte: function(v1, v2) {
		return v1 >= v2;
	},
	and: function() {
		return Array.prototype.slice.call(arguments).every(Boolean);
	},
	or: function() {
		return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
	}
});

handleBar.registerHelper("inc", function(value) {
	return ++value;
});

handleBar.registerHelper("string_lower", function(index) {
	let string_lower = "abcdefghijklmnopqrstuvwxyz";
	return string_lower[index];
});

handleBar.registerHelper("string_upper", function(index) {
	let string_upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	return string_upper[index];
});

handleBar.registerHelper("hasParaTag", function(string){
	return string.indexOf("<p>") > -1
})

const readFileAsync = filePath => {
	return new Promise((resolve, reject) => {
		fs.readFile(filePath, "utf8", (error, data) => {
		if (error) {
			reject(`Some error : ${error}`);
		} else {
			resolve(data);
		}
		});
	});
};

const writeFileAsync = (filePath, data) => {
	return new Promise((resolve, reject) => {
		fs.writeFile(filePath, data, error => {
		if (error) {
			reject(`Some error : ${error}`);
		} else {
			resolve(1);
		}
		});
	});
};

/**
 * Read the Json File
 */
// const readJsonFile = filePath => readFileAsync(filePath).then(string => JSON.parse(string));

/**
 * create the html page for rendering in question.html.
 */

const htmlPageGenerator = (inputFilePath, jsonData, outputFilePath) => {
	// render using mustache
	return readFileAsync(inputFilePath)
		.then(htmlString => handleBar.compile(htmlString))
		.then(template => template(jsonData))
		.then(renderedHtml => writeFileAsync(outputFilePath, renderedHtml))
		.catch(error => {
			console.log(error);
			process.exit(1);
		});
};

/**
 * generate question pdf for Navgurukul using the question.html and saving
 * the ouput in output.pdf
 */

const createPdf = (inputHtmlFile, outputPdfFile) => {
        return phantom
        .create()
        .then(ph => ph.createPage())
        .then( (page) => {
            page.property("paperSize", {
                format: "letter",
                orientation: "portrait",
                margin: {
                	top: "1.5cm",
                	bottom: "1cm",
                },
            })
            return page;
        })
        .then( (page) => {
            page.property("settings", {
                dpi: "96",
                loadImages: true, // image load problem solved using this.
            });
            return page;
        })
        .then( (page) => {
            return new Promise((resolve, reject) => {
                page.open(inputHtmlFile);
                page.on('onLoadFinished', function(status){
                    console.log("In onLoadFinished", status)
                    if (status !== "success") {
                        console.log("Unable to load the address!");
                        reject();
                    } else {
                        page.render(outputPdfFile);
                        page.close();
                        console.log(`Done creating ${outputPdfFile}!`)
                        resolve();
                    }
                });
            })
        } )
};
const jsonFile = "questions_main.json";

const questionHtml = "questionPdf.html";
const answerHtml = "answerKeyPdf.html";

const outputQuestionHtml = CONSTANTS.questions.pdf.quesPaperHTMLPath;
const outputAnswerHtml = CONSTANTS.questions.pdf.answerKeyHTMLPath;

const outputQuestionPdf = CONSTANTS.questions.pdf.quesPaperPDFPath;
const outputAnswerPdf = CONSTANTS.questions.pdf.answerKeyPDFPath;

exports.createTestAndAnswerKeyPDF = async function(questions, partnerName, assessmentName) {

    let q = htmlPageGenerator(CONSTANTS.questions.pdf.quesPaperTemplate, {questions, partnerName, setName: assessmentName}, outputQuestionHtml);
    let a = htmlPageGenerator(CONSTANTS.questions.pdf.answerKeyTemplate, {questions, partnerName, setName: assessmentName}, outputAnswerHtml);
    return Promise.all([q,a]).then( () => {
        let qPdf = createPdf(outputQuestionHtml, outputQuestionPdf);
        let aPdf = createPdf(outputAnswerHtml, outputAnswerPdf);
        return Promise.all([qPdf, aPdf]);
    }).then( () => {
        let pdfs = {
            questionPaper: outputQuestionPdf,
            answerKey: outputAnswerPdf
        }
        let uploadPromises = _.map(_.pairs(pdfs), (pdf) => {
            let path = pdf[1];
            let pdfType = pdf[0]
            return new Promise((resolve, reject) => {
                let formData = new FormData();
                formData.append('file', fs.createReadStream(path));
                formData.submit(CONSTANTS.apiBaseUrl + "/general/upload_file/answerCSV", (err, res) => {
                    if (res) {
                        res.on('data', (d) => {
                            let response = JSON.parse(d.toString());

                            resolve({
                                url: response.fileUrl,
                                pdfType: pdfType
                            })
                        });
                    } else {
                        reject(err);
                    }
                });
            });
        });
        return Promise.all(uploadPromises);
    }).then( (urls) => {
		// delete the newly created files
		// _.each([outputQuestionHtml, outputAnswerHtml, outputQuestionPdf, outputAnswerPdf], (path) => {
		// 	fs.unlinkSync(path);
		// });

		// return the urls
        let obj = {
            questionPaperUrl: _.where(urls, {pdfType: 'questionPaper'})[0].url,
            answerKeyUrl: _.where(urls, {pdfType: 'answerKey'})[0].url
        }
        return obj
    });
}
