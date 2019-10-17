
// const { promisify } = require('util');
const Joi = require('joi');
const readlineSync = require('readline-sync');
const marked = require('marked');
const fs = require('fs-extra');
const _ = require('underscore');
const process = require('process');
const axios = require('axios');
const FormData = require('form-data');
const schemas = require('./schemas');
const CONSTANTS = require('../constants');
const MDTokensToMD = require('./helpers.js');
const EnglishTest = require('./englishTest');

class QuestionSeeder {
  constructor(config, updateMDFiles, addAllQuestions, updateConfigFlag,
    ignoreConfigBucketsAndChoices) {
    this.config = config;
    this.questionFiles = [];
    this.regexs = {
      choiceHeading: /(Question Choice )\d+/gm,
      mdImages: /!\[(.*?)\]\((.*?)\)/g,
    };
    this.questions = [];
    this.finalQuestions = [];

    // if active will update MD files
    this.updateMDFiles = updateMDFiles;
    // if active will monitoring config file is not updating.
    this.updateConfigFlag = updateConfigFlag;
    // if active will make POST requests to add buckets and question choices.
    this.ignoreConfigBucketsAndChoices = ignoreConfigBucketsAndChoices;
    // if active will only make POST requests to add questions
    this.addAllQuestions = addAllQuestions;

    this.updatedQuestionIds = [];
    this.newQuestionIds = [];
    this.updateBucketIds = [];
    this.newBucketIds = [];
  }

  async startParsing() {
    // get all the question files
    this.getQuestionFiles();
    // parse all the question files
    const questions = _.map(this.questionFiles, (file) => {
      console.log(`\nParsing ${file.fileName} ... \n`);
      return this.parseQuestionFile(file);
    });
    this.questions = questions;

    // iterate through all questions to find the images.
    // upload the images to S3 and change the URLs to S3 URLs.
    const imageLinks = await this.uploadImages();
    this.replaceImageLinks(imageLinks);

    // iterate through all the questions to finally to
    // create objects to directly ping to our API
    this.createFinalData();

    // ping the data of questions on the API
    // now `allQuestionIds` will have a list of all question IDs POST or PUT which were added
    await this.addQuestions(); // allQuestionIds

    // if user wants to add new Bucket then POST the new Bucket.
    // add buckets & bucket choices
    await this.addBucketsAndBucketChoices();

    // iterate over all the questions and write the final markdown files with edited values
    const questionFiles = {};
    _.map(this.questionFiles, (file) => {
      questionFiles[file.fileName] = null;
    });
    _.map(this.finalQuestions, (obj) => {
      const { filePath } = obj;
      let tokensToMD = null;
      if (questionFiles[filePath]) {
        tokensToMD = questionFiles[filePath];
      } else {
        const { tokens } = this.questions[obj.questionsIndex];
        tokensToMD = new MDTokensToMD(tokens, filePath);
        questionFiles[filePath] = tokensToMD;
      }
      tokensToMD.updateChoiceId(obj.mainTokenIndexes.attrs, obj.apiResponse.id);
      tokensToMD.updateOptionsTable(obj.mainTokenIndexes.options, obj.apiResponse.options);
    });


    // build an updated version object to create a new version
    this.latestVersion = {
      questionIds: [],
      buckets: [],
    };
    this.latestVersion.questionIds = _.map(this.config.normalQuestionFiles, (f) => {
      const Questions = this.questionsGroupedByFile[f];
      return _.map(Questions, (q) => q.apiResponse.id);
    });

    this.latestVersion.questionIds = _.flatten(this.latestVersion.questionIds);
    this.latestVersion.buckets = _.map(this.config.buckets, (b) => {
      const choiceIds = _.map(b.choices, (c) => c.id);
      return {
        bucketId: b.id,
        choiceIds,
      };
    });

    // write the files with the updated IDs.
    // only do this if the flag is turned on.
    if (this.updateMDFiles) {
      console.log('Updating MD files.');
      _.map(_.pairs(questionFiles), (obj) => {
        const mdTokensToMD = obj[1];
        mdTokensToMD.render();
        mdTokensToMD.writeToFile();
      });
    }

    // updating config file once you run the script.
    if (this.updateConfigFlag) {
      console.log('Updating Config file.');
      await this.UpdateToConfig(this.config);
    }
  }


