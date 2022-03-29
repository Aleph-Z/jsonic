"use strict";
/* Copyright (c) 2013-2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeTextMatcher = exports.makeNumberMatcher = exports.makeCommentMatcher = exports.makeStringMatcher = exports.makeLineMatcher = exports.makeSpaceMatcher = exports.makeFixedMatcher = exports.makeToken = exports.makePoint = exports.makeLex = exports.makeNoToken = void 0;
const types_1 = require("./types");
const utility_1 = require("./utility");
class PointImpl {
    constructor(len, sI, rI, cI) {
        this.len = -1;
        this.sI = 0;
        this.rI = 1;
        this.cI = 1;
        this.token = [];
        this.len = len;
        if (null != sI) {
            this.sI = sI;
        }
        if (null != rI) {
            this.rI = rI;
        }
        if (null != cI) {
            this.cI = cI;
        }
    }
    toString() {
        return 'Point[' + [this.sI + '/' + this.len, this.rI, this.cI] +
            (0 < this.token.length ? (' ' + this.token) : '') + ']';
    }
    [types_1.INSPECT]() {
        return this.toString();
    }
}
const makePoint = (...params) => new PointImpl(...params);
exports.makePoint = makePoint;
// Tokens from the lexer.
class TokenImpl {
    constructor(name, tin, val, src, pnt, use, why) {
        this.isToken = true;
        this.name = types_1.EMPTY;
        this.tin = -1;
        this.val = undefined;
        this.src = types_1.EMPTY;
        this.sI = -1;
        this.rI = -1;
        this.cI = -1;
        this.len = -1;
        this.name = name;
        this.tin = tin;
        this.src = src;
        this.val = val;
        this.sI = pnt.sI;
        this.rI = pnt.rI;
        this.cI = pnt.cI;
        this.use = use;
        this.why = why;
        this.len = null == src ? 0 : src.length;
    }
    resolveVal(rule, ctx) {
        let out = 'function' === typeof this.val ?
            this.val(rule, ctx) :
            this.val;
        return out;
    }
    bad(err, details) {
        this.err = err;
        if (null != details) {
            this.use = (0, utility_1.deep)(this.use || {}, details);
        }
        return this;
    }
    toString() {
        return 'Token[' +
            this.name + '=' + this.tin + ' ' +
            (0, utility_1.snip)(this.src) +
            (undefined === this.val || '#ST' === this.name || '#TX' === this.name ? '' :
                '=' + (0, utility_1.snip)(this.val)) + ' ' +
            [this.sI, this.rI, this.cI] +
            (null == this.use ? '' : ' ' +
                (0, utility_1.snip)(('' + JSON.stringify(this.use).replace(/"/g, '')), 22)) +
            (null == this.err ? '' : ' ' + this.err) +
            (null == this.why ? '' : ' ' + (0, utility_1.snip)('' + this.why, 22)) +
            ']';
    }
    [types_1.INSPECT]() {
        return this.toString();
    }
}
const makeToken = (...params) => new TokenImpl(...params);
exports.makeToken = makeToken;
const makeNoToken = () => makeToken('', -1, undefined, types_1.EMPTY, makePoint(-1));
exports.makeNoToken = makeNoToken;
let makeFixedMatcher = (cfg, _opts) => {
    let fixed = (0, utility_1.regexp)(null, '^(', cfg.rePart.fixed, ')');
    // console.log(fixed)
    return function fixedMatcher(lex) {
        let mcfg = cfg.fixed;
        if (!mcfg.lex)
            return undefined;
        let pnt = lex.pnt;
        let fwd = lex.src.substring(pnt.sI);
        let m = fwd.match(fixed);
        if (m) {
            let msrc = m[1];
            let mlen = msrc.length;
            if (0 < mlen) {
                let tkn = undefined;
                let tin = mcfg.token[msrc];
                if (null != tin) {
                    tkn = lex.token(tin, undefined, msrc, pnt);
                    pnt.sI += mlen;
                    pnt.cI += mlen;
                }
                return tkn;
            }
        }
    };
};
exports.makeFixedMatcher = makeFixedMatcher;
let makeCommentMatcher = (cfg, opts) => {
    let oc = opts.comment;
    cfg.comment = {
        lex: oc ? !!oc.lex : false,
        marker: ((oc === null || oc === void 0 ? void 0 : oc.marker) || []).map(om => ({
            start: om.start,
            end: om.end,
            line: !!om.line,
            lex: !!om.lex,
        }))
    };
    let lineComments = cfg.comment.lex ? cfg.comment.marker.filter(c => c.lex && c.line) : [];
    let blockComments = cfg.comment.lex ? cfg.comment.marker.filter(c => c.lex && !c.line) : [];
    return function matchComment(lex) {
        let mcfg = cfg.comment;
        if (!mcfg.lex)
            return undefined;
        let pnt = lex.pnt;
        let fwd = lex.src.substring(pnt.sI);
        let rI = pnt.rI;
        let cI = pnt.cI;
        // Single line comment.
        for (let mc of lineComments) {
            if (fwd.startsWith(mc.start)) {
                let fwdlen = fwd.length;
                let fI = mc.start.length;
                cI += mc.start.length;
                while (fI < fwdlen && !cfg.line.chars[fwd[fI]]) {
                    cI++;
                    fI++;
                }
                let csrc = fwd.substring(0, fI);
                let tkn = lex.token('#CM', undefined, csrc, pnt);
                pnt.sI += csrc.length;
                pnt.cI = cI;
                return tkn;
            }
        }
        // Multiline comment.
        for (let mc of blockComments) {
            if (fwd.startsWith(mc.start)) {
                let fwdlen = fwd.length;
                let fI = mc.start.length;
                let end = mc.end;
                cI += mc.start.length;
                while (fI < fwdlen && !fwd.substring(fI).startsWith(end)) {
                    if (cfg.line.rowChars[fwd[fI]]) {
                        rI++;
                        cI = 0;
                    }
                    cI++;
                    fI++;
                }
                if (fwd.substring(fI).startsWith(end)) {
                    cI += end.length;
                    let csrc = fwd.substring(0, fI + end.length);
                    let tkn = lex.token('#CM', undefined, csrc, pnt);
                    pnt.sI += csrc.length;
                    pnt.rI = rI;
                    pnt.cI = cI;
                    return tkn;
                }
                else {
                    return lex.bad(utility_1.S.unterminated_comment, pnt.sI, pnt.sI + (9 * mc.start.length));
                }
            }
        }
    };
};
exports.makeCommentMatcher = makeCommentMatcher;
// Match text, checking for literal values, optionally followed by a fixed token.
// Text strings are terminated by end markers.
let makeTextMatcher = (cfg, opts) => {
    let ender = (0, utility_1.regexp)(cfg.line.lex ? null : 's', '^(.*?)', ...cfg.rePart.ender);
    return function textMatcher(lex) {
        let mcfg = cfg.text;
        let pnt = lex.pnt;
        let fwd = lex.src.substring(pnt.sI);
        let vm = cfg.value.map;
        let m = fwd.match(ender);
        if (m) {
            let msrc = m[1];
            let tsrc = m[2];
            let out = undefined;
            if (null != msrc) {
                let mlen = msrc.length;
                if (0 < mlen) {
                    let vs = undefined;
                    if (cfg.value.lex && undefined !== (vs = vm[msrc])) {
                        out = lex.token('#VL', vs.val, msrc, pnt);
                        pnt.sI += mlen;
                        pnt.cI += mlen;
                    }
                    else if (mcfg.lex) {
                        out = lex.token('#TX', msrc, msrc, pnt);
                        pnt.sI += mlen;
                        pnt.cI += mlen;
                    }
                }
            }
            // A following fixed token can only match if there was already a
            // valid text or value match.
            if (out) {
                out = subMatchFixed(lex, out, tsrc);
            }
            if (out && 0 < cfg.text.modify.length) {
                const modify = cfg.text.modify;
                for (let mI = 0; mI < modify.length; mI++) {
                    out.val = modify[mI](out.val, lex, cfg, opts);
                }
            }
            return out;
        }
    };
};
exports.makeTextMatcher = makeTextMatcher;
let makeNumberMatcher = (cfg, _opts) => {
    let mcfg = cfg.number;
    let ender = (0, utility_1.regexp)(null, [
        '^([-+]?(0(',
        [
            mcfg.hex ? 'x[0-9a-fA-F_]+' : null,
            mcfg.oct ? 'o[0-7_]+' : null,
            mcfg.bin ? 'b[01_]+' : null,
        ].filter(s => null != s).join('|'),
        ')|[.0-9]+([0-9_]*[0-9])?)',
        '(\\.[0-9]?([0-9_]*[0-9])?)?',
        '([eE][-+]?[0-9]+([0-9_]*[0-9])?)?',
    ]
        .join('')
        .replace(/_/g, mcfg.sep ? (0, utility_1.escre)(mcfg.sepChar) : ''), ')', ...cfg.rePart.ender);
    let numberSep = (mcfg.sep ? (0, utility_1.regexp)('g', (0, utility_1.escre)(mcfg.sepChar)) : undefined);
    return function matchNumber(lex) {
        mcfg = cfg.number;
        if (!mcfg.lex)
            return undefined;
        let pnt = lex.pnt;
        let fwd = lex.src.substring(pnt.sI);
        let vm = cfg.value.map;
        let m = fwd.match(ender);
        if (m) {
            let msrc = m[1];
            let tsrc = m[9]; // NOTE: count parens in numberEnder!
            let out = undefined;
            if (null != msrc) {
                let mlen = msrc.length;
                if (0 < mlen) {
                    let vs = undefined;
                    if (cfg.value.lex && undefined !== (vs = vm[msrc])) {
                        out = lex.token('#VL', vs.val, msrc, pnt);
                    }
                    else {
                        let nstr = numberSep ? msrc.replace(numberSep, '') : msrc;
                        let num = +(nstr);
                        // Special case: +- prefix of 0x... format
                        if (isNaN(num)) {
                            let first = nstr[0];
                            if ('-' === first || '+' === first) {
                                num = ('-' === first ? -1 : 1) * +(nstr.substring(1));
                            }
                        }
                        if (!isNaN(num)) {
                            out = lex.token('#NR', num, msrc, pnt);
                            pnt.sI += mlen;
                            pnt.cI += mlen;
                        }
                        // Else let later matchers try.
                    }
                }
            }
            out = subMatchFixed(lex, out, tsrc);
            return out;
        }
    };
};
exports.makeNumberMatcher = makeNumberMatcher;
let makeStringMatcher = (cfg, opts) => {
    // TODO: does `clean` make sense here? 
    let os = opts.string || {};
    cfg.string = (cfg.string || {});
    // TODO: compose with earlier config - do this in other makeFooMatchers?
    cfg.string = (0, utility_1.deep)(cfg.string, {
        lex: !!(os === null || os === void 0 ? void 0 : os.lex),
        quoteMap: (0, utility_1.charset)(os.chars),
        multiChars: (0, utility_1.charset)(os.multiChars),
        escMap: (0, utility_1.clean)({ ...os.escape }),
        escChar: os.escapeChar,
        escCharCode: null == os.escapeChar ? undefined : os.escapeChar.charCodeAt(0),
        allowUnknown: !!os.allowUnknown,
        replaceCodeMap: (0, utility_1.omap)((0, utility_1.clean)({ ...os.replace }), ([c, r]) => [c.charCodeAt(0), r]),
        hasReplace: false
    });
    cfg.string.hasReplace = 0 < (0, utility_1.keys)(cfg.string.replaceCodeMap).length;
    return function stringMatcher(lex) {
        let mcfg = cfg.string;
        if (!mcfg.lex)
            return undefined;
        let { quoteMap, escMap, escChar, escCharCode, multiChars, allowUnknown, replaceCodeMap, hasReplace, } = mcfg;
        let { pnt, src } = lex;
        let { sI, rI, cI } = pnt;
        let srclen = src.length;
        if (quoteMap[src[sI]]) {
            const q = src[sI]; // Quote character
            const qI = sI;
            const qrI = rI;
            const isMultiLine = multiChars[q];
            ++sI;
            ++cI;
            let s = [];
            let rs;
            for (sI; sI < srclen; sI++) {
                cI++;
                let c = src[sI];
                rs = undefined;
                // Quote char.
                if (q === c) {
                    sI++;
                    break; // String finished.
                }
                // Escape char. 
                else if (escChar === c) {
                    sI++;
                    cI++;
                    let es = escMap[src[sI]];
                    if (null != es) {
                        s.push(es);
                    }
                    // ASCII escape \x**
                    else if ('x' === src[sI]) {
                        sI++;
                        let cc = parseInt(src.substring(sI, sI + 2), 16);
                        if (isNaN(cc)) {
                            sI = sI - 2;
                            cI -= 2;
                            pnt.sI = sI;
                            pnt.cI = cI;
                            return lex.bad(utility_1.S.invalid_ascii, sI, sI + 4);
                        }
                        let us = String.fromCharCode(cc);
                        s.push(us);
                        sI += 1; // Loop increments sI.
                        cI += 2;
                    }
                    // Unicode escape \u**** and \u{*****}.
                    else if ('u' === src[sI]) {
                        sI++;
                        let ux = '{' === src[sI] ? (sI++, 1) : 0;
                        let ulen = ux ? 6 : 4;
                        let cc = parseInt(src.substring(sI, sI + ulen), 16);
                        if (isNaN(cc)) {
                            sI = sI - 2 - ux;
                            cI -= 2;
                            pnt.sI = sI;
                            pnt.cI = cI;
                            return lex.bad(utility_1.S.invalid_unicode, sI, sI + ulen + 2 + 2 * ux);
                        }
                        let us = String.fromCodePoint(cc);
                        s.push(us);
                        sI += (ulen - 1) + ux; // Loop increments sI.
                        cI += ulen + ux;
                    }
                    else if (allowUnknown) {
                        s.push(src[sI]);
                    }
                    else {
                        pnt.sI = sI;
                        pnt.cI = cI - 1;
                        return lex.bad(utility_1.S.unexpected, sI, sI + 1);
                    }
                }
                else if (hasReplace &&
                    undefined !== (rs = replaceCodeMap[src.charCodeAt(sI)])) {
                    s.push(rs);
                    cI++;
                }
                // Body part of string.
                else {
                    let bI = sI;
                    // TODO: move to cfgx
                    let qc = q.charCodeAt(0);
                    let cc = src.charCodeAt(sI);
                    while ((!hasReplace || (undefined === (rs = replaceCodeMap[cc]))) &&
                        sI < srclen && 32 <= cc && qc !== cc && escCharCode !== cc) {
                        cc = src.charCodeAt(++sI);
                        cI++;
                    }
                    cI--;
                    if (undefined === rs && cc < 32) {
                        if (isMultiLine && cfg.line.chars[src[sI]]) {
                            if (cfg.line.rowChars[src[sI]]) {
                                pnt.rI = ++rI;
                            }
                            cI = 1;
                            s.push(src.substring(bI, sI + 1));
                        }
                        else {
                            pnt.sI = sI;
                            pnt.cI = cI;
                            return lex.bad(utility_1.S.unprintable, sI, sI + 1);
                        }
                    }
                    else {
                        s.push(src.substring(bI, sI));
                        sI--;
                    }
                }
            }
            if (src[sI - 1] !== q || pnt.sI === sI - 1) {
                pnt.rI = qrI;
                return lex.bad(utility_1.S.unterminated_string, qI, sI);
            }
            const tkn = lex.token('#ST', s.join(types_1.EMPTY), src.substring(pnt.sI, sI), pnt);
            pnt.sI = sI;
            pnt.rI = rI;
            pnt.cI = cI;
            return tkn;
        }
    };
};
exports.makeStringMatcher = makeStringMatcher;
// Line ending matcher.
let makeLineMatcher = (cfg, _opts) => {
    return function matchLine(lex) {
        if (!cfg.line.lex)
            return undefined;
        let { chars, rowChars } = cfg.line;
        let { pnt, src } = lex;
        let { sI, rI } = pnt;
        while (chars[src[sI]]) {
            rI += (rowChars[src[sI]] ? 1 : 0);
            sI++;
        }
        if (pnt.sI < sI) {
            let msrc = src.substring(pnt.sI, sI);
            const tkn = lex.token('#LN', undefined, msrc, pnt);
            pnt.sI += msrc.length;
            pnt.rI = rI;
            pnt.cI = 1;
            return tkn;
        }
    };
};
exports.makeLineMatcher = makeLineMatcher;
// Space matcher.
let makeSpaceMatcher = (cfg, _opts) => {
    return function spaceMatcher(lex) {
        if (!cfg.space.lex)
            return undefined;
        let { chars } = cfg.space;
        let { pnt, src } = lex;
        let { sI, cI } = pnt;
        while (chars[src[sI]]) {
            sI++;
            cI++;
        }
        if (pnt.sI < sI) {
            let msrc = src.substring(pnt.sI, sI);
            const tkn = lex.token('#SP', undefined, msrc, pnt);
            pnt.sI += msrc.length;
            pnt.cI = cI;
            return tkn;
        }
    };
};
exports.makeSpaceMatcher = makeSpaceMatcher;
function subMatchFixed(lex, first, tsrc) {
    let pnt = lex.pnt;
    let out = first;
    if (lex.cfg.fixed.lex && null != tsrc) {
        let tknlen = tsrc.length;
        if (0 < tknlen) {
            let tkn = undefined;
            let tin = lex.cfg.fixed.token[tsrc];
            if (null != tin) {
                tkn = lex.token(tin, undefined, tsrc, pnt);
            }
            if (null != tkn) {
                pnt.sI += tkn.src.length;
                pnt.cI += tkn.src.length;
                if (null == first) {
                    out = tkn;
                }
                else {
                    pnt.token.push(tkn);
                }
            }
        }
    }
    return out;
}
class LexImpl {
    constructor(ctx) {
        this.src = types_1.EMPTY;
        this.ctx = {};
        this.cfg = {};
        this.pnt = makePoint(-1);
        this.ctx = ctx;
        this.src = ctx.src();
        this.cfg = ctx.cfg;
        this.pnt = makePoint(this.src.length);
    }
    token(ref, val, src, pnt, use, why) {
        let tin;
        let name;
        if ('string' === typeof (ref)) {
            name = ref;
            tin = (0, utility_1.tokenize)(name, this.cfg);
        }
        else {
            tin = ref;
            name = (0, utility_1.tokenize)(ref, this.cfg);
        }
        let tkn = makeToken(name, tin, val, src, pnt || this.pnt, use, why);
        return tkn;
    }
    next(rule) {
        let tkn;
        let pnt = this.pnt;
        if (pnt.end) {
            tkn = pnt.end;
        }
        else if (0 < pnt.token.length) {
            tkn = pnt.token.shift();
        }
        else if (pnt.len <= pnt.sI) {
            pnt.end = this.token('#ZZ', undefined, '', pnt);
            tkn = pnt.end;
        }
        else {
            //for (let mat of this.mat) {
            for (let mat of this.cfg.lex.match) {
                if (tkn = mat(this, rule)) {
                    break;
                }
            }
            tkn = tkn || this.token('#BD', undefined, this.src[pnt.sI], pnt, undefined, 'unexpected');
        }
        if (this.ctx.log) {
            this.ctx.log(utility_1.S.lex, // Log entry prefix.
            (0, utility_1.tokenize)(tkn.tin, this.cfg), // Name of token from tin (token identification numer).
            this.ctx.F(tkn.src), // Format token src for log.
            pnt.sI, // Current source index.
            pnt.rI + ':' + pnt.cI);
        }
        return tkn;
    }
    tokenize(ref) {
        return (0, utility_1.tokenize)(ref, this.cfg);
    }
    bad(why, pstart, pend) {
        return this.token('#BD', undefined, 0 <= pstart && pstart <= pend ?
            this.src.substring(pstart, pend) :
            this.src[this.pnt.sI], undefined, undefined, why);
    }
}
const makeLex = (...params) => new LexImpl(...params);
exports.makeLex = makeLex;
//# sourceMappingURL=lexer.js.map