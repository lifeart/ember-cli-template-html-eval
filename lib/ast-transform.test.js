"use strict";
/* eslint-env jest */
/* eslint-env node */

const { preprocess, print }= require("@glimmer/syntax");
const { precompile } = require("@glimmer/compiler");
const { transformFunction } = require("./ast-transform");

it('should skip newlines', ()=>{
    const input = `
        <a>
        </a>
    `;
    assert(transformInput(input).length, 1);
});

it('should keep newlines for code', ()=>{
    const input = `
        <a>
        <code>
        </code>
        </a>
    `;
    assert(transformInput(input).length, 1);
});

it('should keep newlines for pre', ()=>{
    const input = `
        <a>
        <pre>
        </pre>
        </a>
    `;
    assert(transformInput(input).length, 1);
});


it('should keep newlines with text', ()=>{
    const input = `
        <a>
        <b>a
        </b>
        </a>
    `;
    assert(transformInput(input).length, 1);
});

it('should keep single-spaced text', ()=>{
    const input = `
        <a>
        </a> <n></n>
    `;
    assert(transformInput(input).length, 1);
});

it('should skip dead blocks', ()=>{
    const input = `
        {{#if false}}
        <a>
        </a> <n></n>
        {{else}}
        <a><div></div></a>
        {{/if}}
    `;
    
    assert(transformInput(input).length, 3);
});


it('should handle separate items', ()=>{
    const input = `
        <a>{{name}}</a>
        <div><span><a><pre></pre></a></span></div>
    `;
    assert(transformInput(input).length, 6);
});


it('reduce codes count for long formatted lines', ()=>{
    const input = `
       <div>
        <div>
         <div>
          <div></div>
         </div>
        </div>
       </div>
    `;
    assert(transformInput(input).length, 1);
});

it('transform nested childs', ()=>{
    const input = `<div><a><b>sds</b></a><b>sd</b> {{name}}</div>`

    assert(printTransformedInput(input), "<div>{{{\"<a><b>sds</b></a><b>sd</b>  \"}}}{{name}}</div>");
});

it('can handle complex templtes', ()=>{
    const input = `<div class="qb-query-constructor"><h2 class="qb-query-constructor__header-text">Query</h2>{{#if this.conditions.length}} <button class="category__clear-btn" onclick={{bind this.qb.clearQuery}}><i class="trash icon"></i> </button>{{/if}}</div>`;

  assert(printTransformedInput(input), "<div class=\"qb-query-constructor\">{{{\"<h2 class=\"qb-query-constructor__header-text\">Query</h2>\"}}}{{#if this.conditions.length}} <button class=\"category__clear-btn\" onclick={{bind this.qb.clearQuery}}>{{{\"<i class=\"trash icon\"></i>  \"}}}</button>{{/if}}</div>");

})

function printTransformedInput(template) {
    function createPlugin() {
        return {
            visitor: transformFunction({print}),
            name: "templates-html-eval-transform"
        }
    }
    const ast = preprocess(template, {
        plugins: {
          ast: [ createPlugin ]
        }
    });
    return print(ast);
}

function transformInput(template) {
    function createPlugin() {
        return {
            visitor: transformFunction({print}),
            name: "templates-html-eval-transform"
        }
    }
    const ast = preprocess(template, {
        plugins: {
          ast: [ createPlugin ]
        }
    });
    return JSON.parse(JSON.parse(precompile(print(ast))).block).statements;
}

function assert(left, right) {
    expect(left).toEqual(right);
}
  