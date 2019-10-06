
const marked = require('marked');
const _ = require('underscore');
const fs = require('fs-extra');

module.exports = class MDTokensToMD {
  constructor(tokens, filePath) {
    this.tokens = tokens;
    this.filePath = filePath;
    this.renderer = {
      code: this.renderCode,
      heading: this.renderHeading,
      paragraph: this.renderParagraph,
      space: this.renderSpace,
      table: this.renderTable,
    };
    this.finalMD = '';
  }

  render() {
    _.map(this.tokens, (token, index) => {
      const renderMethod = this.renderer[token.type];
      if (!renderMethod) {
        throw "The correct render method doesn't exist.";
      }
      this.finalMD += renderMethod(token);
    });
  }

  writeToFile() {
    fs.writeFileSync(this.filePath, this.finalMD);
  }

  renderCode(token) {
    let result = '```';
    if (token.lang) {
      result += token.lang;
    }
    result += `\n${token.text}\n` + '```';
    return `${result}\n`;
  }

  renderHeading(token) {
    let result = '#'.repeat(token.depth);
    result += ` ${token.text}`;
    return `\n${result}\n`;
  }

  renderParagraph(token) {
    return `${token.text}\n`;
  }

  renderSpace(token) {
    return '\n';
  }

  renderTable(token) {
    let result = '';
    _.map(token.header, (header, index) => {
      result += `| ${header} `;
      if (index == token.header.length - 1) {
        result += '|\n';
      }
    });
    _.map(token.align, (align, index) => {
      result += '|';
      if (align == 'center') {
        result += ':---:';
      } else if (align == 'left') {
        result += ':---';
      } else if (align == 'right') {
        result += '---:';
      }
      if (index == token.align.length - 1) {
        result += '|\n';
      }
    });
    _.map(token.cells, (cell, iIndex) => {
      _.map(cell, (value, jIndex) => {
        result += '| ';
        result += `${value} `;
        if (jIndex == cell.length - 1) {
          result += '|\n';
        }
      });
    });
    return result;
  }

  updateChoiceId(tokenIndex, choiceId) {
    let tokenText = this.tokens[tokenIndex].text;
    tokenText = JSON.parse(tokenText);
    tokenText.id = choiceId;
    tokenText = JSON.stringify(tokenText, null, 2);
    this.tokens[tokenIndex].text = tokenText;
  }

  updateOptionsTable(tokenIndex, options) {
    const { cells } = this.tokens[tokenIndex];
    const newCells = _.map(options, (option, index) => [index + 1, cells[index][1], option.id]);
    this.tokens[tokenIndex].cells = newCells;
  }
};
