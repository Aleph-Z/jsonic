/* Copyright (c) 2013-2020 Richard Rodger and other contributors, MIT License */
'use strict'

// let Lab = require('@hapi/lab')
// Lab = null != Lab.script ? Lab : require('hapi-lab-shim')

// const Code = require('@hapi/code')

// const lab = (exports.lab = Lab.script())
// const describe = lab.describe
// const it = lab.it
// const expect = Code.expect

const Util = require('util')
const I = Util.inspect

const { Jsonic, JsonicError, RuleSpec } = require('..')

const j = Jsonic


describe('feature', function () {
  it('test-util-match', () => {
    expect(match(1,1)).toBeUndefined()
    expect(match([],[1])).toEqual('$[0]/val:undefined!=1')
    expect(match([],[])).toBeUndefined()
    expect(match([1],[1])).toBeUndefined()
    expect(match([[]],[[]])).toBeUndefined()
    expect(match([1],[2])).toEqual('$[0]/val:1!=2')
    expect(match([[1]],[[2]])).toEqual('$[0][0]/val:1!=2')
    expect(match({},{})).toBeUndefined()
    expect(match({a:1},{a:1})).toBeUndefined()
    expect(match({a:1},{a:2})).toEqual('$.a/val:1!=2')
    expect(match({a:{b:1}},{a:{b:1}})).toBeUndefined()
    expect(match({a:1},{a:1,b:2})).toEqual('$.b/val:undefined!=2')
    expect(match({a:1},{b:1})).toEqual('$.b/val:undefined!=1')
    expect(match({a:{b:1}},{a:{b:2}})).toEqual('$.a.b/val:1!=2')    
    expect(match({a:1,b:2},{a:1})).toBeUndefined()
    expect(match({a:1,b:2},{a:1},{miss:false})).toEqual('$/key:{a,b}!={a}')
    expect(match([1],[])).toBeUndefined()
    expect(match([],[1])).toEqual('$[0]/val:undefined!=1')
    expect(match([2,1],[undefined,1],{miss:false})).toEqual('$[0]/val:2!=undefined')
    expect(match([2,1],[undefined,1])).toBeUndefined()
  })

  
  it('implicit-comma', () => {
    expect(j('[0,1]')).toEqual([0,1])
    expect(j('[0,null]')).toEqual([0,null])
    expect(j('{a:0,b:null}')).toEqual({a:0,b:null})
    expect(j('{a:1,b:2}')).toEqual({a:1,b:2})
    expect(j('[1,2]')).toEqual([1,2])
    expect(j('{a:1,\nb:2}')).toEqual({a:1,b:2})
    expect(j('[1,\n2]')).toEqual([1,2])
    expect(j('a:1,b:2')).toEqual({a:1,b:2})
    expect(j('1,2')).toEqual([1,2])
    expect(j('1,2,3')).toEqual([1,2,3])
    expect(j('a:1,\nb:2')).toEqual({a:1,b:2})
    expect(j('1,\n2')).toEqual([1,2])
    expect(j('{a:1\nb:2}')).toEqual({a:1,b:2})
    expect(j('[1\n2]')).toEqual([1,2])
    expect(j('a:1\nb:2')).toEqual({a:1,b:2})
    expect(j('1\n2')).toEqual([1,2])
    expect(j('a\nb')).toEqual(['a','b'])
    expect(j('1\n2\n3')).toEqual([1,2,3])
    expect(j('a\nb\nc')).toEqual(['a','b','c'])
    expect(j('true\nfalse\nnull')).toEqual([true,false,null])
  })


  it('single-char', () => {
    expect(j()).toEqual(undefined)
    expect(j('')).toEqual(undefined)
    expect(j('À')).toEqual('À') // #192 verbatim text
    expect(j(' ')).toEqual(' ') // #160 non-breaking space, verbatim text
    expect(j('{')).toEqual({}) // auto-close
    expect(j('a')).toEqual('a')  // verbatim text
    expect(j('[')).toEqual([]) // auto-close
    expect(j(',')).toEqual([null]) // implict list, prefixing-comma means null element
    expect(j('#')).toEqual(undefined) // comment
    expect(j(' ')).toEqual(undefined) // ignored space
    expect(j('\u0010')).toEqual('\x10') // verbatim text
    expect(j('\b')).toEqual('\b') // verbatim
    expect(j('\t')).toEqual(undefined) // ignored space
    expect(j('\n')).toEqual(undefined) // ignored newline
    expect(j('\f')).toEqual('\f') // verbatim
    expect(j('\r')).toEqual(undefined) // ignored newline

    expect(()=>j('"')).toThrow(/unterminated/)
    expect(()=>j('\'')).toThrow(/unterminated/)
    expect(()=>j(':')).toThrow(/unexpected/)
    expect(()=>j(']')).toThrow(/unexpected/)
    expect(()=>j('`')).toThrow(/unterminated/)
    expect(()=>j('}')).toThrow(/unexpected/)
  })

  
  it('single-comment-line', () => {
    expect(j('a#b')).toEqual('a')
    expect(j('a:1#b')).toEqual({a:1})
    expect(j('#a:1')).toEqual(undefined)
    expect(j('#a:1\nb:2')).toEqual({b:2})
    expect(j('b:2\n#a:1')).toEqual({b:2})
    expect(j('b:2,\n#a:1\nc:3')).toEqual({b:2,c:3})
  })


  it('string-comment-line', () => {
    expect(j('//a:1')).toEqual(undefined)
    expect(j('//a:1\nb:2')).toEqual({b:2})
    expect(j('b:2\n//a:1')).toEqual({b:2})
    expect(j('b:2,\n//a:1\nc:3')).toEqual({b:2,c:3})
  })


  it('multi-comment', () => {
    expect(j('/*a:1*/')).toEqual(undefined)
    expect(j('/*a:1*/\nb:2')).toEqual({b:2})
    expect(j('/*a:1\n*/b:2')).toEqual({b:2})
    expect(j('b:2\n/*a:1*/')).toEqual({b:2})
    expect(j('b:2,\n/*\na:1,\n*/\nc:3')).toEqual({b:2,c:3})

    expect(()=>j('/*')).toThrow(/unterminated_comment].*:1:1/s)
    expect(()=>j('\n/*')).toThrow(/unterminated_comment].*:2:1/s)
    expect(()=>j('a/*')).toThrow(/unterminated_comment].*:1:2/s)
    expect(()=>j('\na/*')).toThrow(/unterminated_comment].*:2:2/s)

    expect(()=>j('a:1/*\n\n*/{')).toThrow(/unexpected].*:3:3/s)


    
    // Balanced multiline comments!
    // TODO: PLUGIN
    // expect(j('/*/*/*a:1*/*/*/b:2')).toEqual({b:2})
    // expect(j('b:2,/*a:1,/*c:3,*/*/d:4')).toEqual({b:2,d:4})
    // expect(j('\nb:2\n/*\na:1\n/*\nc:3\n*/\n*/\n,d:4')).toEqual({b:2,d:4})

    // Implicit close
    // TODO: OPTION
    // expect(j('b:2\n/*a:1')).toEqual({b:2})
    // expect(j('b:2\n/*/*/*a:1')).toEqual({b:2})
  })


  // TODO: PLUGIN
  // it('balanced-multi-comment', () => {
  //   // Active by default
  //   expect(j('/*/*/*a:1*/*/*/b:2')).toEqual({b:2})
  //   expect(j('/*/*/*a:1*/*/b:2')).toEqual(undefined)
  //   expect(j('/*/*/*a/b*/*/*/b:2')).toEqual({b:2})

    
  //   let nobal = Jsonic.make({comment:{balance:false}})
  //   expect(nobal.options.comment.balance).false()

  //   // NOTE: comment markers inside text are active!
  //   expect(nobal('/*/*/*a:1*/*/*/,b:2')).toEqual({ '*a': '1*', b: 2 })


  //   // Custom multiline comments
  //   let coffee = Jsonic.make({comment:{marker:{'###':'###'}}})
  //   expect(coffee('\n###a:1\nb:2\n###\nc:3')).toEqual({c:3})

  //   // NOTE: no balancing if open === close
  //   expect(coffee('\n###a:1\n###b:2\n###\nc:3\n###\nd:4')).toEqual({b:2,d:4})
  // })


  it('number', () => {
    expect(j('1')).toEqual(1)
    expect(j('-1')).toEqual(-1)
    expect(j('+1')).toEqual(1)
    expect(j('0')).toEqual(0)
    expect(j('0.9')).toEqual(0.9)
    expect(j('-0.9')).toEqual(-0.9)
    expect(j('[1]')).toEqual([1])
    expect(j('a:1')).toEqual({a:1})
    expect(j('1:a')).toEqual({'1':'a'})
    expect(j('{a:1}')).toEqual({a:1})
    expect(j('{1:a}')).toEqual({'1':'a'})
    expect(j('1.2')).toEqual(1.2)
    expect(j('1e2')).toEqual(100)
    expect(j('10_0')).toEqual(100)
    expect(j('-1.2')).toEqual(-1.2)
    expect(j('-1e2')).toEqual(-100)
    expect(j('-10_0')).toEqual(-100)
    expect(j('1e+2')).toEqual(100)
    expect(j('1e-2')).toEqual(0.01)
    expect(j('0xA')).toEqual(10)
    expect(j('0xa')).toEqual(10)
    expect(j('0o12')).toEqual(10)
    expect(j('0b1010')).toEqual(10)
    expect(j('0x_A')).toEqual(10)
    expect(j('0x_a')).toEqual(10)
    expect(j('0o_12')).toEqual(10)
    expect(j('0b_1010')).toEqual(10)
    expect(j('1e6:a')).toEqual({'1e6':'a'}) // NOTE: "1e6" not "1000000"
    expect(j('01')).toEqual(1)
    expect(j('-01')).toEqual(-1)
    expect(j('0099')).toEqual(99)
    expect(j('-0099')).toEqual(-99)

    expect(j('a:1')).toEqual({a:1})
    expect(j('a:-1')).toEqual({a:-1})
    expect(j('a:+1')).toEqual({a:1})
    expect(j('a:0')).toEqual({a:0})
    expect(j('a:0.1')).toEqual({a:0.1})
    expect(j('a:[1]')).toEqual({a:[1]})
    expect(j('a:a:1')).toEqual({a:{a:1}})
    expect(j('a:1:a')).toEqual({a:{'1':'a'}})
    expect(j('a:{a:1}')).toEqual({a:{a:1}})
    expect(j('a:{1:a}')).toEqual({a:{'1':'a'}})
    expect(j('a:1.2')).toEqual({a:1.2})
    expect(j('a:1e2')).toEqual({a:100})
    expect(j('a:10_0')).toEqual({a:100})
    expect(j('a:-1.2')).toEqual({a:-1.2})
    expect(j('a:-1e2')).toEqual({a:-100})
    expect(j('a:-10_0')).toEqual({a:-100})
    expect(j('a:1e+2')).toEqual({a:100})
    expect(j('a:1e-2')).toEqual({a:0.01})
    expect(j('a:0xA')).toEqual({a:10})
    expect(j('a:0xa')).toEqual({a:10})
    expect(j('a:0o12')).toEqual({a:10})
    expect(j('a:0b1010')).toEqual({a:10})
    expect(j('a:0x_A')).toEqual({a:10})
    expect(j('a:0x_a')).toEqual({a:10})
    expect(j('a:0o_12')).toEqual({a:10})
    expect(j('a:0b_1010')).toEqual({a:10})
    expect(j('a:1e6:a')).toEqual({a:{'1e6':'a'}}) // NOTE: "1e6" not "1000000"
    expect(j('[1,0]')).toEqual([1,0])
    expect(j('[1,0.5]')).toEqual([1,0.5])

    // text as +- not value enders
    expect(j('1+')).toEqual('1+')
    expect(j('1-')).toEqual('1-')
    expect(j('1-+')).toEqual('1-+')

    // partial numbers are converted to text
    expect(j('-')).toEqual('-')
    expect(j('.0')).toEqual('.0')
    
    
    
    let jn = j.make({ number: { lex: false } })
    expect(jn('1')).toEqual('1') // Now it's a string.
    expect(j('1')).toEqual(1)
    expect(jn('a:1')).toEqual({a:'1'})
    expect(j('a:1')).toEqual({a:1})
    
    let jh = j.make({ number: { hex: false } })
    expect(jh('1')).toEqual(1)
    expect(jh('0x10')).toEqual('0x10')
    expect(jh('0o20')).toEqual(16)
    expect(jh('0b10000')).toEqual(16)
    expect(j('1')).toEqual(1)
    expect(j('0x10')).toEqual(16)
    expect(j('0o20')).toEqual(16)
    expect(j('0b10000')).toEqual(16)

    let jo = j.make({ number: { oct: false } })
    expect(jo('1')).toEqual(1)
    expect(jo('0x10')).toEqual(16)
    expect(jo('0o20')).toEqual('0o20')
    expect(jo('0b10000')).toEqual(16)
    expect(j('1')).toEqual(1)
    expect(j('0x10')).toEqual(16)
    expect(j('0o20')).toEqual(16)
    expect(j('0b10000')).toEqual(16)

    let jb = j.make({ number: { bin: false } })
    expect(jb('1')).toEqual(1)
    expect(jb('0x10')).toEqual(16)
    expect(jb('0o20')).toEqual(16)
    expect(jb('0b10000')).toEqual('0b10000')
    expect(j('1')).toEqual(1)
    expect(j('0x10')).toEqual(16)
    expect(j('0o20')).toEqual(16)
    expect(j('0b10000')).toEqual(16)

    let js0 = j.make({ number: { sep: null } })
    expect(js0('1_0')).toEqual('1_0')
    expect(j('1_0')).toEqual(10)

    let js1 = j.make({ number: { sep: ' ' } })
    expect(js1('1 0')).toEqual(10)
    expect(js1('a:1 0')).toEqual({a:10})
    expect(js1('a:1 0, b : 2 000 ')).toEqual({a:10,b:2000})
    expect(j('1_0')).toEqual(10)


    
  })

  
  it('value', () => {
    expect(j('')).toEqual(undefined)

    expect(j('true')).toEqual(true)
    expect(j('false')).toEqual(false)
    expect(j('null')).toEqual(null)

    expect(j('true\n')).toEqual(true)
    expect(j('false\n')).toEqual(false)
    expect(j('null\n')).toEqual(null)
    
    expect(j('true#')).toEqual(true)
    expect(j('false#')).toEqual(false)
    expect(j('null#')).toEqual(null)

    expect(j('true//')).toEqual(true)
    expect(j('false//')).toEqual(false)
    expect(j('null//')).toEqual(null)

    expect(j('{a:true}')).toEqual({a:true})
    expect(j('{a:false}')).toEqual({a:false})
    expect(j('{a:null}')).toEqual({a:null})

    expect(j('{true:1}')).toEqual({'true':1})
    expect(j('{false:1}')).toEqual({'false':1})
    expect(j('{null:1}')).toEqual({'null':1})

    
    expect(j('a:true')).toEqual({a:true})
    expect(j('a:false')).toEqual({a:false})
    expect(j('a:null')).toEqual({a:null})
    expect(j('a:')).toEqual({a:null})

    expect(j('true,')).toEqual([true])
    expect(j('false,')).toEqual([false])
    expect(j('null,')).toEqual([null])

    expect(j(
      'a:true,b:false,c:null,d:{e:true,f:false,g:null},h:[true,false,null]'))
      .toEqual({a:true,b:false,c:null,d:{e:true,f:false,g:null},h:[true,false,null]})
  })


  it('null-or-undefined', () => {
    // All ignored, so undefined
    expect(j('')).toEqual(undefined)
    expect(j(' ')).toEqual(undefined)
    expect(j('\n')).toEqual(undefined)
    expect(j('#')).toEqual(undefined)
    expect(j('//')).toEqual(undefined)
    expect(j('/**/')).toEqual(undefined)

    // JSON only has nulls
    expect(j('null')).toEqual(null)
    expect(j('a:null')).toEqual({a:null})


    expect(j('[a:1]')).toEqual([{a:1}])
    
    expect(j('[{a:null}]')).toEqual([{a:null}])
    expect(j('[a:null]')).toEqual([{a:null}])
    expect(j('a:null,b:null')).toEqual({a:null,b:null})
    expect(j('{a:null,b:null}')).toEqual({a:null,b:null})

    expect(j('[a:]')).toEqual([{a:null}])
    expect(j('[a:,]')).toEqual([{a:null}])
    expect(j('[a:,b:]')).toEqual([{a:null},{b:null}])
    expect(j('[a:,b:c:]')).toEqual([{a:null},{b:{c:null}}])

    expect(j('a:')).toEqual({a:null})
    expect(j('a:,b:')).toEqual({a:null,b:null})
    expect(j('a:,b:c:')).toEqual({a:null,b:{c:null}})

    expect(j('{a:}')).toEqual({a:null})
    expect(j('{a:,b:}')).toEqual({a:null,b:null})
    expect(j('{a:,b:c:}')).toEqual({a:null,b:{c:null}})
  })

  
  it('value-text', () => {

    expect(j('a')).toEqual('a')
    expect(j('1a')).toEqual('1a') // NOTE: not a number!
    expect(j('a/b')).toEqual('a/b')
    expect(j('a#b')).toEqual('a')

    expect(j('a//b')).toEqual('a')
    expect(j('a/*b*/')).toEqual('a')
    expect(j('a\\n')).toEqual('a\\n')
    expect(j('\\s+')).toEqual('\\s+')

    expect(j('x:a')).toEqual({x:'a'})
    expect(j('x:a/b')).toEqual({x:'a/b'})
    expect(j('x:a#b')).toEqual({x:'a'})
    expect(j('x:a//b')).toEqual({x:'a'})
    expect(j('x:a/*b*/')).toEqual({x:'a'})
    expect(j('x:a\\n')).toEqual({x:'a\\n'})
    expect(j('x:\\s+')).toEqual({x:'\\s+'})

    expect(j('[a]')).toEqual(['a'])
    expect(j('[a/b]')).toEqual(['a/b'])
    expect(j('[a#b]')).toEqual(['a'])
    expect(j('[a//b]')).toEqual(['a'])
    expect(j('[a/*b*/]')).toEqual(['a'])
    expect(j('[a\\n]')).toEqual(['a\\n'])
    expect(j('[\\s+]')).toEqual(['\\s+'])

    // TODO: REVIEW
    // // Force text re to fail (also tests infinite loop protection).
    // let j0 = j.make()
    // j0.internal().config.re.te =
    //   new RegExp(j0.internal().config.re.te.source.replace('#','#a'))
    // expect(()=>j0('a')).toThrow(/unexpected/)
  })

  
  it('value-string', () => {
    expect(j('\'\'')).toEqual('')
    expect(j('""')).toEqual('')
    expect(j('``')).toEqual('')

    expect(j('\'a\'')).toEqual('a')
    expect(j('"a"')).toEqual('a')
    expect(j('`a`')).toEqual('a')

    expect(j('\'a b\'')).toEqual('a b')
    expect(j('"a b"')).toEqual('a b')
    expect(j('`a b`')).toEqual('a b')

    expect(j('\'a\\tb\'')).toEqual('a\tb')
    expect(j('"a\\tb"')).toEqual('a\tb')
    expect(j('`a\\tb`')).toEqual('a\tb')

    // NOTE: backslash inside string is always removed
    expect(j('`a\\qb`')).toEqual('aqb')

    expect(j('\'a\\\'b"`c\'')).toEqual('a\'b"`c')
    expect(j('"a\\"b`\'c"')).toEqual('a"b`\'c')
    expect(j('`a\\`b"\'c`')).toEqual('a`b"\'c')

    expect(j('"\\u0061"')).toEqual('a')
    expect(j('"\\x61"')).toEqual('a')

    expect(j('`\n`')).toEqual('\n')
    expect(()=>j('"\n"')).toThrow(/unprintable]/)
    expect(()=>j('"\t"')).toThrow(/unprintable]/)
    expect(()=>j('"\f"')).toThrow(/unprintable]/)
    expect(()=>j('"\b"')).toThrow(/unprintable]/)
    expect(()=>j('"\v"')).toThrow(/unprintable]/)
    expect(()=>j('"\0"')).toThrow(/unprintable]/)

    expect(j('"\\n"')).toEqual('\n')
    expect(j('"\\t"')).toEqual('\t')
    expect(j('"\\f"')).toEqual('\f')
    expect(j('"\\b"')).toEqual('\b')
    expect(j('"\\v"')).toEqual('\v')
    expect(j('"\\""')).toEqual('"')
    expect(j('"\\\'"')).toEqual('\'')
    expect(j('"\\`"')).toEqual('`')

    expect(j('"\\w"')).toEqual('w')
    expect(j('"\\0"')).toEqual('0')
    
    expect(()=>j('`\x1a`')).toThrow(/unprintable]/)
    expect(()=>j('"\x1a"')).toThrow(/unprintable]/)
    
    expect(()=>j('"x')).toThrow(/unterminated_string].*:1:1/s)
    expect(()=>j(' "x')).toThrow(/unterminated_string].*:1:2/s)
    expect(()=>j('  "x')).toThrow(/unterminated_string].*:1:3/s)
    expect(()=>j('a:"x')).toThrow(/unterminated_string].*:1:3/s)
    expect(()=>j('aa:"x')).toThrow(/unterminated_string].*:1:4/s)
    expect(()=>j('aaa:"x')).toThrow(/unterminated_string].*:1:5/s)
    expect(()=>j(' a:"x')).toThrow(/unterminated_string].*:1:4/s)
    expect(()=>j(' a :"x')).toThrow(/unterminated_string].*:1:5/s)

    expect(()=>j('\'x')).toThrow(/unterminated_string].*:1:1/s)
    expect(()=>j(' \'x')).toThrow(/unterminated_string].*:1:2/s)
    expect(()=>j('  \'x')).toThrow(/unterminated_string].*:1:3/s)
    expect(()=>j('a:\'x')).toThrow(/unterminated_string].*:1:3/s)
    expect(()=>j('aa:\'x')).toThrow(/unterminated_string].*:1:4/s)
    expect(()=>j('aaa:\'x')).toThrow(/unterminated_string].*:1:5/s)
    expect(()=>j(' a:\'x')).toThrow(/unterminated_string].*:1:4/s)
    expect(()=>j(' a :\'x')).toThrow(/unterminated_string].*:1:5/s)

    expect(()=>j('`x')).toThrow(/unterminated_string].*:1:1/s)
    expect(()=>j(' `x')).toThrow(/unterminated_string].*:1:2/s)
    expect(()=>j('  `x')).toThrow(/unterminated_string].*:1:3/s)
    expect(()=>j('a:`x')).toThrow(/unterminated_string].*:1:3/s)
    expect(()=>j('aa:`x')).toThrow(/unterminated_string].*:1:4/s)
    expect(()=>j('aaa:`x')).toThrow(/unterminated_string].*:1:5/s)
    expect(()=>j(' a:`x')).toThrow(/unterminated_string].*:1:4/s)
    expect(()=>j(' a :`x')).toThrow(/unterminated_string].*:1:5/s)

    expect(()=>j('`\nx')).toThrow(/unterminated_string].*:1:1/s)
    expect(()=>j(' `\nx')).toThrow(/unterminated_string].*:1:2/s)
    expect(()=>j('  `\nx')).toThrow(/unterminated_string].*:1:3/s)
    expect(()=>j('a:`\nx')).toThrow(/unterminated_string].*:1:3/s)
    expect(()=>j('aa:`\nx')).toThrow(/unterminated_string].*:1:4/s)
    expect(()=>j('aaa:`\nx')).toThrow(/unterminated_string].*:1:5/s)
    expect(()=>j(' a:`\nx')).toThrow(/unterminated_string].*:1:4/s)
    expect(()=>j(' a :`\nx')).toThrow(/unterminated_string].*:1:5/s)

    expect(()=>j('\n\n"x')).toThrow(/unterminated_string].*:3:1/s)
    expect(()=>j('\n\n "x')).toThrow(/unterminated_string].*:3:2/s)
    expect(()=>j('\n\n  "x')).toThrow(/unterminated_string].*:3:3/s)
    expect(()=>j('\n\na:"x')).toThrow(/unterminated_string].*:3:3/s)
    expect(()=>j('\n\naa:"x')).toThrow(/unterminated_string].*:3:4/s)
    expect(()=>j('\n\naaa:"x')).toThrow(/unterminated_string].*:3:5/s)
    expect(()=>j('\n\n a:"x')).toThrow(/unterminated_string].*:3:4/s)
    expect(()=>j('\n\n a :"x')).toThrow(/unterminated_string].*:3:5/s)


    // string.escape.allowUnknown:false
    let j1 = j.make({string:{allowUnknown:false}})
    expect(j1('"\\n"')).toEqual('\n')
    expect(j1('"\\t"')).toEqual('\t')
    expect(j1('"\\f"')).toEqual('\f')
    expect(j1('"\\b"')).toEqual('\b')
    expect(j1('"\\v"')).toEqual('\v')
    expect(j1('"\\""')).toEqual('"')
    expect(j1('"\\\\"')).toEqual('\\')
    expect(()=>j1('"\\w"')).toThrow(/unexpected].*:1:3/s)
    expect(()=>j1('"\\0"')).toThrow(/unexpected].*:1:3/s)
    
    
    
    // TODO: PLUGIN csv
    // let k = j.make({string:{escapedouble:true}})
    // expect(k('"a""b"')).toEqual('a"b')
    // expect(k('`a``b`')).toEqual('a`b')
    // expect(k('\'a\'\'b\'')).toEqual('a\'b')
  })
  

  it('multiline-string', () => {
    expect(j('`a`')).toEqual('a')
    expect(j('`\na`')).toEqual('\na')
    expect(j('`\na\n`')).toEqual('\na\n')
    expect(j('`a\nb`')).toEqual('a\nb')
    expect(j('`a\n\nb`')).toEqual('a\n\nb')
    expect(j('`a\nc\nb`')).toEqual('a\nc\nb')
    expect(j('`a\r\n\r\nb`')).toEqual('a\r\n\r\nb')

    expect(()=>j('`\n')).toThrow(/unterminated_string.*:1:1/s)
    expect(()=>j(' `\n')).toThrow(/unterminated_string.*:1:2/s)
    expect(()=>j('\n `\n')).toThrow(/unterminated_string.*:2:2/s)

    expect(()=>j('`a``b')).toThrow(/unterminated_string.*:1:4/s)
    expect(()=>j('\n`a``b')).toThrow(/unterminated_string.*:2:4/s)
    expect(()=>j('\n`a`\n`b')).toThrow(/unterminated_string.*:3:1/s)
    expect(()=>j('\n`\na`\n`b')).toThrow(/unterminated_string.*:4:1/s)
    expect(()=>j('\n`\na`\n`\nb')).toThrow(/unterminated_string.*:4:1/s)

    expect(()=>j('`a` `b')).toThrow(/unterminated_string.*:1:5/s)
    expect(()=>j('`a`\n `b')).toThrow(/unterminated_string.*:2:2/s)

    expect(()=>j('`a\n` `b')).toThrow(/unterminated_string.*:2:3/s)
    expect(()=>j('`a\n`,`b')).toThrow(/unterminated_string.*:2:3/s)
    expect(()=>j('[`a\n` `b')).toThrow(/unterminated_string.*:2:3/s)
    expect(()=>j('[`a\n`,`b')).toThrow(/unterminated_string.*:2:3/s)
    expect(()=>j('1\n `b')).toThrow(/unterminated_string.*:2:2/s)
    expect(()=>j('[1\n,`b')).toThrow(/unterminated_string.*:2:2/s)

    
    // TODO: PLUGIN
    // expect(j("'''a\nb'''")).toEqual('a\nb')
    // expect(j("'''\na\nb'''")).toEqual('a\nb')
    // expect(j("'''\na\nb\n'''")).toEqual('a\nb')
    // expect(j("\n'''\na\nb\n'''\n")).toEqual('a\nb')
    // expect(j(" '''\na\nb\n''' ")).toEqual('a\nb')

    // expect(j("''' a\nb\n'''")).toEqual(' a\nb')
    // expect(j(" '''a\n b\n'''")).toEqual('a\nb')
    // expect(j(" ''' \na\n b\n'''")).toEqual('a\nb')
    // expect(j(" ''' \na\n  b\n'''")).toEqual('a\n b')
    // expect(j(" ''' \na\nb\n'''")).toEqual('a\nb')
    // expect(j(" ''' a\n b\n'''")).toEqual('a\nb')
    // expect(j(" ''' a\nb\n'''")).toEqual('a\nb')
    
    //     expect(j(`{
    //   md:
    //     '''
    //     First line.
    //     Second line.
    //       This line is indented by two spaces.
    //     '''
    // }`)).toEqual({
    //   md: "First line.\nSecond line.\n  This line is indented by two spaces.",
    // })

    // expect(j("'''\na\nb\n'''")).toEqual('a\nb')
    // expect(j("'''a\nb'''")).toEqual('a\nb')

  })

  it('optional-comma', () => {
    expect(j('[1,]')).toEqual([1])
    expect(j('[,1]')).toEqual([null,1])
    expect(j('[1,,]')).toEqual([1,null])
    expect(j('[1,,,]')).toEqual([1,null,null])
    expect(j('[1,,,,]')).toEqual([1,null,null,null])
    expect(j('[1,,,,,]')).toEqual([1,null,null,null,null])
    expect(j('[1\n2]')).toEqual([1,2])
    expect(j('{a:1},')).toEqual([{a:1}])

    // NOTE: these are not implicit lists!
    expect(j('a:1,')).toEqual({a:1}) 
    expect(j('a:b:1,')).toEqual({a:{b:1}})
    expect(j('a:1 b:2')).toEqual({a:1,b:2})
    expect(j('a:b:1 a:c:2')).toEqual({a:{b:1,c:2}}) 

    expect(j('{a:1\nb:2}')).toEqual({a:1,b:2})
    expect(j('{,a:1}')).toEqual({a:1})
    expect(j('{a:1,}')).toEqual({a:1})
    expect(j('{,a:1,}')).toEqual({a:1})
    expect(j('{a:1,b:2,}')).toEqual({a:1,b:2})

    expect(j('[{a:1},]')).toEqual([{a:1}])
    expect(j('[{a:1},{b:2}]')).toEqual([{a:1},{b:2}])
    
    expect(j('[[a],]')).toEqual([['a']])
    expect(j('[[a],[b],]')).toEqual([['a'],['b']])
    expect(j('[[a],[b],[c],]')).toEqual([['a'],['b'],['c']])
    expect(j('[[a]]')).toEqual([['a']])
    expect(j('[[a][b]]')).toEqual([['a'],['b']])
    expect(j('[[a][b][c]]')).toEqual([['a'],['b'],['c']])

    expect(j('[[0],]')).toEqual([[0]])
    expect(j('[[0],[1],]')).toEqual([[0],[1]])
    expect(j('[[0],[1],[2],]')).toEqual([[0],[1],[2]])
    expect(j('[[0]]')).toEqual([[0]])
    expect(j('[[0][1]]')).toEqual([[0],[1]])
    expect(j('[[0][1][2]]')).toEqual([[0],[1],[2]])
  })


  it('implicit-list', () => {
    
    // implicit null element preceeds empty comma
    expect(j(',')).toEqual([null])
    expect(j(',a')).toEqual([null,'a'])
    expect(j(',"a"')).toEqual([null,'a'])
    expect(j(',1')).toEqual([null,1])
    expect(j(',true')).toEqual([null,true])
    expect(j(',[]')).toEqual([null,[]])
    expect(j(',{}')).toEqual([null,{}])
    expect(j(',[1]')).toEqual([null,[1]])
    expect(j(',{a:1}')).toEqual([null,{a:1}])
    expect(j(',a:1')).toEqual([null,{a:1}])

    // Top level comma imlies list; ignore trailing comma
    expect(j('a,')).toEqual(['a'])
    expect(j('"a",')).toEqual(['a'])
    expect(j('1,')).toEqual([1])
    expect(j('1,,')).toEqual([1,null])
    expect(j('1,,,')).toEqual([1,null,null])
    expect(j('1,null')).toEqual([1,null])
    expect(j('1,null,')).toEqual([1,null])
    expect(j('1,null,null')).toEqual([1,null,null])
    expect(j('1,null,null,')).toEqual([1,null,null])
    expect(j('true,')).toEqual([true])
    expect(j('[],')).toEqual([[]])
    expect(j('{},')).toEqual([{}])
    expect(j('[1],')).toEqual([[1]])
    expect(j('{a:1},')).toEqual([{a:1}])

    // NOTE: special case, this is considered a map pair
    expect(j('a:1,')).toEqual({a:1})

    
    expect(j('a,')).toEqual(['a'])
    expect(j('"a",')).toEqual(['a'])
    expect(j('true,')).toEqual([true])
    expect(j('1,')).toEqual([1])
    expect(j('a,1')).toEqual(['a',1])
    expect(j('"a",1')).toEqual(['a',1])
    expect(j('true,1')).toEqual([true,1])
    expect(j('1,1')).toEqual([1,1])

    expect(j('a,b')).toEqual(['a','b'])
    expect(j('a,b,c')).toEqual(['a','b','c'])
    expect(j('a,b,c,d')).toEqual(['a','b','c','d'])

    expect(j('a b')).toEqual(['a','b'])
    expect(j('a b c')).toEqual(['a','b','c'])
    expect(j('a b c d')).toEqual(['a','b','c','d'])

    expect(j('[a],[b]')).toEqual([['a'],['b']])
    expect(j('[a],[b],[c]')).toEqual([['a'],['b'],['c']])
    expect(j('[a],[b],[c],[d]')).toEqual([['a'],['b'],['c'],['d']])

    expect(j('[a] [b]')).toEqual([['a'],['b']])
    expect(j('[a] [b] [c]')).toEqual([['a'],['b'],['c']])
    expect(j('[a] [b] [c] [d]')).toEqual([['a'],['b'],['c'],['d']])

    // TODO: note this in docs as it enables parsing of JSON logs/records
    expect(j('{a:1} {b:1}')).toEqual([{'a':1},{'b':1}])
    expect(j('{a:1} {b:1} {c:1}')).toEqual([{'a':1},{'b':1},{'c':1}])
    expect(j('{a:1} {b:1} {c:1} {d:1}')).toEqual([{'a':1},{'b':1},{'c':1},{'d':1}])
    expect(j('\n{a:1}\n{b:1}\r\n{c:1}\n{d:1}\r\n'))
      .toEqual([{'a':1},{'b':1},{'c':1},{'d':1}])

    expect(j('{a:1},')).toEqual([{a:1}])
    expect(j('[1],')).toEqual([[1]])

    expect(j('[a:1]')).toEqual([{a:1}])
    expect(j('[a:1,b:2]')).toEqual([{a:1},{b:2}])
    expect(j('[a:1,b:2,c:3]')).toEqual([{a:1},{b:2},{c:3}])
  })


  it('implicit-map', () => {
    expect(j('a:1')).toEqual({a:1})
    expect(j('a:1,b:2')).toEqual({a:1,b:2})

    expect(j('{a:b:1}')).toEqual({a:{b:1}})
    expect(j('{a:b:1,a:c:2}')).toEqual({a:{b:1,c:2}})
    expect(j('{a:b:1,a:c:2,a:d:3}')).toEqual({a:{b:1,c:2,d:3}})
    
    expect(j('a:b:1')).toEqual({a:{b:1}})
    expect(j('a:b:1,a:c:2')).toEqual({a:{b:1,c:2}})
    expect(j('a:b:1,a:c:2,a:d:3')).toEqual({a:{b:1,c:2,d:3}})

    expect(j('a:b:c:1')).toEqual({a:{b:{c:1}}})
    expect(j('a:b:1,d:2')).toEqual({a:{b:1},d:2})
    expect(j('a:b:c:1,d:2')).toEqual({a:{b:{c:1}},d:2})
    expect(j('{a:b:1}')).toEqual({a:{b:1}})
    expect(j('a:{b:c:1}')).toEqual({a:{b:{c:1}}})

    expect(j('{a:,b:')).toEqual({a:null,b:null})
    expect(j('a:,b:')).toEqual({a:null,b:null})
  })

  
  it('extension', () => {
    expect(j('a:{b:1,c:2},a:{c:3,e:4}'))
      .toEqual({ a: { b: 1, c: 3, e: 4 } })

    expect(j('a:{b:1,x:1},a:{b:2,y:2},a:{b:3,z:3}'))
      .toEqual({ a: { b: 3, x: 1, y: 2, z: 3} })

    expect(j('a:[{b:1,x:1}],a:[{b:2,y:2}],a:[{b:3,z:3}]'))
      .toEqual({ a: [{ b: 3, x: 1, y: 2, z: 3}] })

    expect(j('a:[{b:1},{x:1}],a:[{b:2},{y:2}],a:[{b:3},{z:3}]'))
      .toEqual({ a: [{ b: 3}, {x: 1, y: 2, z: 3}] })

    let k = j.make({map:{extend:false}})
    expect(k('a:{b:1,c:2},a:{c:3,e:4}'))
      .toEqual({ a: { c: 3, e: 4 } })
  })


  it('finish', () => {
    expect(j('a:{b:')).toEqual({ a: { b: null } })
    expect(j('{a:{b:{c:1}')).toEqual({ a: { b: { c: 1 } } })
    expect(j('[[1')).toEqual([[1]])
    
    // TODO: needs own error code
    let k = j.make({rule:{finish:false}})
    expect(()=>k('a:{b:')).toThrow(/unexpected/)
    expect(()=>k('{a:{b:{c:1}')).toThrow(/unexpected/)
    expect(()=>k('[[1')).toThrow(/unexpected/)
  })
  

  it('property-dive', () => {
    expect(j('{a:1,b:2}')).toEqual({a:1,b:2})
    expect(j('{a:1,b:{c:2}}')).toEqual({a:1,b:{c:2}})
    expect(j('{a:1,b:{c:2},d:3}')).toEqual({a:1,b:{c:2},d:3})
    expect(j('{b:{c:2,e:4},d:3}')).toEqual({b:{c:2,e:4},d:3})
    
    expect(j('{a:{b:{c:1,d:2},e:3},f:4}')).toEqual({a:{b:{c:1,d:2},e:3},f:4})
    expect(j('a:b:c')).toEqual({a:{b:'c'}})
    expect(j('a:b:c, d:e:f')).toEqual({a:{b:'c'}, d:{e:'f'}})
    expect(j('a:b:c\nd:e:f')).toEqual({a:{b:'c'}, d:{e:'f'}})

    expect(j('a:b:c,d:e')).toEqual({a:{b:'c'},d:'e'})
    expect(j('a:b:c:1,d:e')).toEqual({a:{b:{c:1}},d:'e'})
    expect(j('a:b:c:f:{g:1},d:e')).toEqual({a:{b:{c:{f:{g:1}}}},d:'e'})
    expect(j('c:f:{g:1,h:2},d:e')).toEqual({c:{f:{g:1,h:2}},d:'e'})
    expect(j('c:f:[{g:1,h:2}],d:e')).toEqual({c:{f:[{g:1,h:2}]},d:'e'})

    expect(j('a:b:c:1\nd:e')).toEqual({a:{b:{c:1}},d:'e'})


    expect(j('[{a:1,b:2}]')).toEqual([{a:1,b:2}])
    expect(j('[{a:1,b:{c:2}}]')).toEqual([{a:1,b:{c:2}}])
    expect(j('[{a:1,b:{c:2},d:3}]')).toEqual([{a:1,b:{c:2},d:3}])
    expect(j('[{b:{c:2,e:4},d:3}]')).toEqual([{b:{c:2,e:4},d:3}])
    
    expect(j('[{a:{b:{c:1,d:2},e:3},f:4}]')).toEqual([{a:{b:{c:1,d:2},e:3},f:4}])
    expect(j('[a:b:c]')).toEqual([{a:{b:'c'}}])
    expect(j('[a:b:c, d:e:f]')).toEqual([{a:{b:'c'}}, {d:{e:'f'}}])
    expect(j('[a:b:c\nd:e:f]')).toEqual([{a:{b:'c'}}, {d:{e:'f'}}])

    expect(j('[a:b:c,d:e]')).toEqual([{a:{b:'c'}},{d:'e'}])
    expect(j('[a:b:c:1,d:e]')).toEqual([{a:{b:{c:1}}},{d:'e'}])
    expect(j('[a:b:c:f:{g:1},d:e]')).toEqual([{a:{b:{c:{f:{g:1}}}}},{d:'e'}])
    expect(j('[c:f:{g:1,h:2},d:e]')).toEqual([{c:{f:{g:1,h:2}}},{d:'e'}])
    expect(j('[c:f:[{g:1,h:2}],d:e]')).toEqual([{c:{f:[{g:1,h:2}]}},{d:'e'}])

    expect(j('[a:b:c:1\nd:e]')).toEqual([{a:{b:{c:1}}},{d:'e'}])

    expect(j('a:b:{x:1},a:b:{y:2}'))
      .toEqual({a: { b: { x: 1, y: 2 } }})
    expect(j('a:b:{x:1},a:b:{y:2},a:b:{z:3}'))
      .toEqual({a: { b: { x: 1, y: 2, z: 3 } }})

    expect(j('a:b:c:{x:1},a:b:c:{y:2}'))
      .toEqual({a: { b: { c: { x: 1, y: 2 }}}})
    expect(j('a:b:c:{x:1},a:b:c:{y:2},a:b:c:{z:3}'))
      .toEqual({a: { b: { c: { x: 1, y: 2, z: 3 }}}})

    
  })


