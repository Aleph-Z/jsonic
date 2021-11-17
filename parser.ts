/* Copyright (c) 2013-2021 Richard Rodger, MIT License */

/*  parser.ts
 *  Parser implementation, converts the lexer tokens into parsed data.
 */


import type {
  RuleState,
  RuleStep,
  StateAction,
  Tin,
  Token,
  Config,
  Context,
  Rule,
  RuleSpec,
  NormAltSpec,
  AltCond,
  AltModifier,
  AltAction,
  AltMatch,
  RuleSpecMap,
  RuleDefiner,
  AltSpec,
  Options,
  Counters,
  Relate,
} from './types'

import {
  OPEN,
  CLOSE,
  BEFORE,
  AFTER,
  EMPTY,
} from './types'


import {
  JsonicError,
  S,
  badlex,
  deep,
  entries,
  filterRules,
  isarr,
  keys,
  makelog,
  srcfmt,
  tokenize,
  normalt,
} from './utility'


import {
  makeNoToken,
  makeLex,
  makePoint,
  makeToken,
} from './lexer'


class RuleImpl implements Rule {
  id = -1
  name = EMPTY
  node = null
  state = OPEN
  n = {}
  d = -1
  use = {}
  bo = false
  ao = false
  bc = false
  ac = false

  os = 0
  cs = 0

  spec: RuleSpec
  child: Rule
  parent: Rule
  prev: Rule
  o0: Token
  o1: Token
  c0: Token
  c1: Token

  constructor(spec: RuleSpec, ctx: Context, node?: any) {
    this.id = ctx.uI++     // Rule ids are unique only to the parse run.
    this.name = spec.name
    this.spec = spec

    this.child = ctx.NORULE
    this.parent = ctx.NORULE
    this.prev = ctx.NORULE

    this.o0 = ctx.NOTOKEN
    this.o1 = ctx.NOTOKEN
    this.c0 = ctx.NOTOKEN
    this.c1 = ctx.NOTOKEN


    this.node = node
    this.d = ctx.rsI
    this.bo = null != spec.def.bo
    this.ao = null != spec.def.ao
    this.bc = null != spec.def.bc
    this.ac = null != spec.def.ac
  }

  process(ctx: Context): Rule {
    let rule = this.spec.process(this, ctx, this.state)
    return rule
  }
}

const makeRule = (...params: ConstructorParameters<typeof RuleImpl>) =>
  new RuleImpl(...params)

const makeNoRule = (ctx: Context) => makeRule(
  makeRuleSpec(ctx.cfg, {}),
  ctx,
)



// Parse-alternate match (built from current tokens and AltSpec).
class AltMatchImpl implements AltMatch {
  // m: Token[] = [] // Matched Tokens (not Tins!).
  p = EMPTY       // Push rule (by name).
  r = EMPTY       // Replace rule (by name).
  b = 0           // Move token position backward.
  c?: AltCond     // Custom alt match condition.
  n?: Counters    // increment named counters.
  a?: AltAction   // Match actions.
  h?: AltModifier // Modify alternate match.
  u?: Relate      // Custom properties to add to Rule.use.
  g?: string[]    // Named group tags (allows plugins to find alts).
  e?: Token       // Errored on this token.
}

const makeAltMatch = (...params: ConstructorParameters<typeof AltMatchImpl>) =>
  new AltMatchImpl(...params)


const PALT = makeAltMatch() // Only one alt object is created.
const EMPTY_ALT = makeAltMatch()


class RuleSpecImpl implements RuleSpec {
  name = EMPTY // Set by Parser.rule
  def: any // TODO: hoist open, close
  cfg: Config

  constructor(cfg: Config, def: any) {
    this.cfg = cfg
    this.def = def || {}

    // Null Alt entries are allowed and ignored as a convenience.
    this.def.open = (this.def.open || []).filter((alt: AltSpec) => null != alt)
    this.def.close = (this.def.close || []).filter((alt: AltSpec) => null != alt)

    for (let alt of [...this.def.open, ...this.def.close]) {
      normalt(alt)
    }
  }


  // Convenience access to token Tins
  tin<R extends string | Tin, T extends (R extends Tin ? string : Tin)>(ref: R): T {
    return tokenize(ref, this.cfg)
  }


