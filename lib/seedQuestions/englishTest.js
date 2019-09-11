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
const MDTokensToMD = require("./helpers.js");

module.exports = class EnglishTestQuestionSeeder {
    
    constructor(config, questionDirPath, updateMDFiles, addAllQuestionsAndPassages) {
        
        this.config = config;
        this.questionDirPath = questionDirPath;
        
        // if active will only make POST requests to add questions
        this.addAllQuestionsAndPassages = addAllQuestionsAndPassages;

        // if active will update MD files
        this.updateMDFiles = updateMDFiles;

        this.questionFiles = [];
        this.passageFiles = [];
        
        this.regexs = {
            choiceHeading: /(Question Choice )\d+/gm,
            mdImages: /!\[(.*?)\]\((.*?)\)/g,
        },
        
        this.finalquestions = [];
        this.finalpassages = [];
        this.questions = [];
        this.passages = [];
        this.imagePath = [];
    }

    async startParsing() {
        // get all the question files
        this.getQuestionFiles();
        // parse all the passages and question files
        let questions = _.map(this.questionFiles, (file) => { 
            console.log('Parsing ' + file.FileName + '... \n');
            return this.parseQuestionFile(file);
        });

        this.questions = questions;
        
        // get all the passage file
        this.getpassageFile(); 
        // get all the passages with image link
        let imagePathWithPassage =  _.map(this.passageFiles, (file, passageIndex) => {
            console.log('Parsing ' + file.FileName + '... \n');
            return this.parsePassageFile(file, passageIndex);  
        })
        this.imagePath = imagePathWithPassage
        
        let imageLinks = await this.uploadImages();
        this.replaceImageLinks(imageLinks);
        
        // creating final pasages.
        let finalpassages = _.map(this.imagePath, (passage) => {
            return this.getAllPassages(passage)
        })
        this.finalpassages = finalpassages
        
        // create final data of Passage And respective questions
        this.createFinalData();

        // add All Passages and Questions in DB
        await this.addAllPassage();
        let addQuestions = await this.addAllQuestions();
        
        // update passage MD file.
        let passageFiles = {};
        _.map(this.finalpassages, (file) => {
            passageFiles[file.filePath] = null
        });
        _.map(this.finalpassages, (obj, index) => {
            let filePath = obj.filePath;
            let tokensToMD = null;
            if (passageFiles[filePath]) {
                tokensToMD = passageFiles[filePath];
            } else {
                let tokens = this.finalpassages[index].tokens
                tokensToMD = new MDTokensToMD(tokens, filePath);
                passageFiles[filePath] = tokensToMD;
            }
            tokensToMD.updateChoiceId(obj.mainTokenIndexs.attrs, obj.apiResponse);
        });
        // write the passage files with the updated IDs.
        // only do this if the flag is turned on.
        if (this.updateMDFiles) {
            console.log("Updating Passage MD files.");
            _.map(_.pairs(passageFiles), (obj) => {
                let mdTokensToMD = obj[1];
                mdTokensToMD.render();
                mdTokensToMD.writeToFile();
            });
        }
        // update questions MD file.
        let questionFiles = {};
        _.map(this.questions, (file) => { 
            questionFiles[file.filePath] = null 
        });
        _.map(this.questions, (obj, index) => {
            let filePath = obj.filePath;
            let tokensToMD = null;
            _.map(obj.choices, (choice) => {
                if (questionFiles[filePath]) {
                    tokensToMD = questionFiles[filePath];
                } else {
                    let tokens = this.questions[index].tokens;
                    tokensToMD = new MDTokensToMD(tokens, filePath);
                    questionFiles[filePath] = tokensToMD;
                }
                tokensToMD.updateChoiceId(choice.mainTokenIndexes.attrs, choice.apiResponse.id);
                tokensToMD.updateOptionsTable(choice.tokens.mainTokenIndexes, choice.tokens.apiResponse)
            })
        });
        // write the questions files with the updated IDs.
        // only do this if the flag is turned on.
        if (this.updateMDFiles) {
            console.log("Updating Questions MD files.");
            _.map(_.pairs(questionFiles), (obj) => {
                let mdTokensToMD = obj[1];
                mdTokensToMD.render();
                mdTokensToMD.writeToFile();
            });
        }
    }
    
    parsePassageFile(file, passageIndex) {
        // Tokenize the MD 
        let f = fs.readFileSync( this.questionDirPath + '/' + file.FileName, 'utf-8');
        let tokens = marked.lexer(f);
        let imagePath = []
        _.map(tokens, (token, index) => {
            let image = {}
            if(token.type == "paragraph" && token.text.match(this.regexs.mdImages)) {
                image.imagePath = token.text.match(this.regexs.mdImages)[0];
                image.tokenIndex = index
                image.passageIndex = passageIndex
                imagePath.push(image)
            }
        })

        return {
            imagePath: imagePath,
            tokens: tokens,
            filePath: this.questionDirPath + '/' + file.FileName
        }
    }

    uploadImages() {
        let allPromises = [];
        _.map(this.imagePath, (imagepath) => {
            _.map(imagepath.imagePath, (imge) => {
                allPromises.push(this.uploadImagesToS3(imge.imagePath, imge.tokenIndex, imge.passageIndex))
            })
        })
        return Promise.all(allPromises)
    }
    
    async uploadImagesToS3(imageText, tokenIndex, PassageIndex) {
        let imagePath = imageText.split("]")[1].slice(1,-1);
        let imageStream = fs.createReadStream(this.questionDirPath + '/' + imagePath);
        const FormData = require("form-data");
        let formData = new FormData();
        formData.append('file', imageStream);
        return new Promise((resolve, reject) => {
            formData.submit(CONSTANTS.apiBaseUrl + "/general/upload_file/questionImage", (err, res) => {
                if (res) {
                    let data = ""
                    res.on('data', (d) => {
                        let response = JSON.parse(d.toString());
                        resolve({
                            imageUrl: response.fileUrl,
                            imagePath: imagePath,
                            tokenIndex: tokenIndex,
                            passageIndex: PassageIndex
                        });
                    });
                } else {
                    reject(err);
                }
            });
        });
    }

    replaceImageLinks(imageLinks){
        _.map(imageLinks, (link) => {     
            this.imagePath[link.passageIndex].tokens[link.tokenIndex].text = '![]'+'('+link.imageUrl+')';
        })
    }

    getAllPassages(passage) {
        let finalpassage = "";
        let passages = {};
        _.map(passage.tokens, (token, index) => {
            if (token.type == 'code') {
                let passageId = JSON.parse(token.text);
                passages.passageId = passageId.id;
                passages.mainTokenIndexs = { attrs: index }
            }
            if (token.text) {
                if ( token.text.substring(0,3) == '![]') {
                    let value = this.getHTMLFromMDTokens([token])
                    finalpassage = finalpassage + value + '\n'
                }else if (token.type != "code" && token.depth !=1) {
                    let value = this.getHTMLFromMDTokens([token])
                    finalpassage = finalpassage + value + '\n'
                }
            }else{
                finalpassage = finalpassage + '\n\n'
            }
        })

        _.map(passage.imagePath, (img) => {
            passage.tokens[img.tokenIndex].text = img.imagePath
        })
        
        passages.Passage = finalpassage;
        passages.tokens = passage.tokens;
        passages.filePath = passage.filePath
        return passages
    }
    
    createFinalData() {
        let finalQuestions = [];
        _.map(this.finalpassages ,(passage, index) => {
            let questions = [];
            _.map(this.questions[index].choices, (question, e) => {
                let questionFormat = {}
                questionFormat.question = question.tokens.question[0].text
                questionFormat.options = question.options
                questionFormat.type = question.type
                questionFormat.id = question.id
                questions.push(questionFormat)
            })
            passage.questions = questions
            finalQuestions.push(passage)
        });

        this.finalQuestions = finalQuestions
    }

    async addAllQuestions() {
        let promises = []
        _.each(this.finalQuestions, (q, queIndex) => {
            _.each(q.questions, (question, index) => {
                if (!question.id) {
                    if ( this.addAllQuestionsAndPassages || this.updateMDFiles) {
                        _.each(question.options, (o, index) => {    
                            delete question.options[index].id;
                        });
                        let promise = axios.post(`${CONSTANTS.apiBaseUrl}/englishTest/questions`, {
                            question: question.question,
                            options: question.options,
                            passageId: queIndex + 1,
                            type: question.type
                        }).then((response) => {
                            this.questions[queIndex].choices[index].apiResponse = response.data.question
                            this.questions[queIndex].choices[index].tokens.apiResponse = response.data.options
                        })
                        promises.push(promise)        
                    }
                }else{
                    let promise = axios.put(`${CONSTANTS.apiBaseUrl}/englishTest/question` + question.id, {
                        question: question.question,
                        options: question.options,
                        passageId: q.passageId,
                        type: question.type
                    });
                    promises.push(promise)
                }
            })
        });

        await Promise.all(promises);
    }

    async addAllPassage() {
        let promises = [];
        _.each(this.finalpassages, (p, index) => {
            if (!p.passageId) {
                if (!p.passageId && (this.addAllQuestionsAndPassages || this.updateMDFiles)) {
                    let promise = axios.post(`${CONSTANTS.apiBaseUrl}/englishTest/passages`, {
                        passage: p.Passage
                    }).then((response) => {
                        this.finalpassages[index].apiResponse = response.data.data.id
                    })
                    promises.push(promise)
                }
            }else{
                let promise = axios.put(`${CONSTANTS.apiBaseUrl}/englishTest/passage/` + p.passageId, {
                    passage: p.Passage
                })
                promises.push(promise)
            }
        });
        
        await Promise.all(promises);
    }

    getHTMLFromMDTokens(tokens) {
        tokens.links = {};
        return marked.parser(tokens);
    }

    getQuestionFiles() {       
        this.questionFiles = _.map(this.config.passages, (questionFileName) => {
            return {
                FileName: questionFileName.passageQuestion,
            }
        });

        this.questionFiles = _.flatten(this.questionFiles);
    }

    getpassageFile() {
        this.passageFiles = _.map(this.config.passages, (passageFileName) => {
            return {
                FileName: passageFileName.passage,
            }
        })
        this.passageFiles = _.flatten(this.passageFiles)
    }

    parseQuestionFile(file) {
        // Tokenize the MD file.
        let f = fs.readFileSync( this.questionDirPath + '/' + file.FileName, 'utf-8');
        let tokens = marked.lexer(f);

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
        let all = _.map(choices, (c, index) => {
            console.log("Parsing Choice #" + (index+1) + " of the question.");
            let choice = this.getQuestionChoiceTokens(c.tokens, c.headingIndex)
            return choice;
        });

        return {
            choices: all,
            tokens: tokens,
            filePath:  this.questionDirPath + '/' + file.FileName
        };
    }

    getQuestionChoiceTokens(tokens, headingIndex) {
        let questionChoice = { tokens: {} , mainTokenIndexes: {} };

        // parse question attributes
        let choiceAttrToken = tokens[0].text;
        let questionAttrs = JSON.parse(choiceAttrToken);
        questionAttrs.type = CONSTANTS.questions.types[questionAttrs.type];
        questionChoice.id = questionAttrs.id;
        questionChoice.mainTokenIndexes.attrs = headingIndex+1
        questionChoice.tokens.mainTokenIndexes = headingIndex+6
        // parse question & options heading indexes
        let headingIndexes = {};
        let headings = _.map(tokens, (token, index) => {
            if ( token.type == "heading" ) {
                let tokenText = token.text.toLowerCase();
                if (token.depth == 2) {
                    if (tokenText.includes("options")) {
                        headingIndexes.options = index
                        return index
                    }
                }else if (token.depth == 3) {
                    if ( tokenText.includes("english") ) {
                        headingIndexes.question = index
                        return index
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
        let options = this.parseChoiceOptions(questionChoice.tokens.options, questionAttrs.correctOption);
        questionChoice.options = options;
        questionChoice.passageId = questionAttrs.passageId
        questionChoice.type = questionAttrs.type

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

}