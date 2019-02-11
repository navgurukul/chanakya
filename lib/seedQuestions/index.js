'use strict';
const {promisify} = require('util');
const Joi = require('joi');
const marked = require('marked');
const fs = require('fs-extra');
const _ = require('underscore');
const process = require('process');
const schemas = require('./schemas')
const CONSTANTS = require('../constants');
const axios = require('axios');
const MDTokensToMD = require("./helpers.js")

class QuestionSeeder {

    constructor(questionsDirPath, updateMDFiles) {
        this.questionsDirPath = questionsDirPath;
        this.questionFiles = [];
        this.regexs = {
            choiceHeading: /(Question Choice )\d+/gm,
            mdImages: /!\[(.*?)\]\((.*?)\)/g,
        },
        this.questions = [];
        this.finalQuestions = [];
        this.updateMDFiles = updateMDFiles;
    }

    async startParsing() {
        // get all the question files
        this.getQuestionFiles();

        // parse all the question files
        let questions = _.map(this.questionFiles, (file) => {
            console.log("\nParsing " + file + " ... \n");
            return this.parseQuestionFile(file);
        });
        this.questions = questions;

        // iterate through all questions to find the images.
        // upload the images to S3 and change the URLs to S3 URLs.
        let imageLinks = await this.uploadImages();
        this.replaceImageLinks(imageLinks);

        // iterate through all the questions to finally to
        // create objects to directly ping to our API
        this.createFinalData();

        // ping the data of questions on the API
        let apiResponses = await this.addQuestions();

        // iterate over all the questions and write the final markdown files with edited values
        let questionFiles = {};
        _.map(this.questionFiles, (file) => { questionFiles[file] = null });
        _.map(this.finalQuestions, (obj) => {
            let filePath = obj.filePath;
            let tokensToMD = null;
            if (questionFiles[filePath]) {
                tokensToMD = questionFiles[filePath];
            } else {
                let tokens = this.questions[obj.questionsIndex].tokens;
                tokensToMD = new MDTokensToMD(tokens, filePath);
                questionFiles[filePath] = tokensToMD;
            }
            tokensToMD.updateChoiceId(obj.mainTokenIndexes.attrs, obj.apiResponse.id);
            tokensToMD.updateOptionsTable(obj.mainTokenIndexes.options, obj.apiResponse.options)
        });

        // write the files with the updated IDs.
        // only do this if the flag is turned on.
        if (this.updateMDFiles) {
            console.log("Updating MD files.");
            _.map(_.pairs(questionFiles), (obj) => {
                let mdTokensToMD = obj[1];
                mdTokensToMD.render();
                mdTokensToMD.writeToFile();
            });
        }

    }

    addQuestions() {
        let allResponses = _.map(this.finalQuestions, (obj, index) => {
            if (!obj.question.id) {
                return axios.post(CONSTANTS.apiBaseUrl + "/questions", obj.question).then( (response) => {
                    this.finalQuestions[index].apiResponse = response.data.data;
                });
            } else {
                return axios.put(CONSTANTS.apiBaseUrl + "/questions/" + obj.question.id, obj.question).then( (response) => {
                    this.finalQuestions[index].apiResponse = response.data.data;
                });
            }
        });
        return Promise.all(allResponses);
    }

    createFinalData() {
        let finalQuestions = [];
        _.map(this.questions, (question, questionsIndex) => {
            _.map(question.choices, (choice, choiceIndex) => {
                let finalQuestion = {...question.attrs};
                finalQuestion.options = [];
                if (choice.id){
                    finalQuestion.id = choice.id;
                }
                _.map(['commonText', 'hiText', 'enText'], (prop) => {
                    finalQuestion[prop] = this.getHTMLFromMDTokens(choice.tokens[prop]);
                });
                _.map(choice.options, (option) => {
                    if (!option.id){
                        delete option.id
                    }
                    if (finalQuestion.type != CONSTANTS.questions.types.integer) {
                        option.text = marked(option.text);
                    }
                    option.text = option.text.trim();
                    finalQuestion.options.push(option);
                });
                finalQuestions.push({
                    question: finalQuestion,
                    questionsIndex: questionsIndex,
                    choiceIndex: choiceIndex,
                    filePath: question.filePath,
                    mainTokenIndexes: choice.mainTokenIndexes
                });
            });
        });
        this.finalQuestions = finalQuestions;
    }

    getHTMLFromMDTokens(tokens) {
        tokens.links = {};
        return marked.parser(tokens);
    }

