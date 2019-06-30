"use strict";
/* eslint-env node */

function transformVisitor(syntax) {
  // in order to debug
  // **** copy from here ****

  function isSaveAttribute(node) {
    if (node.name === "...attributes") {
      return false;
    }
    if (node.value.type !== "TextNode") {
      return false;
    }
    return true;
  }

  function isSaveChain(node) {
    if (node.type === "TextNode") {
      return true;
    }
    if (node.type === "ElementNode") {
      if (node.blockParams.length) {
        return false;
      }
      if (node.modifiers.length) {
        return false;
      }
      if (node.tag.toLowerCase() !== node.tag) {
        return false;
      }

      var hasUnsafeAttr = false;
      node.attributes.forEach(attr => {
        if (!isSaveAttribute(attr)) {
          hasUnsafeAttr = true;
        }
      });

      if (hasUnsafeAttr) {
        return false;
      }
      var hasUnsafeChild = false;
      node.children.forEach(item => {
        if (item.type !== "TextNode" && item.type !== "ElementNode") {
          hasUnsafeChild = true;
        }

        if (!isSaveChain(item)) {
          hasUnsafeChild = true;
        }
      });

      if (hasUnsafeChild) {
        return false;
      }
      return true;
    }
  }

  
  function createUnsafeStatement(value) {
    let trimmedValue = value.trim();
    if (trimmedValue + " " === value) {
      trimmedValue = value + " ";
    } else if (" " + trimmedValue === value) {
      trimmedValue = " " + value;
    } else if (" " + trimmedValue + " " === value) {
      trimmedValue = " " + trimmedValue + " ";
    }
    return {
      type: "MustacheStatement",
      params: [],
      path: {
        type: "StringLiteral",
        value: trimmedValue,
        original: trimmedValue,
        loc: null
      },
      hash: { type: "Hash", pairs: [], loc: null },
      escaped: false,
      loc: null
    };
  }


  function transformBlock(program) {
    let hasUnsafeChild = false;
    let newBody = [];
    program.body.forEach((el) => {
      if (!isSaveChain(el)) {
        newBody.push(el);
        hasUnsafeChild = true;
      } else {
        if (el.type !== "TextNode") {
          newBody.push(createUnsafeStatement(syntax.print(el)));
        } else {
          newBody.push(el);
        } 
      }
    });
    if (hasUnsafeChild) {
      program.body = newBody;
      return;
    }
    var value = syntax.print(program);
    program.body = [
      createUnsafeStatement(value)
    ];
  } 

  const visitor = {
    BlockStatement(node) {
      transformBlock(node.program);
      if (node.inverse) {
        transformBlock(node.inverse);
      }
    },
    Template(node) {
      transformBlock(node);
    },
    ElementNode(node) {
      if (isSaveChain(node)) {
        var value = syntax.print(node);
        return createUnsafeStatement(value);
      }
    }
  };

  // **** copy to here ****

  return visitor;
}

class TemplateHTMLEvalTransform {
  constructor(options) {
    this.syntax = null;
    this.options = options;
  }

  transform(ast) {
    this.syntax.traverse(ast, transformVisitor(this.syntax));

    return ast;
  }
}

module.exports = TemplateHTMLEvalTransform;
module.exports.transformFunction = transformVisitor;
