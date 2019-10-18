
const marked = require('marked');
const fs = require('fs-extra');
const _ = require('underscore');
const axios = require('axios');
const CONSTANTS = require('../constants');
const MDTokensToMD = require('./helpers.js');

module.exports = class EnglishTestQuestionSeeder {
  constructor(config, questionDirPath, updateMDFiles, addAllQuestionsAndPassages) {
    this.config = config;
    this.questionDirPath = questionDirPath;

    // if active will update MD files
    this.updateMDFiles = updateMDFiles;
    this.addAllQuestionsAndPassages = addAllQuestionsAndPassages;

    this.questionFiles = [];
    this.passageFiles = [];

    this.regexs = {
      choiceHeading: /(Question Choice )\d+/gm,
      mdImages: /!\[(.*?)\]\((.*?)\)/g,
    };

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
    const questions = _.map(this.questionFiles, (file) => {
      console.log(`Parsing ${file.FileName} ... \n`);
      return this.parseQuestionFile(file);
    });

    this.questions = questions;
    // get all the passage file
    this.getpassageFile();
    // get all the passages with image link
    const imagePathWithPassage = _.map(this.passageFiles, (file, passageIndex) => {
      console.log(`Parsing ${file.FileName} ... \n`);
      return this.parsePassageFile(file, passageIndex);
    });

    this.imagePath = imagePathWithPassage;
    const imageLinks = await this.uploadImages();
    this.replaceImageLinks(imageLinks);

    // creating final pasages.
    const finalpassages = _.map(this.imagePath, (passage) => {
      const FinalPassage = this.getAllPassages(passage);
      return FinalPassage;
    });

    this.finalpassages = finalpassages;
    // create final data of Passage And respective questions
    this.createFinalData();

    // add All Passages and Questions in DB
    await this.addAllPassage(); // addPassage
    await this.addAllQuestions(); // addQuestions

    // update passage MD file.
    const passageFiles = {};
    _.map(this.finalpassages, (file) => {
      passageFiles[file.filePath] = null;
    });

    _.map(this.finalpassages, (obj, index) => {
      const { filePath } = obj;
      let tokensToMD = null;

      if (passageFiles[filePath]) {
        tokensToMD = passageFiles[filePath];
      } else {
        const { tokens } = this.finalpassages[index];
        tokensToMD = new MDTokensToMD(tokens, filePath);
        passageFiles[filePath] = tokensToMD;
      }

      tokensToMD.updateChoiceId(obj.mainTokenIndexs.attrs, obj.apiResponse);
    });

    // write the passage files with the updated IDs.
    // only do this if the flag is turned on.

    if (this.updateMDFiles) {
      console.log('Updating Passage MD files.');
      _.map(_.pairs(passageFiles), (obj) => {
        const mdTokensToMD = obj[1];
        mdTokensToMD.render();
        mdTokensToMD.writeToFile();
      });
    }

    // update questions MD file.
    const questionFiles = {};
    _.map(this.questions, (file) => {
      questionFiles[file.filePath] = null;
    });

    _.map(this.questions, (obj, index) => {
      const { filePath } = obj;
      let tokensToMD = null;
      _.map(obj.choices, (choice) => {
        if (questionFiles[filePath]) {
          tokensToMD = questionFiles[filePath];
        } else {
          const { tokens } = this.questions[index];
          tokensToMD = new MDTokensToMD(tokens, filePath);
          questionFiles[filePath] = tokensToMD;
        }

        tokensToMD.updateChoiceId(choice.mainTokenIndexes.attrs, choice.apiResponse.id);
        tokensToMD.updateOptionsTable(choice.tokens.mainTokenIndexes, choice.tokens.apiResponse);
      });
    });

    // write the questions files with the updated IDs.
    // only do this if the flag is turned on.
    if (this.updateMDFiles) {
      console.log('Updating Questions MD files.');
      _.map(_.pairs(questionFiles), (obj) => {
        const mdTokensToMD = obj[1];
        mdTokensToMD.render();
        mdTokensToMD.writeToFile();
      });
    }
  }

  parsePassageFile(file, passageIndex) {
    // Tokenize the MD
    const f = fs.readFileSync(`${this.questionDirPath}/${file.FileName}`, 'utf-8');
    const tokens = marked.lexer(f);
    const imagePath = [];
    _.map(tokens, (token, index) => {
      const image = {};
      if (token.type === 'paragraph' && token.text.match(this.regexs.mdImages)) {
        const [path] = token;
        image.imagePath = path.text.match(this.regexs.mdImages);
        image.tokenIndex = index;
        image.passageIndex = passageIndex;
        imagePath.push(image);
      }
    });
    return {
      imagePath,
      tokens,
      filePath: `${this.questionDirPath}/${file.FileName}`,
    };
  }

  uploadImages() {
    const allPromises = [];
    _.map(this.imagePath, (imagepath) => {
      _.map(imagepath.imagePath, (imge) => {
        allPromises.push(this.uploadImagesToS3(imge.imagePath, imge.tokenIndex, imge.passageIndex));
      });
    });
    return Promise.all(allPromises);
  }

  async uploadImagesToS3(imageText, tokenIndex, PassageIndex) {
    const imagePath = imageText.split(']')[1].slice(1, -1);
    const imageStream = fs.createReadStream(`${this.questionDirPath}/${imagePath}`);
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', imageStream);
    return new Promise((resolve, reject) => {
      formData.submit(`${CONSTANTS.apiBaseUrl}/general/upload_file/questionImage`, (err, res) => {
        if (res) {
        //   let data = "";
          res.on('data', (d) => {
            const response = JSON.parse(d.toString());
            resolve({
              imageUrl: response.fileUrl,
              imagePath,
              tokenIndex,
              passageIndex: PassageIndex,
            });
          });
        } else {
          reject(err);
        }
      });
    });
  }

  replaceImageLinks(imageLinks) {
    _.map(imageLinks, (link) => {
      this.imagePath[link.passageIndex].tokens[link.tokenIndex].text = `![](${link.imageUrl})`;
    });
  }

  getAllPassages(Passage) {
    const passage = Passage;
    let finalpassage = '';
    const passages = {};
    _.map(passage.tokens, (token, index) => {
      if (token.type === 'code') {
        const passageId = JSON.parse(token.text);
        passages.passageId = passageId.id;
        passages.mainTokenIndexs = { attrs: index };
      }

      if (token.text) {
        if (token.text.substring(0, 3) === '![]') {
          const value = this.getHTMLFromMDTokens([token]);
          finalpassage = `${finalpassage}${value}\n`;
        } else if (token.type !== 'code' && token.depth !== 1) {
          const value = this.getHTMLFromMDTokens([token]);
          finalpassage = `${finalpassage}${value}\n`;
        }
      } else {
        finalpassage = `${finalpassage}\n\n`;
      }
    });

    _.map(passage.imagePath, (img) => {
      const image = img;
      passage.tokens[image.tokenIndex].text = image.imagePath;
    });

    passages.Passage = finalpassage;
    passages.tokens = passage.tokens;
    passages.filePath = passage.filePath;

    return passages;
  }

  createFinalData() {
    const finalQuestions = [];
    _.map(this.finalpassages, (Passage, index) => {
      const passage = Passage;
      const questions = [];
      _.map(this.questions[index].choices, (question) => {
        const questionFormat = {};
        questionFormat.question = question.tokens.question[0].text;
        questionFormat.options = question.options;
        questionFormat.type = question.type;
        questionFormat.id = question.id;

        questions.push(questionFormat);
      });
      passage.questions = questions;
      finalQuestions.push(passage);
    });

    this.finalQuestions = finalQuestions;
  }

  async addAllQuestions() {
    const promises = [];
    _.each(this.finalQuestions, (q, queIndex) => {
      _.each(q.questions, (Question, index) => {
        const question = Question;
        if (!question.id || this.addAllQuestionsAndPassages) {
          _.each(question.options, (o, Index) => {
            delete question.options[Index].id;
          });

          const promise = axios.post(`${CONSTANTS.apiBaseUrl}/englishTest/questions`, {
            question: question.question,
            options: question.options,
            passageId: queIndex + 1,
            type: question.type,
          }).then((response) => {
            this.questions[queIndex].choices[index].apiResponse = response.data.question;
            this.questions[queIndex].choices[index].tokens.apiResponse = response.data.options;
          });
          promises.push(promise);
        } else {
          const promise = axios.put(`${CONSTANTS.apiBaseUrl}/englishTest/question${question.id}`, {
            question: question.question,
            options: question.options,
            passageId: q.passageId,
            type: question.type,
          });
          promises.push(promise);
        }
      });
    });

    await Promise.all(promises);
  }

  async addAllPassage() {
    const promises = [];
    _.each(this.finalpassages, (p, index) => {
      if (!p.passageId || this.addAllQuestionsAndPassages) {
        const promise = axios.post(`${CONSTANTS.apiBaseUrl}/englishTest/passages`, {
          passage: p.Passage,
        }).then((response) => {
          this.finalpassages[index].apiResponse = response.data.data.id;
        });
        promises.push(promise);
      } else {
        const promise = axios.put(`${CONSTANTS.apiBaseUrl}/englishTest/passage/${p.passageId}`, {
          passage: p.Passage,
        });
        promises.push(promise);
      }
    });

    await Promise.all(promises);
  }

  getHTMLFromMDTokens(Tokens) {
    const tokens = Tokens;
    tokens.links = {};
    return marked.parser(tokens);
  }

  getQuestionFiles() {
    this.questionFiles = _.map(this.config.passages, (questionFileName) => {
      const filePath = {
        FileName: questionFileName.passageQuestion,
      };
      return filePath;
    });

    this.questionFiles = _.flatten(this.questionFiles);
  }

  getpassageFile() {
    this.passageFiles = _.map(this.config.passages, (passageFileName) => {
      const filePath = {
        FileName: passageFileName.passage,
      };
      return filePath;
    });

    this.passageFiles = _.flatten(this.passageFiles);
  }

  parseQuestionFile(file) {
    // Tokenize the MD file.
    const f = fs.readFileSync(`${this.questionDirPath}/${file.FileName}`, 'utf-8');
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
      console.log(`Parsing Choice #${index + 1}of the question.`);
      const choice = this.getQuestionChoiceTokens(c.tokens, c.headingIndex);
      return choice;
    });

    return {
      choices: all,
      tokens,
      filePath: `${this.questionDirPath}/${file.FileName}`,
    };
  }

  getQuestionChoiceTokens(tokens, headingIndex) {
    const questionChoice = { tokens: {}, mainTokenIndexes: {} };
    // parse question attributes
    const choiceAttrToken = tokens[0].text;
    const questionAttrs = JSON.parse(choiceAttrToken);
    questionAttrs.type = CONSTANTS.questions.types[questionAttrs.type];
    questionChoice.id = questionAttrs.id;
    questionChoice.mainTokenIndexes.attrs = headingIndex + 1;
    questionChoice.tokens.mainTokenIndexes = headingIndex + 6;

    // parse question & options heading indexes
    let headingIndexes = {};
    const headings = _.map(tokens, (token, index) => {
      if (token.type === 'heading') {
        const tokenText = token.text.toLowerCase();
        if (token.depth === 2) {
          if (tokenText.includes('options')) {
            headingIndexes.options = index;
            return index;
          }
        }
        if (token.depth === 3) {
          if (tokenText.includes('english')) {
            headingIndexes.question = index;
            return index;
          }
        }
      }
      return null;
    });

    // get the tokens beneath every heading (as per the indexes extracted in the previous step)
    headingIndexes = _.pairs(headingIndexes);
    _.map(headingIndexes, (Heading) => {
      let heading = Heading;
      const HeadingIndex = Heading[1];
      [heading] = Heading;
      const headingTokens = headings.slice(HeadingIndex + 1);
      const currentTokens = [];
      const i = 0;
      for (i; i < headingTokens.length; i + 1) {
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
      questionAttrs.correctOption);
    questionChoice.options = options;
    questionChoice.passageId = questionAttrs.passageId;
    questionChoice.type = questionAttrs.type;

    return questionChoice;
  }

  static showErrorAndExit(message) {
    console.log(message);
    console.log('Fix the above error and re-run this script.');
    process.exit();
  }

  parseChoiceOptions(optionTableTokens, correct) {
    if (optionTableTokens.length !== 1) {
      this.showErrorAndExit('Something wrong with the options table. Please check.');
    }
    const token = optionTableTokens[0];
    if (!_.isEqual(_.map(token.header, (el) => { const El = el.toLowerCase(); return El; }), ['option', 'values', 'id'])) {
      this.showErrorAndExit('The options table is not correct. Please check.');
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
      this.showErrorAndExit('Every question choice should have 1 correct option.');
    }

    return options;
  }
};