    replaceImageLinks(imageLinks) {
        _.map(imageLinks, (link) => {
            if (link.prop == 'options') {
                let content = this.questions[link.questionsIndex].choices[link.choicesIndex].options[link.optionsIndex].text;
                this.questions[link.questionsIndex].choices[link.choicesIndex].options[link.optionsIndex].text = content.replace(link.imagePath, link.imageUrl);
            } else {
                let content = this.questions[link.questionsIndex].choices[link.choicesIndex].tokens[link.prop][link.tokenIndex].text;
                this.questions[link.questionsIndex].choices[link.choicesIndex].tokens[link.prop][link.tokenIndex].text = content.replace(link.imagePath, link.imageUrl);
            }
        });
    }

    async uploadImages() {
        let allUploadPromises = _.map(this.questions, (question, questionsIndex) => {
            return _.map(question.choices, (choice, choicesIndex) => {
                let uploadPromises = _.map(['commonText', 'hiText', 'enText'], (prop) => {
                    return this._uploadImagesOfTokens(choice.tokens[prop], questionsIndex, choicesIndex, prop);
                });
                _.map(choice.options, (option, optionsIndex) => {
                    let images = option.text.match(this.regexs.mdImages);
                    _.map(images, (image) => {
                        uploadPromises.push(
                            this.uploadImagesToS3(image, questionsIndex, choicesIndex, 'options', optionsIndex)
                        );
                    });
                });
                return _.flatten(uploadPromises);
            });
        });
        return Promise.all( _.flatten(allUploadPromises) );
    }

    _uploadImagesOfTokens(tokens, questionsIndex, choicesIndex, prop, optionsIndex) {
        // given a list of token this checks for all the image occurances
        // in the .text property of those tokens. calls `uploadImagesToS3`
        // function for all the images.
        let allPromises = [];
        _.map(tokens, (token, tokenIndex) => {
            if (token.text) {
                let images = token.text.match(this.regexs.mdImages);
                _.map(images, (image) => {
                    allPromises.push( this.uploadImagesToS3(image, questionsIndex, choicesIndex, prop, optionsIndex, tokenIndex) );
                });
            }
        });
        return allPromises;
    }

    async uploadImagesToS3(imageText, questionsIndex, choicesIndex, prop, optionsIndex, tokenIndex) {
        let imagePath = imageText.split("]")[1].slice(1,-1);
        let imageStream = fs.createReadStream(this.questionsDirPath + '/' + imagePath);

        const FormData = require("form-data");
        let formData = new FormData();
        formData.append('file', imageStream);
        return new Promise((resolve, reject) => {
            formData.submit(CONSTANTS.apiBaseUrl + "/general/upload_file/answerCSV", (err, res) => {
                if (res) {
                    let data = ""
                    res.on('data', (d) => {
                        let response = JSON.parse(d.toString());
                        resolve({
                            imageUrl: response.fileUrl,
                            imagePath: imagePath,
                            questionsIndex: questionsIndex,
                            choicesIndex: choicesIndex,
                            optionsIndex: optionsIndex,
                            prop: prop,
                            tokenIndex: tokenIndex

                        });
                    });
                } else {
                    reject(err);
                }
            });
        });
    }

    getQuestionFiles() {
        let files = fs.readdirSync(this.questionsDirPath);
        let questionFiles = _.filter(files, function(fileName){
            return fileName.slice(-3) == '.md';
        });
        this.questionFiles = _.map(questionFiles, (fileName) => {
            return this.questionsDirPath + '/' + fileName;
        });
    }

    parseQuestionFile(filePath) {

        // Tokenize the MD file.
        let file = fs.readFileSync(filePath, 'utf-8');
        let tokens = marked.lexer(file);


        // The first token will be the different attributes of a question. Parse them.
        let questionAttrToken = tokens[0];
        if (questionAttrToken.type != 'code' || questionAttrToken.lang != 'json') {
            this.showErrorAndExit("The question attributes are not mentioned properly.");
        }
        let questionAttrs = JSON.parse(questionAttrToken.text);
        questionAttrs.difficulty = CONSTANTS.questions.difficulty[questionAttrs.difficulty];
        questionAttrs.type = CONSTANTS.questions.types[questionAttrs.type];
        questionAttrs = Joi.attempt(questionAttrs, schemas.questionAttrs);

        // Find the indexes of the Top Level (#) headings for question choice.
        // Every choice is an alternate version of the same question.
        let choiceIndexes = [];
        _.map(tokens, (token, index) => {
            if ( token.type == 'heading' && token.depth == 1 && token.text.trim().match(this.regexs.choiceHeading) ){
                choiceIndexes.push(index);
            }
        });

        // Group the tokens of every choice into an array of its own.
        let choices = [];
        _.map(choiceIndexes, (choiceIndex, index) => {
            let nextChoiceIndex = choiceIndexes[index+1];
            let choice = {
                headingIndex: choiceIndex
            };
            if (nextChoiceIndex) {
                choice.tokens = tokens.slice(choiceIndex+1, nextChoiceIndex);
            } else {
                choice.tokens = tokens.slice(choiceIndex+1);
            }
            choices.push(choice);
        });

        // Parse all the options
        let all = _.map(choices, (choice, index) => {
            console.log("Parsing Choice #" + (index+1) + " of the question.");
            return this.getQuestionChoiceTokens(choice.tokens, choice.headingIndex)
        });
        return {
            choices: all,
            attrs: questionAttrs,
            filePath: filePath,
            tokens: tokens
        };
    }

