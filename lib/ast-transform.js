"use strict";
/* eslint-env node */

const { hbsSyntax } = require('ember-meta-explorer');

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

  function astTemplateNode(children) {
    return {
      type: "Template",
      blockParams: [],
      loc: null,
      body: children
    }
  }

  function transformBlock(program) {
    let hasUnsafeChild = false;
    program.body.forEach((el) => {
      if (!isSaveChain(el)) {
        hasUnsafeChild = true;
      }
    });
    if (hasUnsafeChild) {
      program.body = mergeClosestSafeNodes(program.body);
      return;
    }
    var value = syntax.print(program);
    program.body = [
      createUnsafeStatement(value)
    ];
  } 

  function mergeClosestSafeNodes(nodes) {
    const checkedChildren = nodes.map((child)=>{
      return {
        ref: child,
        isSafe: isSaveChain(child)
      }
    });
    const mergedChildren = checkedChildren.reduce((result, item, index) => {
      if (index === 0) {
        result.push(item);
      } else if (!item.isSafe) {
        result.push(item);
      } else if (item.isSafe) {
        let lastResultItem = result[result.length-1];
        if (lastResultItem.isSafe) {
          if (Array.isArray(lastResultItem.ref)) {
            lastResultItem.ref.push(item.ref);
          } else {
            lastResultItem.ref = [lastResultItem.ref];
            lastResultItem.ref.push(item.ref);
          }
        } else {
          result.push(item);
        }
      }

      return result;
    }, []);

    const newChildren = mergedChildren.map((el)=>{
      if (Array.isArray(el.ref)) {
        return createUnsafeStatement(syntax.print(astTemplateNode(el.ref)));
      } else {
        if (el.isSafe) {
          if (el.ref.type !== 'TextNode') {
            return createUnsafeStatement(syntax.print(el.ref));
          } else {
            return el.ref;
          }
        } else {
          return el.ref;
        }
      }
    });
    return newChildren;
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
      } else {
        node.children = mergeClosestSafeNodes(node.children);
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
    this.syntax.traverse(ast, transformVisitor(hbsSyntax));

    return ast;
  }
}

module.exports = TemplateHTMLEvalTransform;
module.exports.transformFunction = transformVisitor;
