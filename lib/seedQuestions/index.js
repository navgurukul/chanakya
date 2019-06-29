'use strict';
const {promisify} = require('util');
const Joi = require('joi');
const readlineSync = require('readline-sync');
const marked = require('marked');
const fs = require('fs-extra');
const _ = require('underscore');
const process = require('process');
const schemas = require('./schemas')
const CONSTANTS = require('../constants');
const axios = require('axios');
const MDTokensToMD = require("./helpers.js");

class QuestionSeeder {

    constructor(config, updateMDFiles, addAllQuestions, updateConfigFile) {
        this.config = config;
        this.questionFiles = [];
        this.regexs = {
            choiceHeading: /(Question Choice )\d+/gm,
            mdImages: /!\[(.*?)\]\((.*?)\)/g,
        },
        this.questions = [];
        this.finalQuestions = [];

        // if active will update MD files
        this.updateMDFiles = updateMDFiles;
        // if active will update config file
        this.updateConfigFile = updateConfigFile;

        // if active will only make POST requests to add questions
        this.addAllQuestions = addAllQuestions;

        this.updatedQuestionIds = [];
        this.newQuestionIds = [];
    }

    async startParsing() {
        // get all the question files
        this.getQuestionFiles();
        // parse all the question files
        let questions = _.map(this.questionFiles, (file) => {
            console.log("\nParsing " + file.fileName + " ... \n");
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
        // now `allQuestionIds` will have a list of all question IDs POST or PUT which were added
        let allQuestionIds = await this.addQuestions();
        // iterate over all the questions and write the final markdown files with edited values
        let questionFiles = {};
        _.map(this.questionFiles, (file) => {
            questionFiles[file.fileName] = null
        });
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

        // add buckets & bucket choices
        await this.addBucketsAndBucketChoices();

        // build an updated version object to create a new version
        this.latestVersion = {
            questionIds: [],
            buckets: [],
        };
        this.latestVersion.questionIds = _.map(this.config.normalQuestionFiles, (f) => {
            let questions = this.questionsGroupedByFile[f];
            return _.map(questions, q => q.apiResponse.id);
        })

        this.latestVersion.questionIds = _.flatten(this.latestVersion.questionIds);
        this.latestVersion.buckets = _.map(this.config.buckets, (b) => {
            let choiceIds = _.map(b.choices, c => c.id);
            return {
                bucketId: b.id,
                choiceIds: choiceIds
            }
        })

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

        // updating config file once you run the script.
        if (!this.updateConfigFile){
            console.log("Updating Config file.");
            await this.UpdateToConfig(this.config);
        }
    }


    async UpdateToConfig(config) {
        // update config file if new buckets choice is added.
        _.each(config.buckets, (updateConfig, index) => {
            _.each(updateConfig.choices, (choice, indx) => {
                config.buckets[index].choices[indx].file = choice.file.substr(10)
            })
        })
        config.normalQuestionFiles = [ config.normalQuestionFiles[0].substr(10) ]
        fs.writeFileSync('/home/pralhad/Project/chanakya/questions/config/config.json', JSON.stringify(config, null, 2));
    }

    async addBucketsAndBucketChoices() {
        // create buckets (if they don't exist)
        let promises = [];
        _.each(this.config.buckets, (b, index) => {
            let bucketId = b.id;
            if (!bucketId) {
                let promise = axios.post(`${CONSTANTS.apiBaseUrl}/questions/questionBuckets`, {
                    name: b.name,
                    numQuestions: b.numQuestions
                })
                .then((response) => {
                    let bucket = response.data.data;
                    this.config.buckets[index]['id'] = bucket.id;
                });
                promises.push(promise);
            }
        });
        await Promise.all(promises);
        promises = [];

        // group all the questions added by the bucket choices
        this.questionsGroupedByFile = _.groupBy(this.finalQuestions, (q) => {
            return q.filePath;
        })

        // then create the bucket choices if they don't exist
        _.each(this.config.buckets, (b, i) => {
            _.each(b.choices, (c, j) => {
                let questionIds = _.map(this.questionsGroupedByFile[c.file], q => q.apiResponse.id);
                if (!c.id) {
                    let promise = axios.post(`${CONSTANTS.apiBaseUrl}/questions/questionBuckets/${b.id}/choices`, {
                        questionIds: questionIds
                    })
                    .then((response) => {
                        let choice = response.data.data;
                        this.config.buckets[i].choices[j].id = choice.id;
                    })
                    promises.push(promise);
                }
            })
        });
        await Promise.all(promises);
    }

    addQuestions() {
        let allResponses = _.map(this.finalQuestions, (obj, index) => {
            if (!obj.question.id || this.addAllQuestions) {
                // if addAllQuestions flag is active then remove the ids from the questions
                if (this.addAllQuestions && obj.question.id) {
                    delete obj.question.id;
                    _.each(obj.question.options, (o, index) => {
                        delete obj.question.options[index].id;
                    });
                }
                return axios.post(CONSTANTS.apiBaseUrl + "/questions", obj.question).then( (response) => {
                    this.finalQuestions[index].apiResponse = response.data.data;
                    this.newQuestionIds.push(response.data.data.id);
                    return response.data.data.id;
                });
            } else {
                return axios.put(CONSTANTS.apiBaseUrl + "/questions/" + obj.question.id, obj.question).then( (response) => {
                    this.finalQuestions[index].apiResponse = response.data.data;
                    this.updatedQuestionIds.push(obj.question.id);
                    return obj.question.id;
                });
            }
        });
        return Promise.all(allResponses)
    }

    createFinalData() {
        let finalQuestions = [];
        _.map(this.questions, (question, questionsIndex) => {
            _.map(question.choices, (choice, choiceIndex) => {
                let finalQuestion = {...choice.attrs};
                finalQuestion.options = [];
                if (choice.id){
                    finalQuestion.id = choice.id;
                }
                _.map(['commonText', 'hiText', 'enText'], (prop) => {
                    let value = this.getHTMLFromMDTokens(choice.tokens[prop]);
                    if ( prop == "commonText" || prop == "enText" ) {
                        if (!value) {
                            value = null;
                        }
                    }
                    finalQuestion[prop] = value;
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
                    bucket: choice.bucket,
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
            formData.submit(CONSTANTS.apiBaseUrl + "/general/upload_file/questionImage", (err, res) => {
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
        this.questionFiles = _.map(this.config.buckets, (b) => {
            return _.map(b.choices, (f) => {
                return {
                    fileName: f.file,
                    bucket: b
                }
            });
        });
        this.questionFiles = _.flatten(this.questionFiles);
        _.each(this.config.normalQuestionFiles, (f) => {
            this.questionFiles.push({
                fileName: f,
                bucket: null
            })
        });
    }

    parseQuestionFile(file) {

        // Tokenize the MD file.
        let f = fs.readFileSync(file.fileName, 'utf-8');
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
            choice.bucket = file.bucket;
            return choice;
        });
        return {
            choices: all,
            filePath: file.fileName,
            tokens: tokens
        };
    }

    getQuestionChoiceTokens(tokens, headingIndex) {
        let questionChoice = { tokens: {}, mainTokenIndexes: {} };

        // parse question attributes
        let choiceAttrToken = tokens[0];

        let questionAttrs = JSON.parse(choiceAttrToken.text);
        questionAttrs.difficulty = CONSTANTS.questions.difficulty[questionAttrs.difficulty];
        questionAttrs.type = CONSTANTS.questions.types[questionAttrs.type];

        let choiceAttr = Joi.attempt(questionAttrs, schemas.questionAttrs);
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

        // add the attributes
        questionChoice.attrs = choiceAttr;
        delete questionChoice.attrs.id;

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

    static getAddAllQuestionsFlag() {
        if (process.argv.indexOf("--addAllQuestions") > -1) {
            return true
        } else {
            return false;
        }
    }

    static getUpdateConfigFileFlag() {
        if (process.argv.indexOf("--noUpdateToConfig") > -1) {
            return true
        }else{
            return false
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

    async bumpVersion() {
        // get the current version
        let currentVersion = await axios.get(CONSTANTS.apiBaseUrl + '/test/versions/current');
        currentVersion = currentVersion.data.data;

        // decide the name of the new version
        let newVersionName = currentVersion.name.slice(1);
        newVersionName = "v" + (Number(newVersionName) + 1);

        // new version question IDs
        let version
        let questionIds = this.newQuestionIds.concat(this.updatedQuestionIds);
        // post request to create a new version
        let newVersion = await axios.post(CONSTANTS.apiBaseUrl + "/test/versions", {
            name: newVersionName,
            questionIds: this.latestVersion.questionIds,
            buckets: this.latestVersion.buckets
        });
        return newVersion.data.data;
    }

    static verifyConfigFile(questionsDir) {
        // open the config file
        let configFile = fs.readFileSync(`${questionsDir}/config/config.json`);
        let config = JSON.parse( configFile.toString() );
        // validate the config file through Joi
        let configValidation = Joi.validate(config, schemas.configSchema);
        if (configValidation.error != null) {
            this.showErrorAndExit("Please fix the errors with the config file and run again.");
        }

        let allFiles = []; // array of all files

        // check if all the choice markdown files specified with every bucket exist
        let buckets = config.buckets;
        _.each(buckets, (b, i) => {
            _.each(b.choices, (file, j) => {
                let f = file.file;
                f = `${questionsDir}/${f}`;
                if (!fs.existsSync(f)) {
                    this.showErrorAndExit(`The file *${f}* doesn't exist.`);
                } else {
                    buckets[i].choices[j].file = f;
                    allFiles.push(f);
                }
            });
        });
        // check if the names of the buckets are unique
        if ( _.uniq( _.map(buckets, b => b.name) ).length != buckets.length ) {
            this.showErrorAndExit("The names of the buckets are not unique.");
        }

        // check if all the normal question files exist
        let normalQuestionFiles = config.normalQuestionFiles;
        _.each(normalQuestionFiles, (f, i) => {
            f = `${questionsDir}/${f}`;
            if (!fs.existsSync(f)) {
                this.showErrorAndExit(`The file *${f}* doesn't exist.`);
            } else {
                normalQuestionFiles[i] = f;
                allFiles.push(f);
            }
        });

        // check if all the files should be unique ones
        if (_.uniq(allFiles).length != allFiles.length) {
            this.showErrorAndExit(`Some of the files specified in the config file are specified under two buckets or twice in normal files.`);
        }

        let finalConfig = {
            buckets: buckets,
            normalQuestionFiles: normalQuestionFiles
        }
        return finalConfig;

    }

}

if (!module.parent) {
    let addAllQuestionsFlag = QuestionSeeder.getAddAllQuestionsFlag()
    let updateMdFlag = QuestionSeeder.getUpdateMDFilesFlag()
    let updateToConfigFlag = QuestionSeeder.getUpdateConfigFileFlag()
    // both the question addition and update MD flag cannot be active at the same time
    if (addAllQuestionsFlag && updateMdFlag && updateToConfigFlag) {
        QuestionSeeder.showErrorAndExit("--noUpdateToConfig, --addAllQuestions & --updateMD cannot be active at once.");
    }

    // confirm from the user if they are sure of running the script without updating markdown files
    if ( !updateMdFlag && !readlineSync.keyInYN('Are you sure you want to continue without updating MD files?') ) {
        QuestionSeeder.showErrorAndExit("You said you were not sure of continuing without updating files.");
    }

    // check if the add all flag is active or not. if it is active all questions will be added irrespective of IDs specified or not
    if ( addAllQuestionsFlag && !readlineSync.keyInYN("Are you sure you want to do add questions irrespective of their IDs?") ) {
        QuestionSeeder.showErrorAndExit("You said you were not sure of continuing with the --addAllQuestions flag on.");
    }

    // check if user want to update config file or not.
    if ( !updateToConfigFlag && !readlineSync.keyInYN("Are you sure you want to do update the config.json file with ther bucket Id and bucket choice IDs?")) {
        QuestionSeeder.showErrorAndExit("You said you were not sure of continuing without updating config file.")
    }
    // directory with questions
    let questionsDir = QuestionSeeder.getQuestionDirValue();
    // verify the config file
    let config = QuestionSeeder.verifyConfigFile(questionsDir);
    // start the parsing
    let seeder = new QuestionSeeder( config, updateMdFlag, addAllQuestionsFlag, updateToConfigFlag);
    seeder.startParsing()
    .then(() => {
        // inform the user about the questions which have been added and updated
        console.log(`\nYou've added ${seeder.newQuestionIds.length} questions and updated ${seeder.updatedQuestionIds.length} already existing questions.\n`);

        // ask the user if they want to bump up a version or not
        if ( readlineSync.keyInYN('Do you want to bump up the version with the latest questions you just updated?') ) {
            console.log("Bumping up your version!!");
            return seeder.bumpVersion();
        } else {
            console.log("The script has run fine. Not updating the version.");
            process.exit();
        }
    })
    .then((newVersion) => {
      console.log(`Now the active version is ${newVersion.name}`);
  });


}
