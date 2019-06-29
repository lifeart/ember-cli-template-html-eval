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
    return {
      type: "MustacheStatement",
      params: [],
      path: {
        type: "StringLiteral",
        value: value,
        original: value,
        loc: null
      },
      hash: { type: "Hash", pairs: [], loc: null },
      escaped: false,
      loc: null
    };
  }

  const visitor = {
    BlockStatement(node) {
      let hasUnsafeChild = false;
      if (node.program.blockParams.length) {
        return;
      }
      node.program.body.forEach(el => {
        if (!isSaveChain(el)) {
          hasUnsafeChild = true;
        }
      });
      if (hasUnsafeChild) {
        return;
      }
      var value = syntax.print(node.program);
      node.program.body = [
        createUnsafeStatement(value)
      ];
      if (node.inverse) {
        if (node.inverse.blockParams.length) {
          return;
        }
        node.inverse.body.forEach(el => {
          if (!isSaveChain(el)) {
            hasUnsafeChild = true;
          }
        });
        if (hasUnsafeChild) {
          return;
        }
        value = syntax.print(node.inverse);
        node.inverse.body = [
          createUnsafeStatement(value)
        ];
      }
    },
    Template(node) {
      if (node.blockParams.length) {
        return;
      }
      let hasUnsafeChild = false;
      node.body.forEach(el => {
        if (!isSaveChain(el)) {
          hasUnsafeChild = true;
        }
      });
      if (hasUnsafeChild) {
        return;
      }
      var value = syntax.print(node);
      node.body = [
        createUnsafeStatement(value)
      ];
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