  async UpdateToConfig(config) {
    const Config = config;
    // update config file if new buckets choice is added.
    _.each(Config.buckets, (updateConfig, index) => {
      _.each(updateConfig.choices, (choice, indx) => {
        Config.buckets[index].choices[indx].file = choice.file.substr(10);
      });
    });
    Config.normalQuestionFiles = [Config.normalQuestionFiles[0].substr(10)];
    fs.writeFileSync('questions/config/config.json', JSON.stringify(Config, null, 2));
  }

  async addBucketsAndBucketChoices() {
    // create buckets (if they don't exist)
    let promises = [];
    _.each(this.config.buckets, (b, index) => {
      const bucketId = b.id;
      if (!bucketId || this.ignoreConfigBucketsAndChoices) {
        const promise = axios.post(`${CONSTANTS.apiBaseUrl}/questions/questionBuckets`, {
          name: b.name,
          numQuestions: b.numQuestions,
        })
          .then((response) => {
            const bucket = response.data.data;
            this.config.buckets[index].id = bucket.id;
          });
        promises.push(promise);
      }
    });
    await Promise.all(promises);
    promises = [];

    // group all the questions added by the bucket choices
    this.questionsGroupedByFile = _.groupBy(this.finalQuestions, (q) => q.filePath);

    // then create the bucket choices if they don't exist
    _.each(this.config.buckets, (b, i) => {
      _.each(b.choices, (c, j) => {
        const questionIds = _.map(this.questionsGroupedByFile[c.file], (q) => q.apiResponse.id);
        if (!c.id || this.ignoreConfigBucketsAndChoices) {
          const promise = axios.post(`${CONSTANTS.apiBaseUrl}/questions/questionBuckets/${b.id}/choices`, {
            questionIds,
          })
            .then((response) => {
              const choice = response.data.data;
              this.config.buckets[i].choices[j].id = choice.id;
            });
          promises.push(promise);
        }
      });
    });
    await Promise.all(promises);
  }

  addQuestions() {
    const allResponses = _.map(this.finalQuestions, (obj, index) => {
      const object = obj;
      if (!object.question.id || this.addAllQuestions || this.updateConfigFile) {
        // if addAllQuestions flag is active then remove the ids from the questions
        if (this.addAllQuestions && object.question.id) {
          delete object.question.id;
          _.each(object.question.options, (o, indexs) => {
            delete object.question.options[indexs].id;
          });
        }
        return axios.post(`${CONSTANTS.apiBaseUrl}/questions`, object.question).then((response) => {
          this.finalQuestions[index].apiResponse = response.data.data;
          this.newQuestionIds.push(response.data.data.id);
          return response.data.data.id;
        });
      }
      return axios.put(`${CONSTANTS.apiBaseUrl}/questions/${object.question.id}`, object.question).then((response) => {
        this.finalQuestions[index].apiResponse = response.data.data;
        this.updatedQuestionIds.push(object.question.id);
        return object.question.id;
      });
    });
    return Promise.all(allResponses);
  }

  createFinalData() {
    const finalQuestions = [];
    _.map(this.questions, (question, questionsIndex) => {
      _.map(question.choices, (choice, choiceIndex) => {
        const finalQuestion = { ...choice.attrs };
        finalQuestion.options = [];
        if (choice.id) {
          finalQuestion.id = choice.id;
        }
        _.map(['commonText', 'hiText', 'enText'], (prop) => {
          let value = this.getHTMLFromMDTokens(choice.tokens[prop]);
          if (prop === 'commonText' || prop === 'enText') {
            if (!value) {
              value = null;
            }
          }
          finalQuestion[prop] = value;
        });
        _.map(choice.options, (Option) => {
          const option = Option;
          if (!option.id) {
            delete option.id;
          }
          if (finalQuestion.type !== CONSTANTS.questions.types.integer) {
            option.text = marked(option.text);
          }
          option.text = option.text.trim();
          finalQuestion.options.push(option);
        });
        finalQuestions.push({
          bucket: choice.bucket,
          question: finalQuestion,
          questionsIndex,
          choiceIndex,
          filePath: question.filePath,
          mainTokenIndexes: choice.mainTokenIndexes,
        });
      });
    });
    this.finalQuestions = finalQuestions;
  }

  getHTMLFromMDTokens(tokens) {
    const token = tokens;
    token.links = {};
    return marked.parser(token);
  }

