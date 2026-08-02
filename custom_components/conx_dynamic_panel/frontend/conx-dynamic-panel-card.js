/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const L = globalThis, Z = L.ShadowRoot && (L.ShadyCSS === void 0 || L.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, K = Symbol(), et = /* @__PURE__ */ new WeakMap();
let gt = class {
  constructor(t, e, i) {
    if (this._$cssResult$ = !0, i !== K) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (Z && t === void 0) {
      const i = e !== void 0 && e.length === 1;
      i && (t = et.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && et.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const xt = (s) => new gt(typeof s == "string" ? s : s + "", void 0, K), yt = (s, ...t) => {
  const e = s.length === 1 ? s[0] : t.reduce((i, r, n) => i + ((a) => {
    if (a._$cssResult$ === !0) return a.cssText;
    if (typeof a == "number") return a;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + a + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + s[n + 1], s[0]);
  return new gt(e, s, K);
}, Et = (s, t) => {
  if (Z) s.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const i = document.createElement("style"), r = L.litNonce;
    r !== void 0 && i.setAttribute("nonce", r), i.textContent = e.cssText, s.appendChild(i);
  }
}, it = Z ? (s) => s : (s) => s instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const i of t.cssRules) e += i.cssText;
  return xt(e);
})(s) : s;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Pt, defineProperty: St, getOwnPropertyDescriptor: Ct, getOwnPropertyNames: kt, getOwnPropertySymbols: Ot, getPrototypeOf: Dt } = Object, m = globalThis, st = m.trustedTypes, Ut = st ? st.emptyScript : "", W = m.reactiveElementPolyfillSupport, D = (s, t) => s, z = { toAttribute(s, t) {
  switch (t) {
    case Boolean:
      s = s ? Ut : null;
      break;
    case Object:
    case Array:
      s = s == null ? s : JSON.stringify(s);
  }
  return s;
}, fromAttribute(s, t) {
  let e = s;
  switch (t) {
    case Boolean:
      e = s !== null;
      break;
    case Number:
      e = s === null ? null : Number(s);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(s);
      } catch {
        e = null;
      }
  }
  return e;
} }, Y = (s, t) => !Pt(s, t), rt = { attribute: !0, type: String, converter: z, reflect: !1, useDefault: !1, hasChanged: Y };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), m.litPropertyMetadata ?? (m.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let E = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = rt) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const i = Symbol(), r = this.getPropertyDescriptor(t, i, e);
      r !== void 0 && St(this.prototype, t, r);
    }
  }
  static getPropertyDescriptor(t, e, i) {
    const { get: r, set: n } = Ct(this.prototype, t) ?? { get() {
      return this[e];
    }, set(a) {
      this[e] = a;
    } };
    return { get: r, set(a) {
      const c = r == null ? void 0 : r.call(this);
      n == null || n.call(this, a), this.requestUpdate(t, c, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? rt;
  }
  static _$Ei() {
    if (this.hasOwnProperty(D("elementProperties"))) return;
    const t = Dt(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(D("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(D("properties"))) {
      const e = this.properties, i = [...kt(e), ...Ot(e)];
      for (const r of i) this.createProperty(r, e[r]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const e = litPropertyMetadata.get(t);
      if (e !== void 0) for (const [i, r] of e) this.elementProperties.set(i, r);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [e, i] of this.elementProperties) {
      const r = this._$Eu(e, i);
      r !== void 0 && this._$Eh.set(r, e);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const e = [];
    if (Array.isArray(t)) {
      const i = new Set(t.flat(1 / 0).reverse());
      for (const r of i) e.unshift(it(r));
    } else t !== void 0 && e.push(it(t));
    return e;
  }
  static _$Eu(t, e) {
    const i = e.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var t;
    this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (t = this.constructor.l) == null || t.forEach((e) => e(this));
  }
  addController(t) {
    var e;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(t), this.renderRoot !== void 0 && this.isConnected && ((e = t.hostConnected) == null || e.call(t));
  }
  removeController(t) {
    var e;
    (e = this._$EO) == null || e.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), e = this.constructor.elementProperties;
    for (const i of e.keys()) this.hasOwnProperty(i) && (t.set(i, this[i]), delete this[i]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return Et(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    var t;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (t = this._$EO) == null || t.forEach((e) => {
      var i;
      return (i = e.hostConnected) == null ? void 0 : i.call(e);
    });
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    var t;
    (t = this._$EO) == null || t.forEach((e) => {
      var i;
      return (i = e.hostDisconnected) == null ? void 0 : i.call(e);
    });
  }
  attributeChangedCallback(t, e, i) {
    this._$AK(t, i);
  }
  _$ET(t, e) {
    var n;
    const i = this.constructor.elementProperties.get(t), r = this.constructor._$Eu(t, i);
    if (r !== void 0 && i.reflect === !0) {
      const a = (((n = i.converter) == null ? void 0 : n.toAttribute) !== void 0 ? i.converter : z).toAttribute(e, i.type);
      this._$Em = t, a == null ? this.removeAttribute(r) : this.setAttribute(r, a), this._$Em = null;
    }
  }
  _$AK(t, e) {
    var n, a;
    const i = this.constructor, r = i._$Eh.get(t);
    if (r !== void 0 && this._$Em !== r) {
      const c = i.getPropertyOptions(r), o = typeof c.converter == "function" ? { fromAttribute: c.converter } : ((n = c.converter) == null ? void 0 : n.fromAttribute) !== void 0 ? c.converter : z;
      this._$Em = r;
      const l = o.fromAttribute(e, c.type);
      this[r] = l ?? ((a = this._$Ej) == null ? void 0 : a.get(r)) ?? l, this._$Em = null;
    }
  }
  requestUpdate(t, e, i, r = !1, n) {
    var a;
    if (t !== void 0) {
      const c = this.constructor;
      if (r === !1 && (n = this[t]), i ?? (i = c.getPropertyOptions(t)), !((i.hasChanged ?? Y)(n, e) || i.useDefault && i.reflect && n === ((a = this._$Ej) == null ? void 0 : a.get(t)) && !this.hasAttribute(c._$Eu(t, i)))) return;
      this.C(t, e, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: i, reflect: r, wrapped: n }, a) {
    i && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(t) && (this._$Ej.set(t, a ?? e ?? this[t]), n !== !0 || a !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (e = void 0), this._$AL.set(t, e)), r === !0 && this._$Em !== t && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (e) {
      Promise.reject(e);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var i;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [n, a] of this._$Ep) this[n] = a;
        this._$Ep = void 0;
      }
      const r = this.constructor.elementProperties;
      if (r.size > 0) for (const [n, a] of r) {
        const { wrapped: c } = a, o = this[n];
        c !== !0 || this._$AL.has(n) || o === void 0 || this.C(n, void 0, a, o);
      }
    }
    let t = !1;
    const e = this._$AL;
    try {
      t = this.shouldUpdate(e), t ? (this.willUpdate(e), (i = this._$EO) == null || i.forEach((r) => {
        var n;
        return (n = r.hostUpdate) == null ? void 0 : n.call(r);
      }), this.update(e)) : this._$EM();
    } catch (r) {
      throw t = !1, this._$EM(), r;
    }
    t && this._$AE(e);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    var e;
    (e = this._$EO) == null || e.forEach((i) => {
      var r;
      return (r = i.hostUpdated) == null ? void 0 : r.call(i);
    }), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    this._$Eq && (this._$Eq = this._$Eq.forEach((e) => this._$ET(e, this[e]))), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
E.elementStyles = [], E.shadowRootOptions = { mode: "open" }, E[D("elementProperties")] = /* @__PURE__ */ new Map(), E[D("finalized")] = /* @__PURE__ */ new Map(), W == null || W({ ReactiveElement: E }), (m.reactiveElementVersions ?? (m.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const U = globalThis, at = (s) => s, B = U.trustedTypes, nt = B ? B.createPolicy("lit-html", { createHTML: (s) => s }) : void 0, $t = "$lit$", $ = `lit$${Math.random().toFixed(9).slice(2)}$`, mt = "?" + $, Mt = `<${mt}>`, x = document, M = () => x.createComment(""), N = (s) => s === null || typeof s != "object" && typeof s != "function", G = Array.isArray, Nt = (s) => G(s) || typeof (s == null ? void 0 : s[Symbol.iterator]) == "function", q = `[ 	
\f\r]`, k = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, ot = /-->/g, ct = />/g, b = RegExp(`>|${q}(?:([^\\s"'>=/]+)(${q}*=${q}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), lt = /'/g, dt = /"/g, vt = /^(?:script|style|textarea|title)$/i, Rt = (s) => (t, ...e) => ({ _$litType$: s, strings: t, values: e }), u = Rt(1), S = Symbol.for("lit-noChange"), p = Symbol.for("lit-nothing"), ht = /* @__PURE__ */ new WeakMap(), w = x.createTreeWalker(x, 129);
function bt(s, t) {
  if (!G(s) || !s.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return nt !== void 0 ? nt.createHTML(t) : t;
}
const Ht = (s, t) => {
  const e = s.length - 1, i = [];
  let r, n = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", a = k;
  for (let c = 0; c < e; c++) {
    const o = s[c];
    let l, h, d = -1, f = 0;
    for (; f < o.length && (a.lastIndex = f, h = a.exec(o), h !== null); ) f = a.lastIndex, a === k ? h[1] === "!--" ? a = ot : h[1] !== void 0 ? a = ct : h[2] !== void 0 ? (vt.test(h[2]) && (r = RegExp("</" + h[2], "g")), a = b) : h[3] !== void 0 && (a = b) : a === b ? h[0] === ">" ? (a = r ?? k, d = -1) : h[1] === void 0 ? d = -2 : (d = a.lastIndex - h[2].length, l = h[1], a = h[3] === void 0 ? b : h[3] === '"' ? dt : lt) : a === dt || a === lt ? a = b : a === ot || a === ct ? a = k : (a = b, r = void 0);
    const y = a === b && s[c + 1].startsWith("/>") ? " " : "";
    n += a === k ? o + Mt : d >= 0 ? (i.push(l), o.slice(0, d) + $t + o.slice(d) + $ + y) : o + $ + (d === -2 ? c : y);
  }
  return [bt(s, n + (s[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class R {
  constructor({ strings: t, _$litType$: e }, i) {
    let r;
    this.parts = [];
    let n = 0, a = 0;
    const c = t.length - 1, o = this.parts, [l, h] = Ht(t, e);
    if (this.el = R.createElement(l, i), w.currentNode = this.el.content, e === 2 || e === 3) {
      const d = this.el.content.firstChild;
      d.replaceWith(...d.childNodes);
    }
    for (; (r = w.nextNode()) !== null && o.length < c; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const d of r.getAttributeNames()) if (d.endsWith($t)) {
          const f = h[a++], y = r.getAttribute(d).split($), j = /([.?@])?(.*)/.exec(f);
          o.push({ type: 1, index: n, name: j[2], strings: y, ctor: j[1] === "." ? jt : j[1] === "?" ? Lt : j[1] === "@" ? zt : I }), r.removeAttribute(d);
        } else d.startsWith($) && (o.push({ type: 6, index: n }), r.removeAttribute(d));
        if (vt.test(r.tagName)) {
          const d = r.textContent.split($), f = d.length - 1;
          if (f > 0) {
            r.textContent = B ? B.emptyScript : "";
            for (let y = 0; y < f; y++) r.append(d[y], M()), w.nextNode(), o.push({ type: 2, index: ++n });
            r.append(d[f], M());
          }
        }
      } else if (r.nodeType === 8) if (r.data === mt) o.push({ type: 2, index: n });
      else {
        let d = -1;
        for (; (d = r.data.indexOf($, d + 1)) !== -1; ) o.push({ type: 7, index: n }), d += $.length - 1;
      }
      n++;
    }
  }
  static createElement(t, e) {
    const i = x.createElement("template");
    return i.innerHTML = t, i;
  }
}
function C(s, t, e = s, i) {
  var a, c;
  if (t === S) return t;
  let r = i !== void 0 ? (a = e._$Co) == null ? void 0 : a[i] : e._$Cl;
  const n = N(t) ? void 0 : t._$litDirective$;
  return (r == null ? void 0 : r.constructor) !== n && ((c = r == null ? void 0 : r._$AO) == null || c.call(r, !1), n === void 0 ? r = void 0 : (r = new n(s), r._$AT(s, e, i)), i !== void 0 ? (e._$Co ?? (e._$Co = []))[i] = r : e._$Cl = r), r !== void 0 && (t = C(s, r._$AS(s, t.values), r, i)), t;
}
class Tt {
  constructor(t, e) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = e;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: e }, parts: i } = this._$AD, r = ((t == null ? void 0 : t.creationScope) ?? x).importNode(e, !0);
    w.currentNode = r;
    let n = w.nextNode(), a = 0, c = 0, o = i[0];
    for (; o !== void 0; ) {
      if (a === o.index) {
        let l;
        o.type === 2 ? l = new T(n, n.nextSibling, this, t) : o.type === 1 ? l = new o.ctor(n, o.name, o.strings, this, t) : o.type === 6 && (l = new Bt(n, this, t)), this._$AV.push(l), o = i[++c];
      }
      a !== (o == null ? void 0 : o.index) && (n = w.nextNode(), a++);
    }
    return w.currentNode = x, r;
  }
  p(t) {
    let e = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, e), e += i.strings.length - 2) : i._$AI(t[e])), e++;
  }
}
class T {
  get _$AU() {
    var t;
    return ((t = this._$AM) == null ? void 0 : t._$AU) ?? this._$Cv;
  }
  constructor(t, e, i, r) {
    this.type = 2, this._$AH = p, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = i, this.options = r, this._$Cv = (r == null ? void 0 : r.isConnected) ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const e = this._$AM;
    return e !== void 0 && (t == null ? void 0 : t.nodeType) === 11 && (t = e.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, e = this) {
    t = C(this, t, e), N(t) ? t === p || t == null || t === "" ? (this._$AH !== p && this._$AR(), this._$AH = p) : t !== this._$AH && t !== S && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : Nt(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== p && N(this._$AH) ? this._$AA.nextSibling.data = t : this.T(x.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    var n;
    const { values: e, _$litType$: i } = t, r = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = R.createElement(bt(i.h, i.h[0]), this.options)), i);
    if (((n = this._$AH) == null ? void 0 : n._$AD) === r) this._$AH.p(e);
    else {
      const a = new Tt(r, this), c = a.u(this.options);
      a.p(e), this.T(c), this._$AH = a;
    }
  }
  _$AC(t) {
    let e = ht.get(t.strings);
    return e === void 0 && ht.set(t.strings, e = new R(t)), e;
  }
  k(t) {
    G(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let i, r = 0;
    for (const n of t) r === e.length ? e.push(i = new T(this.O(M()), this.O(M()), this, this.options)) : i = e[r], i._$AI(n), r++;
    r < e.length && (this._$AR(i && i._$AB.nextSibling, r), e.length = r);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    var i;
    for ((i = this._$AP) == null ? void 0 : i.call(this, !1, !0, e); t !== this._$AB; ) {
      const r = at(t).nextSibling;
      at(t).remove(), t = r;
    }
  }
  setConnected(t) {
    var e;
    this._$AM === void 0 && (this._$Cv = t, (e = this._$AP) == null || e.call(this, t));
  }
}
class I {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, i, r, n) {
    this.type = 1, this._$AH = p, this._$AN = void 0, this.element = t, this.name = e, this._$AM = r, this.options = n, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = p;
  }
  _$AI(t, e = this, i, r) {
    const n = this.strings;
    let a = !1;
    if (n === void 0) t = C(this, t, e, 0), a = !N(t) || t !== this._$AH && t !== S, a && (this._$AH = t);
    else {
      const c = t;
      let o, l;
      for (t = n[0], o = 0; o < n.length - 1; o++) l = C(this, c[i + o], e, o), l === S && (l = this._$AH[o]), a || (a = !N(l) || l !== this._$AH[o]), l === p ? t = p : t !== p && (t += (l ?? "") + n[o + 1]), this._$AH[o] = l;
    }
    a && !r && this.j(t);
  }
  j(t) {
    t === p ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class jt extends I {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === p ? void 0 : t;
  }
}
class Lt extends I {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== p);
  }
}
class zt extends I {
  constructor(t, e, i, r, n) {
    super(t, e, i, r, n), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = C(this, t, e, 0) ?? p) === S) return;
    const i = this._$AH, r = t === p && i !== p || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, n = t !== p && (i === p || r);
    r && this.element.removeEventListener(this.name, this, i), n && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    var e;
    typeof this._$AH == "function" ? this._$AH.call(((e = this.options) == null ? void 0 : e.host) ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class Bt {
  constructor(t, e, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    C(this, t);
  }
}
const V = U.litHtmlPolyfillSupport;
V == null || V(R, T), (U.litHtmlVersions ?? (U.litHtmlVersions = [])).push("3.3.3");
const It = (s, t, e) => {
  const i = (e == null ? void 0 : e.renderBefore) ?? t;
  let r = i._$litPart$;
  if (r === void 0) {
    const n = (e == null ? void 0 : e.renderBefore) ?? null;
    i._$litPart$ = r = new T(t.insertBefore(M(), n), n, void 0, e ?? {});
  }
  return r._$AI(s), r;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const A = globalThis;
class P extends E {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var e;
    const t = super.createRenderRoot();
    return (e = this.renderOptions).renderBefore ?? (e.renderBefore = t.firstChild), t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = It(e, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    var t;
    super.connectedCallback(), (t = this._$Do) == null || t.setConnected(!0);
  }
  disconnectedCallback() {
    var t;
    super.disconnectedCallback(), (t = this._$Do) == null || t.setConnected(!1);
  }
  render() {
    return S;
  }
}
var ft;
P._$litElement$ = !0, P.finalized = !0, (ft = A.litElementHydrateSupport) == null || ft.call(A, { LitElement: P });
const X = A.litElementPolyfillSupport;
X == null || X({ LitElement: P });
(A.litElementVersions ?? (A.litElementVersions = [])).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const wt = (s) => (t, e) => {
  e !== void 0 ? e.addInitializer(() => {
    customElements.define(s, t);
  }) : customElements.define(s, t);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Wt = { attribute: !0, type: String, converter: z, reflect: !1, hasChanged: Y }, qt = (s = Wt, t, e) => {
  const { kind: i, metadata: r } = e;
  let n = globalThis.litPropertyMetadata.get(r);
  if (n === void 0 && globalThis.litPropertyMetadata.set(r, n = /* @__PURE__ */ new Map()), i === "setter" && ((s = Object.create(s)).wrapped = !0), n.set(e.name, s), i === "accessor") {
    const { name: a } = e;
    return { set(c) {
      const o = t.get.call(this);
      t.set.call(this, c), this.requestUpdate(a, o, s, !0, c);
    }, init(c) {
      return c !== void 0 && this.C(a, void 0, s, c), c;
    } };
  }
  if (i === "setter") {
    const { name: a } = e;
    return function(c) {
      const o = this[a];
      t.call(this, c), this.requestUpdate(a, o, s, !0, c);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function Q(s) {
  return (t, e) => typeof e == "object" ? qt(s, t, e) : ((i, r, n) => {
    const a = r.hasOwnProperty(n);
    return r.constructor.createProperty(n, i), a ? Object.getOwnPropertyDescriptor(r, n) : void 0;
  })(s, t, e);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function v(s) {
  return Q({ ...s, state: !0, attribute: !1 });
}
async function pt(s, t) {
  return s.callWS({
    type: "conx_dynamic_panel/get_config",
    entry_id: t
  });
}
async function Vt(s, t, e, i) {
  return s.callWS({
    type: "conx_dynamic_panel/update_profile",
    entry_id: t,
    profile_id: e,
    profile: i
  });
}
async function Xt(s, t, e) {
  return s.callWS({
    type: "conx_dynamic_panel/create_profile",
    entry_id: t,
    profile: e
  });
}
async function Jt(s, t, e) {
  await s.callWS({
    type: "conx_dynamic_panel/delete_profile",
    entry_id: t,
    profile_id: e
  });
}
async function Ft(s, t, e, i, r) {
  return s.callWS({
    type: "conx_dynamic_panel/duplicate_profile",
    entry_id: t,
    profile_id: e,
    new_id: i,
    new_name: r
  });
}
async function J(s, t, e, i = !1) {
  return s.callWS({
    type: "conx_dynamic_panel/set_active_profile",
    entry_id: t,
    profile_id: e,
    sync: i
  });
}
async function Zt(s, t) {
  return s.callWS({
    type: "conx_dynamic_panel/sync",
    entry_id: t
  });
}
async function Kt(s, t) {
  return s.callWS({
    type: "conx_dynamic_panel/pull",
    entry_id: t
  });
}
function O(s) {
  return structuredClone(s);
}
function Yt(s, t) {
  return !s || !t ? s === t : JSON.stringify(s) === JSON.stringify(t);
}
const ut = {
  "card.title": "ConX Dynamic Panel",
  "card.sync": "Sync to Panel",
  "card.pull": "Pull from Panel",
  "card.save": "Save Draft",
  "card.discard": "Discard Changes",
  "card.create": "Create",
  "card.duplicate": "Duplicate",
  "card.rename": "Rename",
  "card.delete": "Delete",
  "card.profiles": "Profiles",
  "card.editor": "Profile editor",
  "card.preview": "Live preview",
  "card.status": "Status",
  "card.error": "Error",
  "card.mode": "Mode",
  "card.color_on": "Color ON",
  "card.color_off": "Color OFF",
  "card.radar": "Radar",
  "card.backlight": "Backlight",
  "card.child_lock": "Child lock",
  "card.button": "Button",
  "card.label": "Label",
  "card.action": "Action",
  "card.unsaved": "You have unsaved draft changes.",
  "card.loading": "Loading panel…",
  "card.missing_entry": "Configure an entry_id for this card.",
  "card.compact": "Compact mode",
  "editor.entry_id": "Config entry ID",
  "mode.toggle": "Toggle",
  "mode.radio_mandatory": "Radio mandatory",
  "mode.radio_optional": "Radio optional"
}, Gt = {
  "card.title": "ConX Dynamic Panel",
  "card.sync": "סנכרון לפאנל",
  "card.pull": "משיכה מהפאנל",
  "card.save": "שמור טיוטה",
  "card.discard": "בטל שינויים",
  "card.create": "צור",
  "card.duplicate": "שכפל",
  "card.rename": "שנה שם",
  "card.delete": "מחק",
  "card.profiles": "פרופילים",
  "card.editor": "עורך פרופיל",
  "card.preview": "תצוגה חיה",
  "card.status": "סטטוס",
  "card.error": "שגיאה",
  "card.mode": "מצב",
  "card.color_on": "צבע דלוק",
  "card.color_off": "צבע כבוי",
  "card.radar": "רדאר",
  "card.backlight": "תאורת רקע",
  "card.child_lock": "נעילת ילדים",
  "card.button": "כפתור",
  "card.label": "תווית",
  "card.action": "פעולה",
  "card.unsaved": "יש שינויי טיוטה שלא נשמרו.",
  "card.loading": "טוען פאנל…",
  "card.missing_entry": "יש להגדיר entry_id לכרטיס.",
  "card.compact": "מצב קומפקטי",
  "editor.entry_id": "מזהה רשומת הגדרה",
  "mode.toggle": "החלפה",
  "mode.radio_mandatory": "רדיו חובה",
  "mode.radio_optional": "רדיו אופציונלי"
};
function F(s, t) {
  return ((s || "en").toLowerCase().startsWith("he") ? Gt : ut)[t] || ut[t] || t;
}
function At(s) {
  return (s || "").toLowerCase().startsWith("he");
}
var Qt = Object.defineProperty, te = Object.getOwnPropertyDescriptor, g = (s, t, e, i) => {
  for (var r = i > 1 ? void 0 : i ? te(t, e) : t, n = s.length - 1, a; n >= 0; n--)
    (a = s[n]) && (r = (i ? a(t, e, r) : a(r)) || r);
  return i && r && Qt(t, e, r), r;
};
const _t = {
  red: "#e53935",
  blue: "#1e88e5",
  green: "#43a047",
  white: "#f5f5f5",
  yellow: "#fdd835",
  magenta: "#d81b60",
  cyan: "#00acc1",
  warm_white: "#fff3e0",
  warm_yellow: "#ffb300"
};
let _ = class extends P {
  constructor() {
    super(...arguments), this._loading = !1, this._busy = !1;
  }
  static getConfigElement() {
    return document.createElement("conx-dynamic-panel-card-editor");
  }
  static getStubConfig() {
    return {
      type: "custom:conx-dynamic-panel-card",
      entry_id: "",
      compact: !1
    };
  }
  setConfig(s) {
    if (!s.entry_id)
      throw new Error("entry_id is required");
    this._config = s;
  }
  updated(s) {
    var t;
    (s.has("hass") || s.has("_config")) && this.hass && ((t = this._config) != null && t.entry_id) && !this._panel && !this._loading && this._load();
  }
  get _language() {
    var s, t, e;
    return ((t = (s = this.hass) == null ? void 0 : s.locale) == null ? void 0 : t.language) || ((e = this.hass) == null ? void 0 : e.language) || "en";
  }
  t(s) {
    return F(this._language, s);
  }
  get _dirty() {
    return !Yt(this._draft || null, this._saved || null);
  }
  async _load() {
    var s;
    if (!(!this.hass || !((s = this._config) != null && s.entry_id))) {
      this._loading = !0, this._error = void 0;
      try {
        const t = await pt(this.hass, this._config.entry_id);
        this._applyPanel(t);
      } catch (t) {
        this._error = t instanceof Error ? t.message : String(t);
      } finally {
        this._loading = !1;
      }
    }
  }
  _applyPanel(s) {
    this._panel = s;
    const t = s.active_profile_id, e = t ? s.profiles[t] : void 0;
    this._saved = e ? O(e) : void 0, this._draft = e ? O(e) : void 0;
  }
  async _guardDirty() {
    return this._dirty ? window.confirm(this.t("card.unsaved")) : !0;
  }
  async _selectProfile(s) {
    if (!(!await this._guardDirty() || !this.hass || !this._config)) {
      this._busy = !0;
      try {
        const t = await J(
          this.hass,
          this._config.entry_id,
          s,
          !1
        );
        this._applyPanel(t);
      } catch (t) {
        this._error = t instanceof Error ? t.message : String(t);
      } finally {
        this._busy = !1;
      }
    }
  }
  async _saveDraft() {
    if (!(!this.hass || !this._config || !this._draft)) {
      this._busy = !0, this._error = void 0;
      try {
        const s = await Vt(
          this.hass,
          this._config.entry_id,
          this._draft.id,
          this._draft
        ), t = await pt(this.hass, this._config.entry_id);
        this._applyPanel(t), this._saved = O(s), this._draft = O(s);
      } catch (s) {
        this._error = s instanceof Error ? s.message : String(s);
      } finally {
        this._busy = !1;
      }
    }
  }
  _discard() {
    this._saved && (this._draft = O(this._saved));
  }
  async _sync() {
    if (!(!this.hass || !this._config)) {
      this._dirty && await this._saveDraft(), this._busy = !0, this._error = void 0;
      try {
        const s = await Zt(this.hass, this._config.entry_id);
        this._applyPanel(s);
      } catch (s) {
        this._error = s instanceof Error ? s.message : String(s), this._config && await this._load();
      } finally {
        this._busy = !1;
      }
    }
  }
  async _pull() {
    if (!(!this.hass || !this._config) && await this._guardDirty()) {
      this._busy = !0, this._error = void 0;
      try {
        const s = await Kt(this.hass, this._config.entry_id);
        this._applyPanel(s);
      } catch (s) {
        this._error = s instanceof Error ? s.message : String(s);
      } finally {
        this._busy = !1;
      }
    }
  }
  async _createProfile() {
    if (!this.hass || !this._config || !this._panel || !await this._guardDirty())
      return;
    const s = `profile_${Date.now()}`, t = {
      id: s,
      name: `Profile ${Object.keys(this._panel.profiles).length + 1}`,
      mode: "toggle",
      color_on: "cyan",
      color_off: "blue",
      radar: "30s",
      backlight: !0,
      child_lock: !1,
      selected_button: null,
      buttons: [1, 2, 3, 4].map((e) => ({
        index: e,
        name: `Button ${e}`,
        action: null
      }))
    };
    this._busy = !0;
    try {
      await Xt(this.hass, this._config.entry_id, t);
      const e = await J(
        this.hass,
        this._config.entry_id,
        s,
        !1
      );
      this._applyPanel(e);
    } catch (e) {
      this._error = e instanceof Error ? e.message : String(e);
    } finally {
      this._busy = !1;
    }
  }
  async _duplicateProfile() {
    if (!this.hass || !this._config || !this._draft || !await this._guardDirty())
      return;
    const s = `${this._draft.id}_copy_${Date.now()}`;
    this._busy = !0;
    try {
      await Ft(
        this.hass,
        this._config.entry_id,
        this._draft.id,
        s,
        `${this._draft.name} copy`
      );
      const t = await J(
        this.hass,
        this._config.entry_id,
        s,
        !1
      );
      this._applyPanel(t);
    } catch (t) {
      this._error = t instanceof Error ? t.message : String(t);
    } finally {
      this._busy = !1;
    }
  }
  async _renameProfile() {
    if (!this._draft)
      return;
    const s = window.prompt(this.t("card.rename"), this._draft.name);
    s && (this._draft = { ...this._draft, name: s }, this.requestUpdate());
  }
  async _deleteProfile() {
    if (!(!this.hass || !this._config || !this._draft || !this._panel)) {
      if (Object.keys(this._panel.profiles).length <= 1) {
        this._error = "At least one profile must remain";
        return;
      }
      if (window.confirm(`${this.t("card.delete")} ${this._draft.name}?`)) {
        this._busy = !0;
        try {
          await Jt(this.hass, this._config.entry_id, this._draft.id), await this._load();
        } catch (s) {
          this._error = s instanceof Error ? s.message : String(s);
        } finally {
          this._busy = !1;
        }
      }
    }
  }
  _updateDraft(s) {
    this._draft && (this._draft = { ...this._draft, ...s });
  }
  _updateButton(s, t) {
    if (!this._draft)
      return;
    const e = this._draft.buttons.map(
      (i) => i.index === s ? { ...i, ...t } : i
    );
    this._draft = { ...this._draft, buttons: e };
  }
  render() {
    var e;
    const s = At(this._language);
    if (!((e = this._config) != null && e.entry_id))
      return u`<ha-card><div class="pad">${this.t("card.missing_entry")}</div></ha-card>`;
    if (this._loading && !this._panel)
      return u`<ha-card><div class="pad">${this.t("card.loading")}</div></ha-card>`;
    if (!this._panel || !this._draft)
      return u`<ha-card><div class="pad error">${this._error || this.t("card.loading")}</div></ha-card>`;
    const t = !!this._config.compact;
    return u`
      <ha-card dir=${s ? "rtl" : "ltr"} class=${t ? "compact" : ""}>
        <div class="header">
          <div>
            <div class="title">${this._panel.panel_name}</div>
            <div class="subtitle">${this._draft.name}</div>
          </div>
          <div class="badge status-${this._panel.sync_status}">
            ${this.t("card.status")}: ${this._panel.sync_status}
          </div>
        </div>

        ${this._dirty ? u`<div class="warn">${this.t("card.unsaved")}</div>` : p}
        ${this._error || this._panel.last_error ? u`<div class="error">${this._error || this._panel.last_error}</div>` : p}

        <div class="layout">
          <section>
            <div class="section-title">${this.t("card.profiles")}</div>
            <div class="profile-list">
              ${Object.values(this._panel.profiles).map(
      (i) => {
        var r;
        return u`
                  <button
                    class=${i.id === ((r = this._draft) == null ? void 0 : r.id) ? "active" : ""}
                    ?disabled=${this._busy}
                    @click=${() => this._selectProfile(i.id)}
                  >
                    ${i.name}
                  </button>
                `;
      }
    )}
            </div>
            <div class="row actions">
              <button ?disabled=${this._busy} @click=${this._createProfile}>
                ${this.t("card.create")}
              </button>
              <button ?disabled=${this._busy} @click=${this._duplicateProfile}>
                ${this.t("card.duplicate")}
              </button>
              <button ?disabled=${this._busy} @click=${this._renameProfile}>
                ${this.t("card.rename")}
              </button>
              <button ?disabled=${this._busy} @click=${this._deleteProfile}>
                ${this.t("card.delete")}
              </button>
            </div>
          </section>

          <section>
            <div class="section-title">${this.t("card.editor")}</div>
            <label>
              ${this.t("card.mode")}
              <select
                .value=${this._draft.mode}
                @change=${(i) => this._updateDraft({
      mode: i.target.value
    })}
              >
                ${this._panel.capabilities.modes.map(
      (i) => u`<option value=${i}>${this.t(`mode.${i}`)}</option>`
    )}
              </select>
            </label>
            <div class="grid-2">
              <label>
                ${this.t("card.color_on")}
                <select
                  .value=${this._draft.color_on}
                  @change=${(i) => this._updateDraft({
      color_on: i.target.value
    })}
                >
                  ${this._panel.capabilities.colors.map(
      (i) => u`<option value=${i}>${i}</option>`
    )}
                </select>
              </label>
              <label>
                ${this.t("card.color_off")}
                <select
                  .value=${this._draft.color_off}
                  @change=${(i) => this._updateDraft({
      color_off: i.target.value
    })}
                >
                  ${this._panel.capabilities.colors.map(
      (i) => u`<option value=${i}>${i}</option>`
    )}
                </select>
              </label>
            </div>
            <label>
              ${this.t("card.radar")}
              <select
                .value=${this._draft.radar}
                @change=${(i) => this._updateDraft({
      radar: i.target.value
    })}
              >
                ${this._panel.capabilities.radar.map(
      (i) => u`<option value=${i}>${i}</option>`
    )}
              </select>
            </label>
            <div class="row">
              <label class="check">
                <input
                  type="checkbox"
                  .checked=${this._draft.backlight}
                  @change=${(i) => this._updateDraft({
      backlight: i.target.checked
    })}
                />
                ${this.t("card.backlight")}
              </label>
              <label class="check">
                <input
                  type="checkbox"
                  .checked=${this._draft.child_lock}
                  @change=${(i) => this._updateDraft({
      child_lock: i.target.checked
    })}
                />
                ${this.t("card.child_lock")}
              </label>
            </div>

            ${this._draft.buttons.map(
      (i) => {
        var r, n, a;
        return u`
                <div class="button-edit">
                  <div class="section-title">
                    ${this.t("card.button")} ${i.index}
                  </div>
                  <label>
                    ${this.t("card.label")}
                    <input
                      .value=${i.name}
                      @input=${(c) => this._updateButton(i.index, {
          name: c.target.value
        })}
                    />
                  </label>
                  <label>
                    ${this.t("card.action")}
                    <input
                      .value=${((r = i.action) == null ? void 0 : r.action) || ""}
                      placeholder="light.toggle"
                      @input=${(c) => {
          var l, h;
          const o = c.target.value.trim();
          this._updateButton(i.index, {
            action: o ? {
              action: o,
              target: ((l = i.action) == null ? void 0 : l.target) || {},
              data: ((h = i.action) == null ? void 0 : h.data) || {}
            } : null
          });
        }}
                    />
                  </label>
                  <label>
                    entity_id
                    <input
                      .value=${String(
          ((a = (n = i.action) == null ? void 0 : n.target) == null ? void 0 : a.entity_id) || ""
        )}
                      placeholder="light.living_room"
                      @input=${(c) => {
          var h, d;
          const o = c.target.value.trim(), l = ((h = i.action) == null ? void 0 : h.action) || "";
          this._updateButton(i.index, {
            action: l ? {
              action: l,
              target: o ? { entity_id: o } : {},
              data: ((d = i.action) == null ? void 0 : d.data) || {}
            } : null
          });
        }}
                    />
                  </label>
                </div>
              `;
      }
    )}
          </section>

          <section>
            <div class="section-title">${this.t("card.preview")}</div>
            <div class="preview">
              ${this._draft.buttons.map((i) => {
      const r = _t[this._draft.color_on] || this._draft.color_on, n = _t[this._draft.color_off] || this._draft.color_off, a = this._draft.mode !== "toggle" && this._draft.selected_button === i.index;
      return u`
                  <div
                    class="preview-btn"
                    style="--on:${r}; --off:${n}; background:${a ? "var(--on)" : "var(--off)"}"
                  >
                    ${i.name || `L${i.index}`}
                  </div>
                `;
    })}
            </div>
            <div class="row actions">
              <button class="primary" ?disabled=${this._busy || !this._dirty} @click=${this._saveDraft}>
                ${this.t("card.save")}
              </button>
              <button ?disabled=${this._busy || !this._dirty} @click=${this._discard}>
                ${this.t("card.discard")}
              </button>
              <button class="primary" ?disabled=${this._busy} @click=${this._sync}>
                ${this.t("card.sync")}
              </button>
              <button ?disabled=${this._busy} @click=${this._pull}>
                ${this.t("card.pull")}
              </button>
            </div>
          </section>
        </div>
      </ha-card>
    `;
  }
};
_.styles = yt`
    :host {
      display: block;
    }
    ha-card {
      --conx-gap: 12px;
      padding: 16px;
      background: var(--ha-card-background, var(--card-background-color, #fff));
      color: var(--primary-text-color, inherit);
    }
    .header {
      display: flex;
      justify-content: space-between;
      gap: var(--conx-gap);
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .title {
      font-size: 1.25rem;
      font-weight: 700;
    }
    .subtitle {
      opacity: 0.75;
      margin-top: 2px;
    }
    .badge {
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 0.85rem;
      border: 1px solid var(--divider-color, #ccc);
      text-transform: lowercase;
    }
    .status-synced {
      color: var(--success-color, #2e7d32);
    }
    .status-pending,
    .status-out_of_sync {
      color: var(--warning-color, #ed6c02);
    }
    .status-syncing {
      color: var(--primary-color, #03a9f4);
    }
    .status-error {
      color: var(--error-color, #d32f2f);
    }
    .warn,
    .error {
      padding: 8px 10px;
      border-radius: 8px;
      margin-bottom: 10px;
      font-size: 0.9rem;
    }
    .warn {
      background: color-mix(in srgb, var(--warning-color, #ed6c02) 16%, transparent);
    }
    .error {
      background: color-mix(in srgb, var(--error-color, #d32f2f) 16%, transparent);
      color: var(--error-color, #d32f2f);
    }
    .layout {
      display: grid;
      gap: 16px;
    }
    @media (min-width: 860px) {
      .layout {
        grid-template-columns: 0.9fr 1.3fr 0.9fr;
      }
    }
    .compact .layout {
      grid-template-columns: 1fr;
    }
    .section-title {
      font-weight: 600;
      margin-bottom: 8px;
    }
    .profile-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    button,
    select,
    input {
      font: inherit;
      color: inherit;
      background: var(--secondary-background-color, transparent);
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 8px;
      padding: 8px 10px;
    }
    button {
      cursor: pointer;
    }
    button.active,
    button.primary {
      background: var(--primary-color, #03a9f4);
      color: var(--text-primary-color, #fff);
      border-color: transparent;
    }
    button:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
    label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 8px;
      font-size: 0.9rem;
    }
    .check {
      flex-direction: row;
      align-items: center;
      gap: 8px;
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 8px 0;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .button-edit {
      border-top: 1px solid var(--divider-color, #ccc);
      padding-top: 10px;
      margin-top: 10px;
    }
    .preview {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 12px;
    }
    .preview-btn {
      min-height: 72px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 8px;
      color: #111;
      font-weight: 600;
      border: 1px solid color-mix(in srgb, #000 20%, transparent);
    }
    .pad {
      padding: 16px;
    }
  `;
g([
  Q({ attribute: !1 })
], _.prototype, "hass", 2);
g([
  v()
], _.prototype, "_config", 2);
g([
  v()
], _.prototype, "_panel", 2);
g([
  v()
], _.prototype, "_draft", 2);
g([
  v()
], _.prototype, "_saved", 2);
g([
  v()
], _.prototype, "_error", 2);
g([
  v()
], _.prototype, "_loading", 2);
g([
  v()
], _.prototype, "_busy", 2);
_ = g([
  wt("conx-dynamic-panel-card")
], _);
var ee = Object.defineProperty, ie = Object.getOwnPropertyDescriptor, tt = (s, t, e, i) => {
  for (var r = i > 1 ? void 0 : i ? ie(t, e) : t, n = s.length - 1, a; n >= 0; n--)
    (a = s[n]) && (r = (i ? a(t, e, r) : a(r)) || r);
  return i && r && ee(t, e, r), r;
};
let H = class extends P {
  setConfig(s) {
    this._config = s;
  }
  get _language() {
    var s, t, e;
    return ((t = (s = this.hass) == null ? void 0 : s.locale) == null ? void 0 : t.language) || ((e = this.hass) == null ? void 0 : e.language) || "en";
  }
  _valueChanged(s) {
    if (!this._config)
      return;
    const t = { ...this._config, ...s };
    this._config = t, this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: t },
        bubbles: !0,
        composed: !0
      })
    );
  }
  render() {
    if (!this._config)
      return u``;
    const s = At(this._language);
    return u`
      <div class="editor" dir=${s ? "rtl" : "ltr"}>
        <label>
          ${F(this._language, "editor.entry_id")}
          <input
            .value=${this._config.entry_id || ""}
            @input=${(t) => this._valueChanged({
      entry_id: t.target.value.trim()
    })}
          />
        </label>
        <label class="check">
          <input
            type="checkbox"
            .checked=${!!this._config.compact}
            @change=${(t) => this._valueChanged({
      compact: t.target.checked
    })}
          />
          ${F(this._language, "card.compact")}
        </label>
      </div>
    `;
  }
};
H.styles = yt`
    .editor {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 8px 0;
    }
    label {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .check {
      flex-direction: row;
      align-items: center;
      gap: 8px;
    }
    input[type="text"],
    input:not([type]),
    input[type=""] {
      font: inherit;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid var(--divider-color, #ccc);
      background: var(--secondary-background-color, transparent);
      color: inherit;
    }
  `;
tt([
  Q({ attribute: !1 })
], H.prototype, "hass", 2);
tt([
  v()
], H.prototype, "_config", 2);
H = tt([
  wt("conx-dynamic-panel-card-editor")
], H);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "conx-dynamic-panel-card",
  name: "ConX Dynamic Panel Card",
  description: "Private ConX card for multi-profile smart panels",
  preview: !0
});
//# sourceMappingURL=conx-dynamic-panel-card.js.map
