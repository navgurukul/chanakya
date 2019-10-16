
const phantom = require('phantom');
const fs = require('fs');
const FormData = require('form-data');
const _ = require('underscore');
const handleBar = require('./handleBarsConfig');
const CONSTANTS = require('../constants');


const readFileAsync = (filePath) => new Promise((resolve, reject) => {
  fs.readFile(filePath, 'utf8', (error, data) => {
    if (error) {
      reject(new Error(`Some error : ${error}`));
    } else {
      resolve(data);
    }
  });
});

const writeFileAsync = (filePath, data) => new Promise((resolve, reject) => {
  fs.writeFile(filePath, data, (error) => {
    if (error) {
      reject(new Error(`Some error : ${error}`));
    } else {
      resolve(1);
    }
  });
});

/**
 * Read the Json File
 */
// const readJsonFile = filePath => readFileAsync(filePath).then(string => JSON.parse(string));

/**
 * create the html page for rendering in question.html.
 */

const htmlPageGenerator = (inputFilePath, jsonData, outputFilePath) => readFileAsync(inputFilePath)
  .then((htmlString) => handleBar.compile(htmlString))
  .then((template) => template(jsonData))
  .then((renderedHtml) => writeFileAsync(outputFilePath, renderedHtml))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });

/**
 * generate question pdf for Navgurukul using the question.html and saving
 * the ouput in output.pdf
 */

const createPdf = (inputHtmlFile, outputPdfFile) => phantom
  .create()
  .then((ph) => ph.createPage())
  .then((page) => {
    page.property('paperSize', {
      format: 'letter',
      orientation: 'portrait',
      margin: {
        top: '1.5cm',
        bottom: '1cm',
      },
    });
    return page;
  })
  .then((page) => {
    page.property('settings', {
      dpi: '96',
      loadImages: true, // image load problem solved using this.
    });
    return page;
  })
  .then((page) => new Promise((resolve, reject) => {
    page.open(inputHtmlFile);
    page.on('onLoadFinished', (status) => {
      console.log('In onLoadFinished', status);
      if (status !== 'success') {
        console.log('Unable to load the address!');
        reject();
      } else {
        page.render(outputPdfFile);
        page.close();
        console.log(`Done creating ${outputPdfFile}!`);
        resolve();
      }
    });
  }));
// const jsonFile = 'questions_main.json';

// const questionHtml = 'questionPdf.html';
// const answerHtml = 'answerKeyPdf.html';

const outputQuestionHtml = CONSTANTS.questions.pdf.quesPaperHTMLPath;
const outputAnswerHtml = CONSTANTS.questions.pdf.answerKeyHTMLPath;

const outputQuestionPdf = CONSTANTS.questions.pdf.quesPaperPDFPath;
const outputAnswerPdf = CONSTANTS.questions.pdf.answerKeyPDFPath;

exports.createTestAndAnswerKeyPDF = async (questions, partnerName, assessmentName) => {
  const q = htmlPageGenerator(CONSTANTS.questions.pdf.quesPaperTemplate,
    { questions, partnerName, setName: assessmentName }, outputQuestionHtml);
  const a = htmlPageGenerator(CONSTANTS.questions.pdf.answerKeyTemplate,
    { questions, partnerName, setName: assessmentName }, outputAnswerHtml);
  return Promise.all([q, a]).then(() => {
    const qPdf = createPdf(outputQuestionHtml, outputQuestionPdf);
    const aPdf = createPdf(outputAnswerHtml, outputAnswerPdf);
    return Promise.all([qPdf, aPdf]);
  }).then(() => {
    const pdfs = {
      questionPaper: outputQuestionPdf,
      answerKey: outputAnswerPdf,
    };
    const uploadPromises = _.map(_.pairs(pdfs), (pdf) => {
      const path = pdf[1];
      const pdfType = pdf[0];
      return new Promise((resolve, reject) => {
        console.log(__dirname);
        const formData = new FormData();
        setTimeout(() => {
          formData.append('file', fs.createReadStream(path));
          formData.submit(`${CONSTANTS.apiBaseUrl}/general/upload_file/answerCSV`, (err, res) => {
            if (res) {
              res.on('data', (d) => {
                const response = JSON.parse(d.toString());
                resolve({
                  url: response.fileUrl,
                  pdfType,
                });
              });
            } else {
              reject(err);
            }
          });
        }, 5000);
      });
    });
    return Promise.all(uploadPromises);
  }).then((urls) => {
    // delete the newly created files
    // _.each([outputQuestionHtml, outputAnswerHtml, outputQuestionPdf, outputAnswerPdf], (path) =>{
    //   fs.unlinkSync(path);
    // });

    // return the urls

    const obj = {
      questionPaperUrl: _.where(urls, { pdfType: 'questionPaper' })[0].url,
      answerKeyUrl: _.where(urls, { pdfType: 'answerKey' })[0].url,
    };

    return obj;
  });
};