/* TODO: fix
  it('get-set-rule-and-lex', () => {
    let p0 = Jsonic.make()

    // Get all the rules
    let rval = p0.rule()
    expect(Object.keys(rval)).toEqual(['val', 'map', 'list', 'pair', 'elem'])

    // Get a rule
    rval = p0.rule('not-a-rule')
    expect(rval).not.exists()
    rval = p0.rule('val')
    expect(rval.name).toEqual('val')

    // Still OK, for now
    expect(p0('a:1')).toEqual({a:1})

    // Rules can be deleted
    p0.rule('val', null)
    rval = p0.rule('val')
    expect(rval).not.exists()

    // Parent still OK
    expect(Jsonic('a:1')).toEqual({a:1})

    // New rule
    p0.rule('foo',()=>{
      return new RuleSpec()
    })
    rval = p0.rule('foo')
    expect(rval.name).toEqual('foo')
    rval = p0.rule()
    expect(Object.keys(rval)).toEqual(['map', 'list', 'pair', 'elem', 'foo'])


    // Modify RuleSpec
    p0.rule('foo',(rs)=>{
      rs.x = 1
    })
    rval = p0.rule('foo')
    expect(rval.name).toEqual('foo')
    expect(rval.x).toEqual(1)
    rval = p0.rule()
    expect(Object.keys(rval)).toEqual(['map', 'list', 'pair', 'elem', 'foo'])

    
    // Get all matchers for all states
    let mm0 = p0.lex()
    //expect(I(mm0)).toEqual(`{ '19': [], '20': [], '21': [], '22': [] }`)
    expect(mm0).toEqual({})

    // Add some lex matchers
    p0.lex(p0.token.LML,function lmA(){})
    p0.lex(p0.token.LML,function lmB(){})
    p0.lex(p0.token.LTX,function lmC(){})
    mm0 = p0.lex()
    expect(I(mm0)).toEqual(`{
  '20': [ [Function: lmC] ],
  '22': [ [Function: lmA], [Function: lmB] ]
}`)

    // Get lex matchers for a given state
    mm0 = p0.lex(p0.token.LML)
    expect(I(mm0)).toEqual(`[ [Function: lmA], [Function: lmB] ]`)

    // Parent still OK
    expect(Jsonic('a:1')).toEqual({a:1})

    // Lex matchers can be cleared by state
    p0.lex(p0.token.LML,null)
    mm0 = p0.lex(p0.token.LML)
    expect(mm0).not.exists()

  })
*/

  // Test derived from debug sessions using quick.js
  it('debug-cases', () => {
    
    let j = (s)=>{
      try { 
        return JSON.stringify(Jsonic(s))
      }
      catch(e) {
        return e.message.split(/\n/)[0]
      }
    }

    let cases = [
      ['1',               '1'],
      ['true',            'true'],
      ['x',               '"x"'],
      ['"y"',             '"y"'],

      ['{a:1}',           '{"a":1}'],
      ['{a:1,b:2}',       '{"a":1,"b":2}'],
      ['{a:1,b:2,c:3}',   '{"a":1,"b":2,"c":3}'],
      ['{a:{b:2}}',       '{"a":{"b":2}}'],
      ['{a:{b:2},c:3}',   '{"a":{"b":2},"c":3}'],
      ['{a:{b:2,c:3}}',   '{"a":{"b":2,"c":3}}'],
      ['{a:{b:{c:3}}',    '{"a":{"b":{"c":3}}}'],

      ['a:1',           '{"a":1}'],
      ['a:1,b:2',       '{"a":1,"b":2}'],
      ['a:1,b:2,c:3',   '{"a":1,"b":2,"c":3}'],
      ['a:{b:2}',       '{"a":{"b":2}}'],
      ['a:{b:2},c:3',   '{"a":{"b":2},"c":3}'],
      ['a:{b:2,c:3}',   '{"a":{"b":2,"c":3}}'],
      ['a:{b:{c:3}',    '{"a":{"b":{"c":3}}}'],

      
      ['{a:1,x:0}',             '{"a":1,"x":0}'],
      ['{a:1,b:2,x:0}',         '{"a":1,"b":2,"x":0}'],
      ['{a:{b:2,x:0},x:0}',     '{"a":{"b":2,"x":0},"x":0}'],
      ['{a:{b:2,x:0},c:3,x:0}', '{"a":{"b":2,"x":0},"c":3,"x":0}'],
      ['{a:{b:2,c:3,x:0},x:0}', '{"a":{"b":2,"c":3,"x":0},"x":0}'],
      ['{a:{b:{c:3,x:0},x:0}',  '{"a":{"b":{"c":3,"x":0},"x":0}}'],

      ['a:1,x:0',             '{"a":1,"x":0}'],
      ['a:1,b:2,x:0',         '{"a":1,"b":2,"x":0}'],
      ['a:{b:2,x:0},x:0',     '{"a":{"b":2,"x":0},"x":0}'],
      ['a:{b:2,x:0},c:3,x:0', '{"a":{"b":2,"x":0},"c":3,"x":0}'],
      ['a:{b:2,c:3,x:0},x:0', '{"a":{"b":2,"c":3,"x":0},"x":0}'],
      ['a:{b:{c:3,x:0},x:0',  '{"a":{"b":{"c":3,"x":0},"x":0}}'],


      
      ['{a:b:2}',            '{"a":{"b":2}}'],
      ['{a:b:c:3}',          '{"a":{"b":{"c":3}}}'],
      ['{a:b:2,c:3}',        '{"a":{"b":2},"c":3}'],
      ['{a:1,b:c:3}',        '{"a":1,"b":{"c":3}}'],
      ['{a:b:c:3,d:4}',      '{"a":{"b":{"c":3}},"d":4}'],
      ['{a:1,b:c:d:4}',      '{"a":1,"b":{"c":{"d":4}}}'],
      ['{a:b:2,c:d:4}',      '{"a":{"b":2},"c":{"d":4}}'],
      ['{a:b:c:3,d:e:f:6}',  '{"a":{"b":{"c":3}},"d":{"e":{"f":6}}}'],

      ['a:b:2',            '{"a":{"b":2}}'],
      ['a:b:c:3',          '{"a":{"b":{"c":3}}}'],
      ['a:b:2,c:3',        '{"a":{"b":2},"c":3}'],
      ['a:1,b:c:3',        '{"a":1,"b":{"c":3}}'],
      ['a:b:c:3,d:4',      '{"a":{"b":{"c":3}},"d":4}'],
      ['a:1,b:c:d:4',      '{"a":1,"b":{"c":{"d":4}}}'],
      ['a:b:2,c:d:4',      '{"a":{"b":2},"c":{"d":4}}'],
      ['a:b:c:3,d:e:f:6',  '{"a":{"b":{"c":3}},"d":{"e":{"f":6}}}'],

      
      ['{x:{a:b:2}}',            '{"x":{"a":{"b":2}}}'],
      ['{x:{a:b:c:3}}',          '{"x":{"a":{"b":{"c":3}}}}'],
      ['{x:{a:b:2,c:3}}',        '{"x":{"a":{"b":2},"c":3}}'],
      ['{x:{a:1,b:c:3}}',        '{"x":{"a":1,"b":{"c":3}}}'],
      ['{x:{a:b:c:3,d:4}}',      '{"x":{"a":{"b":{"c":3}},"d":4}}'],
      ['{x:{a:1,b:c:d:4}}',      '{"x":{"a":1,"b":{"c":{"d":4}}}}'],
      ['{x:{a:b:2,c:d:4}}',      '{"x":{"a":{"b":2},"c":{"d":4}}}'],
      ['{x:{a:b:c:3,d:e:f:6}}',  '{"x":{"a":{"b":{"c":3}},"d":{"e":{"f":6}}}}'],

      ['x:{a:b:2}',            '{"x":{"a":{"b":2}}}'],
      ['x:{a:b:c:3}',          '{"x":{"a":{"b":{"c":3}}}}'],
      ['x:{a:b:2,c:3}',        '{"x":{"a":{"b":2},"c":3}}'],
      ['x:{a:1,b:c:3}',        '{"x":{"a":1,"b":{"c":3}}}'],
      ['x:{a:b:c:3,d:4}',      '{"x":{"a":{"b":{"c":3}},"d":4}}'],
      ['x:{a:1,b:c:d:4}',      '{"x":{"a":1,"b":{"c":{"d":4}}}}'],
      ['x:{a:b:2,c:d:4}',      '{"x":{"a":{"b":2},"c":{"d":4}}}'],
      ['x:{a:b:c:3,d:e:f:6}',  '{"x":{"a":{"b":{"c":3}},"d":{"e":{"f":6}}}}'],

      
      ['{y:{x:{a:b:2}}}',            '{"y":{"x":{"a":{"b":2}}}}'],
      ['{y:{x:{a:b:c:3}}}',          '{"y":{"x":{"a":{"b":{"c":3}}}}}'],
      ['{y:{x:{a:b:2,c:3}}}',        '{"y":{"x":{"a":{"b":2},"c":3}}}'],
      ['{y:{x:{a:1,b:c:3}}}',        '{"y":{"x":{"a":1,"b":{"c":3}}}}'],
      ['{y:{x:{a:b:c:3,d:4}}}',      '{"y":{"x":{"a":{"b":{"c":3}},"d":4}}}'],
      ['{y:{x:{a:1,b:c:d:4}}}',      '{"y":{"x":{"a":1,"b":{"c":{"d":4}}}}}'],
      ['{y:{x:{a:b:2,c:d:4}}}',      '{"y":{"x":{"a":{"b":2},"c":{"d":4}}}}'],
      ['{y:{x:{a:b:c:3,d:e:f:6}}}',  '{"y":{"x":{"a":{"b":{"c":3}},"d":{"e":{"f":6}}}}}'],

      ['y:{x:{a:b:2}}',            '{"y":{"x":{"a":{"b":2}}}}'],
      ['y:{x:{a:b:c:3}}',          '{"y":{"x":{"a":{"b":{"c":3}}}}}'],
      ['y:{x:{a:b:2,c:3}}',        '{"y":{"x":{"a":{"b":2},"c":3}}}'],
      ['y:{x:{a:1,b:c:3}}',        '{"y":{"x":{"a":1,"b":{"c":3}}}}'],
      ['y:{x:{a:b:c:3,d:4}}',      '{"y":{"x":{"a":{"b":{"c":3}},"d":4}}}'],
      ['y:{x:{a:1,b:c:d:4}}',      '{"y":{"x":{"a":1,"b":{"c":{"d":4}}}}}'],
      ['y:{x:{a:b:2,c:d:4}}',      '{"y":{"x":{"a":{"b":2},"c":{"d":4}}}}'],
      ['y:{x:{a:b:c:3,d:e:f:6}}',  '{"y":{"x":{"a":{"b":{"c":3}},"d":{"e":{"f":6}}}}}'],

      
      ['{y:{x:{a:b:2}},z:0}',            '{"y":{"x":{"a":{"b":2}}},"z":0}'],
      ['{y:{x:{a:b:c:3}},z:0}',          '{"y":{"x":{"a":{"b":{"c":3}}}},"z":0}'],
      ['{y:{x:{a:b:2,c:3}},z:0}',        '{"y":{"x":{"a":{"b":2},"c":3}},"z":0}'],
      ['{y:{x:{a:1,b:c:3}},z:0}',        '{"y":{"x":{"a":1,"b":{"c":3}}},"z":0}'],
      ['{y:{x:{a:b:c:3,d:4}},z:0}',      '{"y":{"x":{"a":{"b":{"c":3}},"d":4}},"z":0}'],
      ['{y:{x:{a:1,b:c:d:4}},z:0}',      '{"y":{"x":{"a":1,"b":{"c":{"d":4}}}},"z":0}'],
      ['{y:{x:{a:b:2,c:d:4}},z:0}',      '{"y":{"x":{"a":{"b":2},"c":{"d":4}}},"z":0}'],
      ['{y:{x:{a:b:c:3,d:e:f:6}},z:0}',  '{"y":{"x":{"a":{"b":{"c":3}},"d":{"e":{"f":6}}}},"z":0}'],

      ['y:{x:{a:b:2}},z:0',            '{"y":{"x":{"a":{"b":2}}},"z":0}'],
      ['y:{x:{a:b:c:3}},z:0',          '{"y":{"x":{"a":{"b":{"c":3}}}},"z":0}'],
      ['y:{x:{a:b:2,c:3}},z:0',        '{"y":{"x":{"a":{"b":2},"c":3}},"z":0}'],
      ['y:{x:{a:1,b:c:3}},z:0',        '{"y":{"x":{"a":1,"b":{"c":3}}},"z":0}'],
      ['y:{x:{a:b:c:3,d:4}},z:0',      '{"y":{"x":{"a":{"b":{"c":3}},"d":4}},"z":0}'],
      ['y:{x:{a:1,b:c:d:4}},z:0',      '{"y":{"x":{"a":1,"b":{"c":{"d":4}}}},"z":0}'],
      ['y:{x:{a:b:2,c:d:4}},z:0',      '{"y":{"x":{"a":{"b":2},"c":{"d":4}}},"z":0}'],
      ['y:{x:{a:b:c:3,d:e:f:6}},z:0',  '{"y":{"x":{"a":{"b":{"c":3}},"d":{"e":{"f":6}}}},"z":0}'],

      
      ['{y:{x:{a:b:2}},z:k:0}',                                '{"y":{"x":{"a":{"b":2}}},"z":{"k":0}}'],
      ['{y:{x:{a:b:2,c:d:e:5,f:g:7}},z:k:{m:n:0,r:11},s:22}',  '{"y":{"x":{"a":{"b":2},"c":{"d":{"e":5}},"f":{"g":7}}},"z":{"k":{"m":{"n":0},"r":11}},"s":22}'],

      ['y:{x:{a:b:2}},z:k:0',                                '{"y":{"x":{"a":{"b":2}}},"z":{"k":0}}'],
      ['y:{x:{a:b:2,c:d:e:5,f:g:7}},z:k:{m:n:0,r:11},s:22',  '{"y":{"x":{"a":{"b":2},"c":{"d":{"e":5}},"f":{"g":7}}},"z":{"k":{"m":{"n":0},"r":11}},"s":22}'],

      ['{a:1 b:2}', '{"a":1,"b":2}'],
      ['a:1 b:2', '{"a":1,"b":2}'],

      ['{a:1 b:2 c:3}', '{"a":1,"b":2,"c":3}'],
      ['a:1 b:2 c:3', '{"a":1,"b":2,"c":3}'],

      ['{a:b:2 c:3}', '{"a":{"b":2},"c":3}'],
      ['{a:b:2 `c`:3}', '{"a":{"b":2},"c":3}'],
      ['{a:b:2 99:3}', '{"99":3,"a":{"b":2}}'],
      ['{a:b:2 true:3}', '{"a":{"b":2},"true":3}'],

      ['a:b:2 c:3', '{"a":{"b":2},"c":3}'],
      ['a:b:2 `c`:3', '{"a":{"b":2},"c":3}'],
      ['a:b:2 99:3', '{"99":3,"a":{"b":2}}'],
      ['a:b:2 true:3', '{"a":{"b":2},"true":3}'],

      ['{a:{b:c:3} d:4}', '{"a":{"b":{"c":3}},"d":4}'],
      ['a:{b:c:3} d:4', '{"a":{"b":{"c":3}},"d":4}'],

      ['[a]',      '["a"]'],
      ['[a,b]',    '["a","b"]'],

      ['[a]',      '["a"]'],
      ['[a,[b]]',  '["a",["b"]]'],

      ['[a b]',     '["a","b"]'],
      ['[a [b]]',   '["a",["b"]]'],
      ['[a {b:2}]', '["a",{"b":2}]'],

      ['[a,b,]',     '["a","b"]'],
      ['{a:1,b:2,}', '{"a":1,"b":2}'],

      ['a,b',    '["a","b"]'],

      ['{}',    '{}'],
      ['[]',    '[]'],

      ['[,]',    '[null]'],
      ['[,1]',    '[null,1]'],
      ['[,,1]',    '[null,null,1]'],
      ['[2,]',    '[2]'],
      ['[2,,1]',    '[2,null,1]'],
    ]


    let count = {pass:0,fail:0}

    cases.forEach(c=>{
      let out = j(c[0])
      let ok = out === c[1]
      count[ok?'pass':'fail']++
      if(!ok) {
        console.log(ok?'\x1b[0;32mPASS':'\x1b[1;31mFAIL',c[0],'->',out)
        console.log(' '.repeat(7+c[0].length),'\x1b[1;34m',c[1])
      }
    })

    if(0 < count.fail) {
      console.log('\x1b[0m', count)
      Code.fail()
    }
  })
})