  replaceImageLinks(imageLinks) {
    _.map(imageLinks, (link) => {
      if (link.prop === 'options') {
        const content = this.questions[link.questionsIndex].choices[link.choicesIndex]
          .options[link.optionsIndex].text;
        this.questions[link.questionsIndex].choices[link.choicesIndex]
          .options[link.optionsIndex].text = content.replace(link.imagePath, link.imageUrl);
      } else {
        const content = this.questions[link.questionsIndex].choices[link.choicesIndex]
          .tokens[link.prop][link.tokenIndex].text;
        this.questions[link.questionsIndex].choices[link.choicesIndex]
          .tokens[link.prop][link.tokenIndex].text = content.replace(link.imagePath, link.imageUrl);
      }
    });
  }

  async uploadImages() {
    const allUploadPromises = _.map(this.questions, (question,
      questionsIndex) => _.map(question.choices, (choice, choicesIndex) => {
      const uploadPromises = _.map(['commonText', 'hiText', 'enText'], (prop) => this.uploadImagesOfTokens(choice.tokens[prop], questionsIndex, choicesIndex, prop));
      _.map(choice.options, (option, optionsIndex) => {
        const images = option.text.match(this.regexs.mdImages);
        _.map(images, (image) => {
          uploadPromises.push(
            this.uploadImagesToS3(image, questionsIndex, choicesIndex, 'options', optionsIndex),
          );
        });
      });
      return _.flatten(uploadPromises);
    }));
    return Promise.all(_.flatten(allUploadPromises));
  }

  uploadImagesOfTokens(tokens, questionsIndex, choicesIndex, prop, optionsIndex) {
    // given a list of token this checks for all the image occurances
    // in the .text property of those tokens. calls `uploadImagesToS3`
    // function for all the images.
    const allPromises = [];
    _.map(tokens, (token, tokenIndex) => {
      if (token.text) {
        const images = token.text.match(this.regexs.mdImages);
        _.map(images, (image) => {
          allPromises.push(this.uploadImagesToS3(image, questionsIndex,
            choicesIndex, prop, optionsIndex, tokenIndex));
        });
      }
    });
    return allPromises;
  }

  async uploadImagesToS3(imageText, questionsIndex, choicesIndex, prop, optionsIndex, tokenIndex) {
    const imagePath = imageText.split(']')[1].slice(1, -1);
    const imageStream = fs.createReadStream(`${this.questionsDirPath}/${imagePath}`);

    const formData = new FormData();
    formData.append('file', imageStream);
    return new Promise((resolve, reject) => {
      formData.submit(`${CONSTANTS.apiBaseUrl}/general/upload_file/questionImage`, (err, res) => {
        if (res) {
          res.on('data', (d) => {
            const response = JSON.parse(d.toString());
            resolve({
              imageUrl: response.fileUrl,
              imagePath,
              questionsIndex,
              choicesIndex,
              optionsIndex,
              prop,
              tokenIndex,

            });
          });
        } else {
          reject(err);
        }
      });
    });
  }

  getQuestionFiles() {
    this.questionFiles = _.map(this.config.buckets, (b) => _.map(b.choices, (f) => ({
      fileName: f.file,
      bucket: b,
    })));
    this.questionFiles = _.flatten(this.questionFiles);
    _.each(this.config.normalQuestionFiles, (f) => {
      this.questionFiles.push({
        fileName: f,
        bucket: null,
      });
    });
  }

  parseQuestionFile(file) {
    // Tokenize the MD file.
    const f = fs.readFileSync(file.fileName, 'utf-8');
    const tokens = marked.lexer(f);

    // Find the indexes of the Top Level (#) headings for question choice.
    // Every choice is an alternate version of the same question.
    const choiceIndexes = [];
    _.map(tokens, (token, index) => {
      if (token.type === 'heading' && token.depth === 1 && token.text.trim().match(this.regexs.choiceHeading)) {
        choiceIndexes.push(index);
      }
    });

    // Group the tokens of every choice into an array of its own.
    const choices = [];
    _.map(choiceIndexes, (choiceIndex, index) => {
      const nextChoiceIndex = choiceIndexes[index + 1];
      const choice = {
        headingIndex: choiceIndex,
      };
      if (nextChoiceIndex) {
        choice.tokens = tokens.slice(choiceIndex + 1, nextChoiceIndex);
      } else {
        choice.tokens = tokens.slice(choiceIndex + 1);
      }
      choices.push(choice);
    });


    // Parse all the options
    const all = _.map(choices, (c, index) => {
      console.log(`Parsing Choice #${index + 1} of the question.`);
      const choice = this.getQuestionChoiceTokens(c.tokens, c.headingIndex);
      choice.bucket = file.bucket;
      return choice;
    });
    return {
      choices: all,
      filePath: file.fileName,
      tokens,
    };
  }

