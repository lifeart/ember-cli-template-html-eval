ember-cli-template-html-eval
==============================================================================

Why do we need opcodes for static html elements?

```hbs
<div><a> hello <a></div>
```
will be compiled to 

```hbs
{{{'<div><a> hello <a></div>'}}}
```

and now we save 4 `glimmer-vm` opcodes!

----

Compatibility
------------------------------------------------------------------------------

* Ember.js v2.18 or above
* Ember CLI v2.13 or above
* Node.js v8 or above


Installation
------------------------------------------------------------------------------

```
ember install ember-cli-template-html-eval
```


Usage
------------------------------------------------------------------------------

[Longer description of how to use the addon in apps.]


Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
