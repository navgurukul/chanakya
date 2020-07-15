
// const marked = require('marked');
const _ = require('underscore');
const fs = require('fs-extra');

function renderCode(token) {
  let result = '```';
  if (token.lang) {
    result += token.lang;
  }
  result += `\n${token.text}\n${result}`;
  return `${result}\n`;
}

function renderHeading(token) {
  let result = '#'.repeat(token.depth);
  result += ` ${token.text}`;
  return `\n${result}\n`;
}

function renderParagraph(token) {
  return `${token.text}\n`;
}

function renderSpace() {
  return '\n';
}

function renderTable(token) {
  let result = '';
  _.map(token.header, (header, index) => {
    result += `| ${header} `;
    if (index === token.header.length - 1) {
      result += '|\n';
    }
  });
  _.map(token.align, (align, index) => {
    result += '|';
    if (align === 'center') {
      result += ':---:';
    } else if (align === 'left') {
      result += ':---';
    } else if (align === 'right') {
      result += '---:';
    }
    if (index === token.align.length - 1) {
      result += '|\n';
    }
  });
  _.map(token.cells, (cell) => {
    _.map(cell, (value, jIndex) => {
      result += '| ';
      result += `${value} `;
      if (jIndex === cell.length - 1) {
        result += '|\n';
      }
    });
  });
  return result;
}

module.exports = class MDTokensToMD {
  constructor(tokens, filePath) {
    this.tokens = tokens;
    this.filePath = filePath;
    this.renderer = {
      code: renderCode,
      heading: renderHeading,
      paragraph: renderParagraph,
      space: renderSpace,
      table: renderTable,
    };
    this.finalMD = '';
  }

  render() {
    _.map(this.tokens, (token) => {
      const renderMethod = this.renderer[token.type];
      if (!renderMethod) {
        throw new Error("The correct render method doesn't exist.");
      }
      this.finalMD += renderMethod(token);
    });
  }

  writeToFile() {
    console.log(this.finalMD)
    fs.writeFileSync(this.filePath, this.finalMD);
  }

  updateChoiceId(tokenIndex, choiceId) {
    let token_text = this.tokens[tokenIndex].text;
    token_text = JSON.parse(token_text);
    token_text.id = choiceId;
    token_text = JSON.stringify(token_text, null, 2);
    this.tokens[tokenIndex].text = token_text;
  }

  updateOptionsTable(tokenIndex, options) {
    const { cells } = this.tokens[tokenIndex];
    const newCells = _.map(options, (option, index) => [index + 1, cells[index][1], option.id]);
    this.tokens[tokenIndex].cells = newCells;
  }
};