  getQuestionChoiceTokens(tokens, headingIndex) {
    const questionChoice = { tokens: {}, mainTokenIndexes: {} };

    // parse question attributes
    const choiceAttrToken = tokens[0];

    const questionAttrs = JSON.parse(choiceAttrToken.text);
    questionAttrs.difficulty = CONSTANTS.questions.difficulty[questionAttrs.difficulty];
    questionAttrs.type = CONSTANTS.questions.types[questionAttrs.type];

    const choiceAttr = Joi.attempt(questionAttrs, schemas.questionAttrs);
    questionChoice.id = choiceAttr.id;
    questionChoice.mainTokenIndexes.attrs = headingIndex + 1;

    // parse common text , english and hindi & options heading indexes
    let headingIndexes = {};
    const headings = _.map(tokens, (token, index) => {
      if (token.type === 'heading') {
        const tokenText = token.text.toLowerCase();
        if (token.depth === 2) {
          if (tokenText.includes('common text')) {
            headingIndexes.commonText = index;
            return index;
          } if (tokenText.includes('options')) {
            headingIndexes.options = index;
            questionChoice.mainTokenIndexes.options = headingIndex + index + 2;
            return index;
          }
        } else if (token.depth === 3) {
          if (tokenText.includes('english')) {
            headingIndexes.enText = index;
            return index;
          } if (tokenText.includes('hindi')) {
            headingIndexes.hiText = index;
            return index;
          }
        }
      }
    });

    // get the tokens beneath every heading (as per the indexes extracted in the previous step)
    headingIndexes = _.pairs(headingIndexes);
    _.map(headingIndexes, (Heading) => {
      const HeadingIndex = Heading[1];
      const [heading] = Heading;
      const headingTokens = headings.slice(headingIndex + 1);
      const currentTokens = [];
      for (let i = 0; i < headingTokens.length; i + 1) {
        const token = headingTokens[i];
        if (token) {
          break;
        }
        currentTokens.push(_.clone(tokens[i + HeadingIndex + 1]));
      }
      questionChoice.tokens[heading] = currentTokens;
    });

    // add the options in a proper format
    const options = this.parseChoiceOptions(questionChoice.tokens.options,
      choiceAttr.correctOption);
    questionChoice.options = options;

    // add the attributes
    questionChoice.attrs = choiceAttr;
    delete questionChoice.attrs.id;

    return questionChoice;
  }

  parseChoiceOptions(optionTableTokens, correct) {
    if (optionTableTokens.length !== 1) {
      QuestionSeeder.showErrorAndExit('Something wrong with the options table. Please check.');
    }
    const token = optionTableTokens[0];
    if (!_.isEqual(_.map(token.header, (el) => el.toLowerCase()), ['option', 'values', 'id'])) {
      QuestionSeeder.showErrorAndExit('The options table is not correct. Please check.');
    }

    // make a formatted options array
    const options = [];
    _.map(token.cells, (cell) => {
      options.push({
        text: cell[1],
        id: cell[2] === 'null' ? null : Number(cell[2]),
        correct: correct === cell[0],
      });
    });

    // check if there is no more than 1 correct option
    if (_.where(options, { correct: true }).length !== 1) {
      QuestionSeeder.showErrorAndExit('Every question choice should have 1 correct option.');
    }

    return options;
  }

  static showErrorAndExit(message) {
    console.log(message);
    console.log('Fix the above error and re-run this script.');
    process.exit();
  }

  static getUpdateMDFilesFlag() {
    if (process.argv.indexOf('--updateMD') > -1) {
      return true;
    }
    return false;
  }

  static getAddAllQuestionsFlag() {
    if (process.argv.indexOf('--addAllQuestions') > -1) {
      return true;
    }
    return false;
  }

  static getUpdateConfigFlag() {
    if (process.argv.indexOf('--updateConfig') > -1) {
      return true;
    }
    return false;
  }

