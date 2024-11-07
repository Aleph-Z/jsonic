(window.webpackJsonp=window.webpackJsonp||[]).push([[20],{201:function(t,a,s){"use strict";s.r(a);var e=s(6),n=Object(e.a)({},(function(){var t=this,a=t._self._c;return a("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[a("h1",{attrs:{id:"plugins"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#plugins"}},[t._v("#")]),t._v(" Plugins")]),t._v(" "),a("p",[t._v("There is a standard "),a("name-self"),t._v(" "),a("a",{attrs:{href:"/ref/syntax"}},[t._v("syntax")]),t._v(", which you\nshould probably just use if all you want is easy-going JSON.")],1),t._v(" "),a("p",[t._v("But "),a("name-self"),t._v(" itself is meant to be an extensible parser for\nJSON-like languages, so you feel the need for a little more power,\nyou've come to the right place!")],1),t._v(" "),a("p",[t._v("A small set of plugins are built into the standard package. You load\nthem separately (this keeps the core small for web app use cases).")]),t._v(" "),a("p",[t._v("There is a wider set of standard plugins under the "),a("a",{attrs:{href:"https://www.npmjs.com/org/jsonic",target:"_blank",rel:"noopener noreferrer"}},[t._v("@jsonic\norganisation"),a("OutboundLink")],1),t._v(".")]),t._v(" "),a("p",[t._v("These plugins also serve as examples of how to write your own\nextensions to JSON. Instead of starting from\nscratch, "),a("a",{attrs:{href:"/guide/improve-plugin-tutorial"}},[t._v("copy and improve")]),t._v("!")]),t._v(" "),a("p",[a("a",{attrs:{name:"builtin-plugins"}})]),t._v(" "),a("h2",{attrs:{id:"built-in-plugins"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#built-in-plugins"}},[t._v("#")]),t._v(" Built-in plugins")]),t._v(" "),a("ul",[a("li",[a("a",{attrs:{href:"#native"}},[t._v("native")]),t._v(": Parse native JavaScript values such as "),a("code",[t._v("undefined")]),t._v(", "),a("code",[t._v("NaN")]),t._v(", etc.")]),t._v(" "),a("li",[a("a",{attrs:{href:"#csv"}},[t._v("csv")]),t._v(": Parse CSV data that can contain embedded JSON.")]),t._v(" "),a("li",[a("a",{attrs:{href:"#hoover"}},[t._v("hoover")]),t._v(": TODO.")]),t._v(" "),a("li",[a("a",{attrs:{href:"#json"}},[t._v("json")]),t._v(": TODO.")]),t._v(" "),a("li",[a("a",{attrs:{href:"#dynamic"}},[t._v("dynamic")]),t._v(": TODO.")]),t._v(" "),a("li",[a("a",{attrs:{href:"#multifile"}},[t._v("multifile")]),t._v(": TODO.")]),t._v(" "),a("li",[a("a",{attrs:{href:"#legacy-stringify"}},[t._v("legacy-stringify")]),t._v(": TODO.")])]),t._v(" "),a("h3",{attrs:{id:"native"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#native"}},[t._v("#")]),t._v(" "),a("code",[t._v("native")])]),t._v(" "),a("p",[a("a",{attrs:{href:"/plugin/native"}},[t._v("details")]),t._v(" →")]),t._v(" "),a("p",[t._v("Parse native JavaScript values such as "),a("code",[t._v("undefined")]),t._v(", "),a("code",[t._v("NaN")]),t._v(", "),a("code",[t._v("Infinity")]),t._v(",\nliteral regular expressions, and ISO-formatted dates.")]),t._v(" "),a("div",{staticClass:"language-js extra-class"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("let")]),t._v(" Native "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("require")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("'jsonic/plugin/native'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// or import")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("let")]),t._v(" extra "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" Jsonic"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("make")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("use")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("Native"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("extra")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("'a:NaN'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v('// === {"a": NaN}')]),t._v("\n")])])]),a("h3",{attrs:{id:"csv"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#csv"}},[t._v("#")]),t._v(" "),a("code",[t._v("csv")])]),t._v(" "),a("p",[a("a",{attrs:{href:"/plugin/csv"}},[t._v("details")]),t._v(" →")]),t._v(" "),a("p",[t._v("Parse CSV data that can contain embedded JSON, and also supports\ncomments and other "),a("name-self"),t._v(" sugar.")],1),t._v(" "),a("div",{staticClass:"language-js extra-class"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("let")]),t._v(" Csv "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("require")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("'jsonic/plugin/csv'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// or import")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("let")]),t._v(" extra "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" Jsonic"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("make")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("use")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("Csv"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v('// === [{"a":1, "b":2}, {"a":3,"b":4}]')]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("extra")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token template-string"}},[a("span",{pre:!0,attrs:{class:"token template-punctuation string"}},[t._v("`")]),a("span",{pre:!0,attrs:{class:"token string"}},[t._v("\na,b      // first line is headers\n1,2\n3,4\n")]),a("span",{pre:!0,attrs:{class:"token template-punctuation string"}},[t._v("`")])]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" \n")])])]),a("p",[a("a",{attrs:{name:"standard-plugins"}})]),t._v(" "),a("h3",{attrs:{id:"hoover"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#hoover"}},[t._v("#")]),t._v(" "),a("code",[t._v("hoover")])]),t._v(" "),a("h3",{attrs:{id:"json"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#json"}},[t._v("#")]),t._v(" "),a("code",[t._v("json")])]),t._v(" "),a("h3",{attrs:{id:"dynamic"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#dynamic"}},[t._v("#")]),t._v(" "),a("code",[t._v("dynamic")])]),t._v(" "),a("h3",{attrs:{id:"multifile"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#multifile"}},[t._v("#")]),t._v(" "),a("code",[t._v("multifile")])]),t._v(" "),a("h3",{attrs:{id:"legacy-stringify"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#legacy-stringify"}},[t._v("#")]),t._v(" "),a("code",[t._v("legacy-stringify")])]),t._v(" "),a("h2",{attrs:{id:"standard-plugins"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#standard-plugins"}},[t._v("#")]),t._v(" Standard plugins")]),t._v(" "),a("p",[a("a",{attrs:{name:"community-plugins"}})]),t._v(" "),a("h2",{attrs:{id:"community-plugins"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#community-plugins"}},[t._v("#")]),t._v(" Community plugins")])])}),[],!1,null,null,null);a.default=n.exports}}]);