  add(state: RuleState, a: AltSpec | AltSpec[], flags: any): RuleSpec {
    let inject = flags?.last ? 'push' : 'unshift'
    let aa = ((isarr(a) ? a : [a]) as AltSpec[])
      .filter((alt: AltSpec) => null != alt)
      .map(a => normalt(a))
    this.def[('o' === state ? 'open' : 'close')][inject](...aa)
    filterRules(this, this.cfg)
    return this
  }


  open(a: AltSpec | AltSpec[], flags?: any): RuleSpec {
    return this.add('o', a, flags)
  }


  close(a: AltSpec | AltSpec[], flags?: any): RuleSpec {
    return this.add('c', a, flags)
  }


  action(step: RuleStep, state: RuleState, action: StateAction): RuleSpec {
    this.def[step + state] = action
    return this
  }

  bo(action: StateAction) {
    return this.action(BEFORE, OPEN, action)
  }

  ao(action: StateAction) {
    return this.action(AFTER, OPEN, action)
  }

  bc(action: StateAction) {
    return this.action(BEFORE, CLOSE, action)
  }

  ac(action: StateAction) {
    return this.action(AFTER, CLOSE, action)
  }

  clear() {
    this.def = { open: [], close: [] }
    return this
  }

  process(rule: Rule, ctx: Context, state: RuleState): Rule {
    let why = EMPTY
    let F = ctx.F

    let is_open = state === 'o'
    let next = is_open ? rule : ctx.NORULE

    let def = this.def

    // Match alternates for current state.
    let alts = (is_open ? def.open : def.close) as NormAltSpec[]

    // Handle "before" call.
    let before = is_open ?
      (rule.bo && def.bo) :
      (rule.bc && def.bc)
    let bout = before && before.call(this, rule, ctx)
    if (bout && bout.isToken && null != bout.err) {
      return this.bad(bout, rule, ctx, { is_open })
    }

    // Attempt to match one of the alts.
    // let alt: AltMatch = (bout && bout.alt) ? { ...EMPTY_ALT, ...bout.alt } :
    let alt: AltMatch = 0 < alts.length ? this.parse_alts(is_open, alts, rule, ctx) :
      EMPTY_ALT

    // Custom alt handler.
    if (alt.h) {
      alt = alt.h(rule, ctx, alt, next) || alt
      why += 'H'
    }

    // Unconditional error.
    if (alt.e) {
      return this.bad(alt.e, rule, ctx, { is_open })
    }

    // Update counters.
    if (alt.n) {
      for (let cn in alt.n) {
        rule.n[cn] =
          // 0 reverts counter to 0.
          0 === alt.n[cn] ? 0 :
            // First seen, set to 0.
            (null == rule.n[cn] ? 0 :
              // Increment counter.
              rule.n[cn]) + alt.n[cn]
      }
    }

    // Set custom properties
    if (alt.u) {
      rule.use = Object.assign(rule.use, alt.u)
    }

    // Action call.
    if (alt.a) {
      why += 'A'
      let tout = alt.a.call(this, rule, ctx, alt)
      if (tout && tout.isToken && tout.err) {
        return this.bad(tout, rule, ctx, { is_open })
      }
    }

    // Push a new rule onto the stack...
    if (alt.p) {
      // ctx.rs.push(rule)
      ctx.rs[ctx.rsI++] = rule

      let rulespec = ctx.rsm[alt.p]
      if (rulespec) {
        next = rule.child = makeRule(rulespec, ctx, rule.node)
        next.parent = rule
        next.n = { ...rule.n }
        why += '@p:' + alt.p
      }
      else return this.bad(this.unknownRule(ctx.t0, alt.p), rule, ctx, { is_open })
    }

    // ...or replace with a new rule.
    else if (alt.r) {
      let rulespec = ctx.rsm[alt.r]
      if (rulespec) {
        next = makeRule(rulespec, ctx, rule.node)
        next.parent = rule.parent
        next.prev = rule

        // console.log('PROC R', rule.name, rule.n)

        next.n = { ...rule.n }
        why += '@r:' + alt.r
      }
      else return this.bad(this.unknownRule(ctx.t0, alt.r), rule, ctx, { is_open })
    }

    // Pop closed rule off stack.
    else {
      if (!is_open) {
        // next = ctx.rs.pop() || ctx.NORULE
        next = ctx.rs[--ctx.rsI] || ctx.NORULE
      }
      why += 'Z'
    }

    // Handle "after" call.
    let after = is_open ?
      (rule.ao && def.ao) :
      (rule.ac && def.ac)
    let aout = after && after.call(this, rule, ctx, alt, next)
    if (aout && aout.isToken && null != aout.err) {
      return this.bad(aout, rule, ctx, { is_open })
    }

    next.why = why

    ctx.log && ctx.log(
      'node  ' + rule.state.toUpperCase(),
      (rule.prev.id + '/' + rule.parent.id + '/' + rule.child.id),
      rule.name + '~' + rule.id,
      'w=' + why,
      'n:' + entries(rule.n).filter(n => n[1]).map(n => n[0] + '=' + n[1]).join(';'),
      'u:' + entries(rule.use).map(u => u[0] + '=' + u[1]).join(';'),
      '<' + F(rule.node) + '>'
    )


    // Lex next tokens (up to backtrack).
    let mI = 0
    let rewind = rule[is_open ? 'os' : 'cs'] - (alt.b || 0)
    while (mI++ < rewind) {
      ctx.next()
    }

    // Must be last as state change is for next process call.
    if (OPEN === rule.state) {
      rule.state = CLOSE
    }

    return next
  }