  static ignoreConfigBucketsAndChoices() {
    if (process.argv.indexOf('--ignoreConfigBucketsAndChoices') > -1) {
      return true;
    }
    return false;
  }

  static questionTypeFlag() {
    if (process.argv.indexOf('--questionType') > -1) {
      const questionTpye = process.argv[process.argv.indexOf('--questionType') + 1];
      if (questionTpye === 'mcq') {
        return 'mcqTest';
      }
      return 'english';
    }
  }

  static addquestionsAndPassageFlag() {
    if (process.argv.indexOf('--addAllQuestinsAndPassages') > -1) {
      return true;
    }
    return false;
  }

  static getQuestionDirValue() {
    if (process.argv.indexOf('--questionsDir') > -1 && process.argv.indexOf('--questionType')) {
      const questionsDir = `${process.argv[process.argv.indexOf('--questionsDir') + 1]}/${process.argv[process.argv.indexOf('--questionType') + 1]}`;
      if (!questionsDir) {
        this.showErrorAndExit('--questionsDir param needs to be specified.');
      }
      try {
        fs.statSync(questionsDir); // stat
        return questionsDir;
      } catch (e) {
        this.showErrorAndExit("The specified questions directory doesn't exist.");
      }
    } else {
      this.showErrorAndExit('--questionsDir param needs to be specified.');
    }
    return false;
  }

  async bumpVersion() {
    // get the current version
    let currentVersion = await axios.get(`${CONSTANTS.apiBaseUrl}/test/versions/current`);
    currentVersion = currentVersion.data.data;

    // decide the name of the new version
    let newVersionName = currentVersion.name.slice(1);
    newVersionName = `v${Number(newVersionName) + 1}`;

    // new version question IDs
    this.newQuestionIds.concat(this.updatedQuestionIds); // questionIds
    // post request to create a new version
    const newVersion = await axios.post(`${CONSTANTS.apiBaseUrl}/test/versions`, {
      name: newVersionName,
      questionIds: this.latestVersion.questionIds,
      buckets: this.latestVersion.buckets,
    });
    return newVersion.data.data;
  }

  static verifyConfigFile(questionsDir) {
    // open the config file
    const configFile = fs.readFileSync(`${questionsDir}/config/config.json`);
    const config = JSON.parse(configFile.toString());
    // validate the config file through Joi
    const configValidation = Joi.validate(config, schemas.configSchema);
    if (configValidation.error !== null) {
      this.showErrorAndExit('Please fix the errors with the config file and run again.');
    }

    const allFiles = []; // array of all files

    // check if all the choice markdown files specified with every bucket exist
    const { buckets } = config;
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
    if (_.uniq(_.map(buckets, (b) => b.name)).length !== buckets.length) {
      this.showErrorAndExit('The names of the buckets are not unique.');
    }

    // check if all the normal question files exist
    const { normalQuestionFiles } = config;
    _.each(normalQuestionFiles, (f, i) => {
      const file = `${questionsDir}/${f}`;
      if (!fs.existsSync(file)) {
        this.showErrorAndExit(`The file *${file}* doesn't exist.`);
      } else {
        normalQuestionFiles[i] = file;
        allFiles.push(file);
      }
    });

    // check if all the files should be unique ones
    if (_.uniq(allFiles).length !== allFiles.length) {
      this.showErrorAndExit('Some of the files specified in the config file are specified under two buckets or twice in normal files.');
    }

    const finalConfig = {
      buckets,
      normalQuestionFiles,
    };
    return finalConfig;
  }

  static verifyEnglishConfigFile(questionsDir) {
    // open the config file
    const configFile = fs.readFileSync(`${questionsDir}/config/config.json`);
    const config = JSON.parse(configFile.toString());
    // validate the config file through Joi
    // let configValidation = Joi.validate(config, schemas.configSchemaForEnglish);
    // if (configValidation.error != null) {
    //   this.showErrorAndExit("Please fix the errors with the config file and run again.");
    // }
    const allFiles = []; // array of all files
    // check if all the choice markdown files specified with every bucket exist
    const passages = config.passages;
    _.each(passages, (p) => {
      let passageFile = p.passage;
      passageFile = `${questionsDir}/${passageFile}`;
      let questionFile = p.passageQuestion;
      questionFile = `${questionsDir}/${questionFile}`;

      if (!fs.existsSync(passageFile) && !fs.existsSync(questionFile)) {
        this.showErrorAndExit(`The file *${passageFile}* doesn't exist.`);
      } else {
        allFiles.push(passageFile);
        allFiles.push(questionFile);
      }
    });

    // check if all the files should be unique ones
    if (_.uniq(allFiles).length !== allFiles.length) {
      this.showErrorAndExit('Some of the files specified in the config file are specified under two buckets or twice in normal files.');
    }
    const finalConfig = {
      passages,
    };
    return finalConfig;
  }
}