    getQuestionChoiceTokens(tokens, headingIndex) {
        let questionChoice = { tokens: {}, mainTokenIndexes: {} };

        // parse choice attributes
        let choiceAttrToken = tokens[0];
        let choiceAttr = Joi.attempt(JSON.parse(choiceAttrToken.text), schemas.questionChoiceAttrs);
        questionChoice.id = choiceAttr.id;
        questionChoice.mainTokenIndexes.attrs = headingIndex+1

        // parse common text , english and hindi & options heading indexes
        let headingIndexes = {};
        let headings = _.map(tokens, (token, index) => {
            if ( token.type == 'heading' ) {
                let tokenText = token.text.toLowerCase();
                if ( token.depth == 2 ) {
                    if ( tokenText.includes("common text") ) {
                        headingIndexes.commonText = index;
                        return index;
                    } else if ( tokenText.includes("options") ) {
                        headingIndexes.options = index;
                        questionChoice.mainTokenIndexes.options = headingIndex + index + 2;
                        return index;
                    }
                } else if ( token.depth == 3 ) {
                    if ( tokenText.includes("english") ) {
                        headingIndexes.enText = index;
                        return index;
                    } else if ( tokenText.includes("hindi") ) {
                        headingIndexes.hiText = index;
                        return index;
                    }
                }
            }
        });

        // get the tokens beneath every heading (as per the indexes extracted in the previous step)
        headingIndexes = _.pairs(headingIndexes);
        _.map(headingIndexes, (heading, index) => {
            let headingIndex = heading[1];
            heading = heading[0]
            let headingTokens = headings.slice(headingIndex+1);
            let currentTokens = [];
            for(let i=0; i<headingTokens.length; i++){
                let token = headingTokens[i];
                if(token) {
                    break;
                }
                currentTokens.push( _.clone(tokens[i + headingIndex + 1]) );
            }
            questionChoice.tokens[heading] = currentTokens;
        });

        // add the options in a proper format
        let options = this.parseChoiceOptions(questionChoice.tokens.options, choiceAttr.correctOption);
        questionChoice.options = options;

        return questionChoice;

    }

    parseChoiceOptions(optionTableTokens, correct) {
        if (optionTableTokens.length != 1) {
            QuestionSeeder.showErrorAndExit("Something wrong with the options table. Please check.");
        }
        let token = optionTableTokens[0];
        if ( !_.isEqual(_.map(token.header, (el) => {return el.toLowerCase()}), ['option', 'values', 'id']) ) {
            QuestionSeeder.showErrorAndExit("The options table is not correct. Please check.");
        }

        // make a formatted options array
        let options = [];
        _.map(token.cells, (cell) => {
            options.push({
                text: cell[1],
                id: cell[2] == 'null' ? null : Number(cell[2]),
                correct: correct == cell[0] ? true : false
            })
        });

        // check if there is no more than 1 correct option
        if ( _.where(options, {correct: true}).length != 1 ) {
            QuestionSeeder.showErrorAndExit("Every question choice should have 1 correct option.");
        }

        return options
    }

    static showErrorAndExit(message) {
        console.log( message );
        console.log( "Fix the above error and re-run this script." );
        process.exit();
    }

    static getUpdateMDFilesFlag() {
        if ( process.argv.indexOf("--updateMD") > -1 ) {
            return true;
        } else {
            return false;
        }
    }

    static getQuestionDirValue() {
        if (process.argv.indexOf("--questionsDir") > -1){
            let questionsDir = process.argv[process.argv.indexOf("--questionsDir") + 1];
            if (!questionsDir) {
                this.showErrorAndExit("--questionsDir param needs to be specified.");
            }
            try {
                let stat = fs.statSync(questionsDir);
                return questionsDir;
            } catch (e) {
                this.showErrorAndExit("The specified questions directory doesn't exist.");
            }
        } else {
            this.showErrorAndExit("--questionsDir param needs to be specified.");
        }
    }

}

if (!module.parent) {
    let seeder = new QuestionSeeder( QuestionSeeder.getQuestionDirValue(), QuestionSeeder.getUpdateMDFilesFlag() );
    seeder.startParsing();
}