  // First match wins.
  // NOTE: input AltSpecs are used to build the Alt output.
  parse_alts(
    is_open: boolean,
    alts: NormAltSpec[],
    rule: Rule,
    ctx: Context
  ): AltMatch {
    let out = PALT
    out.b = 0           // Backtrack n tokens.
    out.p = EMPTY          // Push named rule onto stack. 
    out.r = EMPTY          // Replace current rule with named rule.
    out.n = undefined   // Increment named counters.
    out.h = undefined   // Custom handler function.
    out.a = undefined   // Rule action.
    out.u = undefined   // Custom rule properties.
    out.e = undefined   // Error token.

    let alt: NormAltSpec | null = null
    let altI = 0
    let t = ctx.cfg.t
    let cond
    let bitAA = (1 << (t.AA - 1))

    // TODO: replace with lookup map
    let len = alts.length
    for (altI = 0; altI < len; altI++) {

      // cond = false
      alt = (alts[altI] as NormAltSpec)

      let tin0 = ctx.t0.tin
      let has0 = false
      let has1 = false

      cond = true

      if (alt.S0) {
        has0 = true
        cond = ((alt.S0[(tin0 / 31) | 0] & ((1 << ((tin0 % 31) - 1)) | bitAA)))

        if (cond) {
          has1 = null != alt.S1

          if (alt.S1) {
            has1 = true
            let tin1 = ctx.t1.tin
            cond = (alt.S1[(tin1 / 31) | 0] & ((1 << ((tin1 % 31) - 1)) | bitAA))
          }
        }
      }

      if (is_open) {
        rule.o0 = has0 ? ctx.t0 : ctx.NOTOKEN
        rule.o1 = has1 ? ctx.t1 : ctx.NOTOKEN
        rule.os = (has0 ? 1 : 0) + (has1 ? 1 : 0)
      }
      else {
        rule.c0 = has0 ? ctx.t0 : ctx.NOTOKEN
        rule.c1 = has1 ? ctx.t1 : ctx.NOTOKEN
        rule.cs = (has0 ? 1 : 0) + (has1 ? 1 : 0)
      }

      // Optional custom condition
      if (cond && alt.c) {
        cond = cond && alt.c(rule, ctx, out)
      }

      if (cond) {
        break
      }
      else {
        alt = null
      }
    }

    // if (null == alt && t.ZZ !== ctx.t0.tin) {
    if (!cond && t.ZZ !== ctx.t0.tin) {
      out.e = ctx.t0
    }

    if (alt) {
      out.n = null != alt.n ? alt.n : out.n
      out.h = null != alt.h ? alt.h : out.h
      out.a = null != alt.a ? alt.a : out.a
      out.u = null != alt.u ? alt.u : out.u
      out.g = null != alt.g ? alt.g : out.g

      out.e = alt.e && alt.e(rule, ctx, out) || undefined

      out.p = null != alt.p ?
        ('string' === typeof (alt.p) ? alt.p : alt.p(rule, ctx, out)) :
        out.p

      out.r = null != alt.r ?
        ('string' === typeof (alt.r) ? alt.r : alt.r(rule, ctx, out)) :
        out.r

      out.b = null != alt.b ?
        ('number' === typeof (alt.b) ? alt.b : alt.b(rule, ctx, out)) :
        out.b
    }

    let match = altI < alts.length

    // TODO: move to util function
    ctx.log && ctx.log(
      'parse ' + rule.state.toUpperCase(),
      (rule.prev.id + '/' + rule.parent.id + '/' + rule.child.id),

      rule.name + '~' + rule.id,

      match ? 'alt=' + altI : 'no-alt',

      (match && out.g ? 'g:' + out.g + ' ' : ''),

      (match && out.p ? 'p:' + out.p + ' ' : '') +
      (match && out.r ? 'r:' + out.r + ' ' : '') +
      (match && out.b ? 'b:' + out.b + ' ' : ''),

      (OPEN === rule.state ?
        ([rule.o0, rule.o1].slice(0, rule.os)) :
        ([rule.c0, rule.c1].slice(0, rule.cs)))
        .map((tkn: Token) => tkn.name + '=' + ctx.F(tkn.src)).join(' '),

      'c:' + ((alt && alt.c) ? cond : EMPTY),
      'n:' + entries(out.n).map(n => n[0] + '=' + n[1]).join(';'),
      'u:' + entries(out.u).map(u => u[0] + '=' + u[1]).join(';'),

      altI < alts.length &&
        (alt as any).s ?
        '[' + (alt as any).s.map((pin: Tin) => (
          Array.isArray(pin) ? pin.map((pin: Tin) => t[pin]).join('|') : t[pin]
        )).join(' ') + ']' : '[]',

      out)

    return out
  }