function match(src,pat,ctx) {
  ctx = ctx || {}
  ctx.loc = ctx.loc || '$'

  if(src===pat) return
  if(false !== ctx.miss && undefined === pat) return

  if(Array.isArray(src) && Array.isArray(pat)) {
    if(false === ctx.miss && src.length !== pat.length) {
      return ctx.loc+'/len:'+src.length+'!='+pat.length
    }

    let m = undefined
    for(let i = 0; i < pat.length; i++) {
      m = match(src[i],pat[i],{...ctx,loc:ctx.loc+'['+i+']'})
      if(m) {
        return m
      }
    }

    return
  }
  else if('object' === typeof(src) && 'object' === typeof(pat) ) {
    let ksrc = Object.keys(src).sort()
    let kpat = Object.keys(pat).sort()

    if(false === ctx.miss && ksrc.length !== kpat.length) {
      return ctx.loc+'/key:{'+ksrc+'}!={'+kpat+'}'
    }
    
    for(let i = 0; i < kpat.length; i++) {
      if(false === ctx.miss && ksrc[i] !== kpat[i]) return ctx.loc+'/key:'+kpat[i]

      let m = match(src[kpat[i]],pat[kpat[i]],{...ctx,loc:ctx.loc+'.'+kpat[i]})
      if(m) {
        return m
      }
    }
    
    return
  }

  return ctx.loc+'/val:'+src+'!='+pat
}