if (!module.parent) {
  const addAllQuestionsFlag = QuestionSeeder.getAddAllQuestionsFlag();
  const updateMdFlag = QuestionSeeder.getUpdateMDFilesFlag();
  const updateConfigFlag = QuestionSeeder.getUpdateConfigFlag();
  const ignoreConfigBucketsAndChoices = QuestionSeeder.ignoreConfigBucketsAndChoices();
  const questionTypeFlag = QuestionSeeder.questionTypeFlag();
  const allQuestionAndPassageFlag = QuestionSeeder.addquestionsAndPassageFlag();

  // both the question addition and update MD flag cannot be active at the same time
  if (addAllQuestionsFlag && updateMdFlag) {
    QuestionSeeder.showErrorAndExit('--addAllQuestions & --updateMD cannot be active at once.');
  }

  if (allQuestionAndPassageFlag && updateMdFlag) {
    QuestionSeeder.showErrorAndExit('--addAllQuestinsAndPassages & --updateMD cannot be active at once.');
  }
  // confirm from the user if they are sure of running the script without updating markdown files
  if (!updateMdFlag && !readlineSync.keyInYN('Are you sure you want to continue without updating MD files?')) {
    QuestionSeeder.showErrorAndExit('You said you were not sure of continuing without updating files.');
  }

  // check if the add all flag is active or not. if it is active all questions will be
  // added irrespective of IDs specified or not
  if (addAllQuestionsFlag && !readlineSync
    .keyInYN('Are you sure you want to do add questions irrespective of their IDs?')) {
    QuestionSeeder.showErrorAndExit('You said you were not sure of continuing with the --addAllQuestions flag on.');
  }

  // check if user want to update config file or not.
  if (updateConfigFlag && !readlineSync.keyInYN('Are you sure you want to update the config.json file?')) {
    QuestionSeeder.showErrorAndExit('You said you were not sure of continuing to update config file.');
  }

  // checck if user want to add new QuestionBucket and questions choices or not.
  if (ignoreConfigBucketsAndChoices && !readlineSync.keyInYN('Are you sure you want to ignore exisiting buckets & choices and create new?')) {
    QuestionSeeder.showErrorAndExit('You said you were not sure of continuing by ignoring the config file.');
  }

  if (!questionTypeFlag) {
    QuestionSeeder.showErrorAndExit('Please select which type of question you want to seed, englishTest or mcqTest using "--questionType english/mcq" ');
  }

  // directory with questions
  const questionsDir = QuestionSeeder.getQuestionDirValue();
  // verify the config file
  if (questionTypeFlag === 'mcqTest') {
    const config = QuestionSeeder.verifyConfigFile(questionsDir);
    // start the parsing
    const seeder = new QuestionSeeder(config, updateMdFlag, addAllQuestionsFlag,
      updateConfigFlag, ignoreConfigBucketsAndChoices);
    seeder.startParsing()
      .then(() => {
        // inform the user about the questions which have been added and updated
        console.log(`\nYou've added ${seeder.newQuestionIds.length} questions and updated ${seeder.updatedQuestionIds.length} already existing questions.\n`);

        // ask the user if they want to bump up a version or not
        if (readlineSync.keyInYN('Do you want to bump up the version with the latest questions you just updated?')) {
          console.log('Bumping up your version!!');
          return seeder.bumpVersion();
        }
        console.log('The script has run fine. Not updating the version.');
        process.exit();
      })
      .then((newVersion) => {
        console.log(`Now the active version is ${newVersion.name}`);
      });
  } else {
    const config = QuestionSeeder.verifyEnglishConfigFile(questionsDir);
    // start the parsing for English test.
    const seeder = new EnglishTest(config, questionsDir, updateMdFlag, allQuestionAndPassageFlag);
    seeder.startParsing()
      .then(() => {
        console.log('\nYou have successfully added English test passages and their Questions in DB.');
      });
  }
}