  bad(tkn: Token, rule: Rule, ctx: Context, parse: { is_open: boolean }): Rule {
    throw new JsonicError(
      tkn.err || S.unexpected,
      {
        ...tkn.use,
        state: parse.is_open ? S.open : S.close
      },
      tkn,
      rule,
      ctx
    )
  }

  unknownRule(tkn: Token, name: string): Token {
    tkn.err = 'unknown_rule'
    tkn.use = tkn.use || {}
    tkn.use.rulename = name
    return tkn
  }
}


const makeRuleSpec = (...params: ConstructorParameters<typeof RuleSpecImpl>) =>
  new RuleSpecImpl(...params)



class Parser {
  options: Options
  cfg: Config
  rsm: RuleSpecMap = {}

  constructor(options: Options, cfg: Config) {
    this.options = options
    this.cfg = cfg
  }

  // Multi-functional get/set for rules.
  rule(name?: string, define?: RuleDefiner | null):
    RuleSpec | RuleSpecMap | undefined {

    // If no name, get all the rules.
    if (null == name) {
      return this.rsm
    }

    // Else get a rule by name.
    let rs: RuleSpec = this.rsm[name]

    // Else delete a specific rule by name.
    if (null === define) {
      delete this.rsm[name]
    }

    // Else add or redefine a rule by name.
    else if (undefined !== define) {
      rs = this.rsm[name] = (this.rsm[name] || makeRuleSpec(this.cfg, {}))
      rs = this.rsm[name] = (define(this.rsm[name], this.rsm) || this.rsm[name])
      rs.name = name

      for (let alt of [...rs.def.open, ...rs.def.close]) {
        normalt(alt)
      }

      return undefined
    }

    return rs
  }


  start(
    src: string,
    //jsonic: Jsonic,
    jsonic: any,
    meta?: any,
    parent_ctx?: any
  ): any {
    let root: Rule

    let endtkn = makeToken(
      '#ZZ',
      tokenize('#ZZ', this.cfg),
      undefined,
      EMPTY,
      makePoint(-1)
    )

    let notoken = makeNoToken()

    let ctx: Context = {
      uI: 0,
      opts: this.options,
      cfg: this.cfg,
      meta: meta || {},
      src: () => src, // Avoid printing src
      root: () => root.node,
      plgn: () => jsonic.internal().plugins,
      rule: ({} as Rule),
      xs: -1,
      v2: endtkn,
      v1: endtkn,
      t0: endtkn,
      t1: endtkn,
      tC: -2,  // Prepare count for 2-token lookahead.
      next,
      rs: [],
      rsI: 0,
      rsm: this.rsm,
      log: undefined,
      F: srcfmt(this.cfg),
      use: {},
      NOTOKEN: notoken,
      NORULE: ({} as Rule),
    }

    ctx = deep(ctx, parent_ctx)

    let norule = makeNoRule(ctx)
    ctx.NORULE = norule
    ctx.rule = norule

    makelog(ctx, meta)


    // Special case - avoids extra per-token tests in main parser rules.
    if ('' === src) {
      if (this.cfg.lex.empty) {
        return undefined
      }
      else {
        throw new JsonicError(S.unexpected, { src }, ctx.t0, norule, ctx)
      }
    }



    let tn = (pin: Tin): string => tokenize(pin, this.cfg)
    let lex = badlex(makeLex(ctx), tokenize('#BD', this.cfg), ctx)
    let startspec = this.rsm[this.cfg.rule.start]

    if (null == startspec) {
      return undefined
    }

    let rule = makeRule(startspec, ctx)
    // console.log('\nSTART', rule)

    root = rule

    // Maximum rule iterations (prevents infinite loops). Allow for
    // rule open and close, and for each rule on each char to be
    // virtual (like map, list), and double for safety margin (allows
    // lots of backtracking), and apply a multipler options as a get-out-of-jail.
    let maxr = 2 * keys(this.rsm).length * lex.src.length *
      2 * ctx.cfg.rule.maxmul

    let ignore = ctx.cfg.tokenSet.ignore

    // Lex next token.
    function next() {
      ctx.v2 = ctx.v1
      ctx.v1 = ctx.t0
      ctx.t0 = ctx.t1

      let t1
      do {
        t1 = lex(rule)
        ctx.tC++
      } while (ignore[t1.tin])

      ctx.t1 = t1

      return ctx.t0
    }

    // Look two tokens ahead
    next()
    next()

    // Process rules on tokens
    let rI = 0

    // This loop is the heart of the engine. Keep processing rule
    // occurrences until there's none left.
    while (norule !== rule && rI < maxr) {
      ctx.log &&
        ctx.log(
          '\nstack',
          '<<' + ctx.F(root.node) + '>>',
          ctx.rs.slice(0, ctx.rsI).map((r: Rule) => r.name + '~' + r.id).join('/'),
          ctx.rs.slice(0, ctx.rsI).map((r: Rule) => '<' + ctx.F(r.node) + '>').join(' '),

          rule, ctx, '\n')

      ctx.log &&
        ctx.log(
          'rule  ' + rule.state.toUpperCase(),
          (rule.prev.id + '/' + rule.parent.id + '/' + rule.child.id),
          rule.name + '~' + rule.id,
          '[' + ctx.F(ctx.t0.src) + ' ' + ctx.F(ctx.t1.src) + ']',
          'n:' + entries(rule.n)
            .filter(n => n[1])
            .map(n => n[0] + '=' + n[1]).join(';'),
          'u:' + entries(rule.use).map(u => u[0] + '=' + u[1]).join(';'),

          '[' + tn(ctx.t0.tin) + ' ' + tn(ctx.t1.tin) + ']',

          rule, ctx)

      ctx.rule = rule

      rule = rule.process(ctx)

      rI++
    }

    // TODO: option to allow trailing content
    if (tokenize('#ZZ', this.cfg) !== ctx.t0.tin) {
      throw new JsonicError(S.unexpected, {}, ctx.t0, norule, ctx)
    }

    // NOTE: by returning root, we get implicit closing of maps and lists.

    // console.log('JSONIC FINAL', root.id)
    // return root.node

    // console.log('ROOT', ctx.root())
    return ctx.root()
  }


  clone(options: Options, config: Config) {
    let parser = new Parser(options, config)

    // Inherit rules from parent, filtered by config.rule
    parser.rsm = Object
      .keys(this.rsm)
      .reduce((a, rn) =>
        (a[rn] = filterRules(this.rsm[rn], this.cfg), a), ({} as any))

    return parser
  }
}


export {
  makeRule,
  makeRuleSpec,
  Parser,
}
