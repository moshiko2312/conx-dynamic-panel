/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const j = globalThis, Z = j.ShadowRoot && (j.ShadyCSS === void 0 || j.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, K = Symbol(), rt = /* @__PURE__ */ new WeakMap();
let _t = class {
  constructor(t, e, r) {
    if (this._$cssResult$ = !0, r !== K) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (Z && t === void 0) {
      const r = e !== void 0 && e.length === 1;
      r && (t = rt.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), r && rt.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const Ct = (i) => new _t(typeof i == "string" ? i : i + "", void 0, K), bt = (i, ...t) => {
  const e = i.length === 1 ? i[0] : t.reduce((r, s, a) => r + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s) + i[a + 1], i[0]);
  return new _t(e, i, K);
}, Ot = (i, t) => {
  if (Z) i.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const r = document.createElement("style"), s = j.litNonce;
    s !== void 0 && r.setAttribute("nonce", s), r.textContent = e.cssText, i.appendChild(r);
  }
}, st = Z ? (i) => i : (i) => i instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const r of t.cssRules) e += r.cssText;
  return Ct(e);
})(i) : i;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Dt, defineProperty: Rt, getOwnPropertyDescriptor: Ut, getOwnPropertyNames: It, getOwnPropertySymbols: Nt, getPrototypeOf: Lt } = Object, x = globalThis, at = x.trustedTypes, Tt = at ? at.emptyScript : "", J = x.reactiveElementPolyfillSupport, D = (i, t) => i, W = { toAttribute(i, t) {
  switch (t) {
    case Boolean:
      i = i ? Tt : null;
      break;
    case Object:
    case Array:
      i = i == null ? i : JSON.stringify(i);
  }
  return i;
}, fromAttribute(i, t) {
  let e = i;
  switch (t) {
    case Boolean:
      e = i !== null;
      break;
    case Number:
      e = i === null ? null : Number(i);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(i);
      } catch {
        e = null;
      }
  }
  return e;
} }, Q = (i, t) => !Dt(i, t), nt = { attribute: !0, type: String, converter: W, reflect: !1, useDefault: !1, hasChanged: Q };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), x.litPropertyMetadata ?? (x.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let E = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = nt) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const r = Symbol(), s = this.getPropertyDescriptor(t, r, e);
      s !== void 0 && Rt(this.prototype, t, s);
    }
  }
  static getPropertyDescriptor(t, e, r) {
    const { get: s, set: a } = Ut(this.prototype, t) ?? { get() {
      return this[e];
    }, set(n) {
      this[e] = n;
    } };
    return { get: s, set(n) {
      const o = s == null ? void 0 : s.call(this);
      a == null || a.call(this, n), this.requestUpdate(t, o, r);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? nt;
  }
  static _$Ei() {
    if (this.hasOwnProperty(D("elementProperties"))) return;
    const t = Lt(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(D("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(D("properties"))) {
      const e = this.properties, r = [...It(e), ...Nt(e)];
      for (const s of r) this.createProperty(s, e[s]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const e = litPropertyMetadata.get(t);
      if (e !== void 0) for (const [r, s] of e) this.elementProperties.set(r, s);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [e, r] of this.elementProperties) {
      const s = this._$Eu(e, r);
      s !== void 0 && this._$Eh.set(s, e);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const e = [];
    if (Array.isArray(t)) {
      const r = new Set(t.flat(1 / 0).reverse());
      for (const s of r) e.unshift(st(s));
    } else t !== void 0 && e.push(st(t));
    return e;
  }
  static _$Eu(t, e) {
    const r = e.attribute;
    return r === !1 ? void 0 : typeof r == "string" ? r : typeof t == "string" ? t.toLowerCase() : void 0;
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
    for (const r of e.keys()) this.hasOwnProperty(r) && (t.set(r, this[r]), delete this[r]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return Ot(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    var t;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (t = this._$EO) == null || t.forEach((e) => {
      var r;
      return (r = e.hostConnected) == null ? void 0 : r.call(e);
    });
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    var t;
    (t = this._$EO) == null || t.forEach((e) => {
      var r;
      return (r = e.hostDisconnected) == null ? void 0 : r.call(e);
    });
  }
  attributeChangedCallback(t, e, r) {
    this._$AK(t, r);
  }
  _$ET(t, e) {
    var a;
    const r = this.constructor.elementProperties.get(t), s = this.constructor._$Eu(t, r);
    if (s !== void 0 && r.reflect === !0) {
      const n = (((a = r.converter) == null ? void 0 : a.toAttribute) !== void 0 ? r.converter : W).toAttribute(e, r.type);
      this._$Em = t, n == null ? this.removeAttribute(s) : this.setAttribute(s, n), this._$Em = null;
    }
  }
  _$AK(t, e) {
    var a, n;
    const r = this.constructor, s = r._$Eh.get(t);
    if (s !== void 0 && this._$Em !== s) {
      const o = r.getPropertyOptions(s), c = typeof o.converter == "function" ? { fromAttribute: o.converter } : ((a = o.converter) == null ? void 0 : a.fromAttribute) !== void 0 ? o.converter : W;
      this._$Em = s;
      const h = c.fromAttribute(e, o.type);
      this[s] = h ?? ((n = this._$Ej) == null ? void 0 : n.get(s)) ?? h, this._$Em = null;
    }
  }
  requestUpdate(t, e, r, s = !1, a) {
    var n;
    if (t !== void 0) {
      const o = this.constructor;
      if (s === !1 && (a = this[t]), r ?? (r = o.getPropertyOptions(t)), !((r.hasChanged ?? Q)(a, e) || r.useDefault && r.reflect && a === ((n = this._$Ej) == null ? void 0 : n.get(t)) && !this.hasAttribute(o._$Eu(t, r)))) return;
      this.C(t, e, r);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: r, reflect: s, wrapped: a }, n) {
    r && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(t) && (this._$Ej.set(t, n ?? e ?? this[t]), a !== !0 || n !== void 0) || (this._$AL.has(t) || (this.hasUpdated || r || (e = void 0), this._$AL.set(t, e)), s === !0 && this._$Em !== t && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(t));
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
    var r;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [a, n] of this._$Ep) this[a] = n;
        this._$Ep = void 0;
      }
      const s = this.constructor.elementProperties;
      if (s.size > 0) for (const [a, n] of s) {
        const { wrapped: o } = n, c = this[a];
        o !== !0 || this._$AL.has(a) || c === void 0 || this.C(a, void 0, n, c);
      }
    }
    let t = !1;
    const e = this._$AL;
    try {
      t = this.shouldUpdate(e), t ? (this.willUpdate(e), (r = this._$EO) == null || r.forEach((s) => {
        var a;
        return (a = s.hostUpdate) == null ? void 0 : a.call(s);
      }), this.update(e)) : this._$EM();
    } catch (s) {
      throw t = !1, this._$EM(), s;
    }
    t && this._$AE(e);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    var e;
    (e = this._$EO) == null || e.forEach((r) => {
      var s;
      return (s = r.hostUpdated) == null ? void 0 : s.call(r);
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
E.elementStyles = [], E.shadowRootOptions = { mode: "open" }, E[D("elementProperties")] = /* @__PURE__ */ new Map(), E[D("finalized")] = /* @__PURE__ */ new Map(), J == null || J({ ReactiveElement: E }), (x.reactiveElementVersions ?? (x.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const R = globalThis, ot = (i) => i, F = R.trustedTypes, ct = F ? F.createPolicy("lit-html", { createHTML: (i) => i }) : void 0, mt = "$lit$", y = `lit$${Math.random().toFixed(9).slice(2)}$`, yt = "?" + y, Mt = `<${yt}>`, A = document, U = () => A.createComment(""), I = (i) => i === null || typeof i != "object" && typeof i != "function", tt = Array.isArray, Ht = (i) => tt(i) || typeof (i == null ? void 0 : i[Symbol.iterator]) == "function", X = `[ 	
\f\r]`, C = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, lt = /-->/g, dt = />/g, v = RegExp(`>|${X}(?:([^\\s"'>=/]+)(${X}*=${X}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), pt = /'/g, ht = /"/g, xt = /^(?:script|style|textarea|title)$/i, zt = (i) => (t, ...e) => ({ _$litType$: i, strings: t, values: e }), l = zt(1), S = Symbol.for("lit-noChange"), p = Symbol.for("lit-nothing"), ft = /* @__PURE__ */ new WeakMap(), $ = A.createTreeWalker(A, 129);
function vt(i, t) {
  if (!tt(i) || !i.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return ct !== void 0 ? ct.createHTML(t) : t;
}
const jt = (i, t) => {
  const e = i.length - 1, r = [];
  let s, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", n = C;
  for (let o = 0; o < e; o++) {
    const c = i[o];
    let h, f, d = -1, b = 0;
    for (; b < c.length && (n.lastIndex = b, f = n.exec(c), f !== null); ) b = n.lastIndex, n === C ? f[1] === "!--" ? n = lt : f[1] !== void 0 ? n = dt : f[2] !== void 0 ? (xt.test(f[2]) && (s = RegExp("</" + f[2], "g")), n = v) : f[3] !== void 0 && (n = v) : n === v ? f[0] === ">" ? (n = s ?? C, d = -1) : f[1] === void 0 ? d = -2 : (d = n.lastIndex - f[2].length, h = f[1], n = f[3] === void 0 ? v : f[3] === '"' ? ht : pt) : n === ht || n === pt ? n = v : n === lt || n === dt ? n = C : (n = v, s = void 0);
    const m = n === v && i[o + 1].startsWith("/>") ? " " : "";
    a += n === C ? c + Mt : d >= 0 ? (r.push(h), c.slice(0, d) + mt + c.slice(d) + y + m) : c + y + (d === -2 ? o : m);
  }
  return [vt(i, a + (i[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
};
class N {
  constructor({ strings: t, _$litType$: e }, r) {
    let s;
    this.parts = [];
    let a = 0, n = 0;
    const o = t.length - 1, c = this.parts, [h, f] = jt(t, e);
    if (this.el = N.createElement(h, r), $.currentNode = this.el.content, e === 2 || e === 3) {
      const d = this.el.content.firstChild;
      d.replaceWith(...d.childNodes);
    }
    for (; (s = $.nextNode()) !== null && c.length < o; ) {
      if (s.nodeType === 1) {
        if (s.hasAttributes()) for (const d of s.getAttributeNames()) if (d.endsWith(mt)) {
          const b = f[n++], m = s.getAttribute(d).split(y), H = /([.?@])?(.*)/.exec(b);
          c.push({ type: 1, index: a, name: H[2], strings: m, ctor: H[1] === "." ? Wt : H[1] === "?" ? Ft : H[1] === "@" ? qt : q }), s.removeAttribute(d);
        } else d.startsWith(y) && (c.push({ type: 6, index: a }), s.removeAttribute(d));
        if (xt.test(s.tagName)) {
          const d = s.textContent.split(y), b = d.length - 1;
          if (b > 0) {
            s.textContent = F ? F.emptyScript : "";
            for (let m = 0; m < b; m++) s.append(d[m], U()), $.nextNode(), c.push({ type: 2, index: ++a });
            s.append(d[b], U());
          }
        }
      } else if (s.nodeType === 8) if (s.data === yt) c.push({ type: 2, index: a });
      else {
        let d = -1;
        for (; (d = s.data.indexOf(y, d + 1)) !== -1; ) c.push({ type: 7, index: a }), d += y.length - 1;
      }
      a++;
    }
  }
  static createElement(t, e) {
    const r = A.createElement("template");
    return r.innerHTML = t, r;
  }
}
function P(i, t, e = i, r) {
  var n, o;
  if (t === S) return t;
  let s = r !== void 0 ? (n = e._$Co) == null ? void 0 : n[r] : e._$Cl;
  const a = I(t) ? void 0 : t._$litDirective$;
  return (s == null ? void 0 : s.constructor) !== a && ((o = s == null ? void 0 : s._$AO) == null || o.call(s, !1), a === void 0 ? s = void 0 : (s = new a(i), s._$AT(i, e, r)), r !== void 0 ? (e._$Co ?? (e._$Co = []))[r] = s : e._$Cl = s), s !== void 0 && (t = P(i, s._$AS(i, t.values), s, r)), t;
}
class Bt {
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
    const { el: { content: e }, parts: r } = this._$AD, s = ((t == null ? void 0 : t.creationScope) ?? A).importNode(e, !0);
    $.currentNode = s;
    let a = $.nextNode(), n = 0, o = 0, c = r[0];
    for (; c !== void 0; ) {
      if (n === c.index) {
        let h;
        c.type === 2 ? h = new M(a, a.nextSibling, this, t) : c.type === 1 ? h = new c.ctor(a, c.name, c.strings, this, t) : c.type === 6 && (h = new Jt(a, this, t)), this._$AV.push(h), c = r[++o];
      }
      n !== (c == null ? void 0 : c.index) && (a = $.nextNode(), n++);
    }
    return $.currentNode = A, s;
  }
  p(t) {
    let e = 0;
    for (const r of this._$AV) r !== void 0 && (r.strings !== void 0 ? (r._$AI(t, r, e), e += r.strings.length - 2) : r._$AI(t[e])), e++;
  }
}
class M {
  get _$AU() {
    var t;
    return ((t = this._$AM) == null ? void 0 : t._$AU) ?? this._$Cv;
  }
  constructor(t, e, r, s) {
    this.type = 2, this._$AH = p, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = r, this.options = s, this._$Cv = (s == null ? void 0 : s.isConnected) ?? !0;
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
    t = P(this, t, e), I(t) ? t === p || t == null || t === "" ? (this._$AH !== p && this._$AR(), this._$AH = p) : t !== this._$AH && t !== S && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : Ht(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== p && I(this._$AH) ? this._$AA.nextSibling.data = t : this.T(A.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    var a;
    const { values: e, _$litType$: r } = t, s = typeof r == "number" ? this._$AC(t) : (r.el === void 0 && (r.el = N.createElement(vt(r.h, r.h[0]), this.options)), r);
    if (((a = this._$AH) == null ? void 0 : a._$AD) === s) this._$AH.p(e);
    else {
      const n = new Bt(s, this), o = n.u(this.options);
      n.p(e), this.T(o), this._$AH = n;
    }
  }
  _$AC(t) {
    let e = ft.get(t.strings);
    return e === void 0 && ft.set(t.strings, e = new N(t)), e;
  }
  k(t) {
    tt(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let r, s = 0;
    for (const a of t) s === e.length ? e.push(r = new M(this.O(U()), this.O(U()), this, this.options)) : r = e[s], r._$AI(a), s++;
    s < e.length && (this._$AR(r && r._$AB.nextSibling, s), e.length = s);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    var r;
    for ((r = this._$AP) == null ? void 0 : r.call(this, !1, !0, e); t !== this._$AB; ) {
      const s = ot(t).nextSibling;
      ot(t).remove(), t = s;
    }
  }
  setConnected(t) {
    var e;
    this._$AM === void 0 && (this._$Cv = t, (e = this._$AP) == null || e.call(this, t));
  }
}
class q {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, r, s, a) {
    this.type = 1, this._$AH = p, this._$AN = void 0, this.element = t, this.name = e, this._$AM = s, this.options = a, r.length > 2 || r[0] !== "" || r[1] !== "" ? (this._$AH = Array(r.length - 1).fill(new String()), this.strings = r) : this._$AH = p;
  }
  _$AI(t, e = this, r, s) {
    const a = this.strings;
    let n = !1;
    if (a === void 0) t = P(this, t, e, 0), n = !I(t) || t !== this._$AH && t !== S, n && (this._$AH = t);
    else {
      const o = t;
      let c, h;
      for (t = a[0], c = 0; c < a.length - 1; c++) h = P(this, o[r + c], e, c), h === S && (h = this._$AH[c]), n || (n = !I(h) || h !== this._$AH[c]), h === p ? t = p : t !== p && (t += (h ?? "") + a[c + 1]), this._$AH[c] = h;
    }
    n && !s && this.j(t);
  }
  j(t) {
    t === p ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class Wt extends q {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === p ? void 0 : t;
  }
}
class Ft extends q {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== p);
  }
}
class qt extends q {
  constructor(t, e, r, s, a) {
    super(t, e, r, s, a), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = P(this, t, e, 0) ?? p) === S) return;
    const r = this._$AH, s = t === p && r !== p || t.capture !== r.capture || t.once !== r.once || t.passive !== r.passive, a = t !== p && (r === p || s);
    s && this.element.removeEventListener(this.name, this, r), a && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    var e;
    typeof this._$AH == "function" ? this._$AH.call(((e = this.options) == null ? void 0 : e.host) ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class Jt {
  constructor(t, e, r) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = r;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    P(this, t);
  }
}
const V = R.litHtmlPolyfillSupport;
V == null || V(N, M), (R.litHtmlVersions ?? (R.litHtmlVersions = [])).push("3.3.3");
const Xt = (i, t, e) => {
  const r = (e == null ? void 0 : e.renderBefore) ?? t;
  let s = r._$litPart$;
  if (s === void 0) {
    const a = (e == null ? void 0 : e.renderBefore) ?? null;
    r._$litPart$ = s = new M(t.insertBefore(U(), a), a, void 0, e ?? {});
  }
  return s._$AI(i), s;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const w = globalThis;
class k extends E {
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
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Xt(e, this.renderRoot, this.renderOptions);
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
var gt;
k._$litElement$ = !0, k.finalized = !0, (gt = w.litElementHydrateSupport) == null || gt.call(w, { LitElement: k });
const G = w.litElementPolyfillSupport;
G == null || G({ LitElement: k });
(w.litElementVersions ?? (w.litElementVersions = [])).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const $t = (i) => (t, e) => {
  e !== void 0 ? e.addInitializer(() => {
    customElements.define(i, t);
  }) : customElements.define(i, t);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Vt = { attribute: !0, type: String, converter: W, reflect: !1, hasChanged: Q }, Gt = (i = Vt, t, e) => {
  const { kind: r, metadata: s } = e;
  let a = globalThis.litPropertyMetadata.get(s);
  if (a === void 0 && globalThis.litPropertyMetadata.set(s, a = /* @__PURE__ */ new Map()), r === "setter" && ((i = Object.create(i)).wrapped = !0), a.set(e.name, i), r === "accessor") {
    const { name: n } = e;
    return { set(o) {
      const c = t.get.call(this);
      t.set.call(this, o), this.requestUpdate(n, c, i, !0, o);
    }, init(o) {
      return o !== void 0 && this.C(n, void 0, i, o), o;
    } };
  }
  if (r === "setter") {
    const { name: n } = e;
    return function(o) {
      const c = this[n];
      t.call(this, o), this.requestUpdate(n, c, i, !0, o);
    };
  }
  throw Error("Unsupported decorator location: " + r);
};
function et(i) {
  return (t, e) => typeof e == "object" ? Gt(i, t, e) : ((r, s, a) => {
    const n = s.hasOwnProperty(a);
    return s.constructor.createProperty(a, r), n ? Object.getOwnPropertyDescriptor(s, a) : void 0;
  })(i, t, e);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function _(i) {
  return et({ ...i, state: !0, attribute: !1 });
}
async function ut(i, t) {
  return i.callWS({
    type: "conx_dynamic_panel/get_config",
    entry_id: t
  });
}
async function Yt(i, t, e, r) {
  return i.callWS({
    type: "conx_dynamic_panel/update_profile",
    entry_id: t,
    profile_id: e,
    profile: r
  });
}
async function Zt(i, t, e) {
  return i.callWS({
    type: "conx_dynamic_panel/create_profile",
    entry_id: t,
    profile: e
  });
}
async function Kt(i, t, e) {
  await i.callWS({
    type: "conx_dynamic_panel/delete_profile",
    entry_id: t,
    profile_id: e
  });
}
async function Qt(i, t, e, r, s) {
  return i.callWS({
    type: "conx_dynamic_panel/duplicate_profile",
    entry_id: t,
    profile_id: e,
    new_id: r,
    new_name: s
  });
}
async function Y(i, t, e, r = !1) {
  return i.callWS({
    type: "conx_dynamic_panel/set_active_profile",
    entry_id: t,
    profile_id: e,
    sync: r
  });
}
async function te(i, t) {
  return i.callWS({
    type: "conx_dynamic_panel/sync",
    entry_id: t
  });
}
async function ee(i, t) {
  return i.callWS({
    type: "conx_dynamic_panel/pull",
    entry_id: t
  });
}
async function ie(i, t) {
  return i.callWS({
    type: "conx_dynamic_panel/export_profiles",
    entry_id: t
  });
}
async function re(i, t, e, r = "merge") {
  return i.callWS({
    type: "conx_dynamic_panel/import_profiles",
    entry_id: t,
    payload: e,
    mode: r
  });
}
function O(i) {
  return structuredClone(i);
}
function se(i, t) {
  return !i || !t ? i === t : JSON.stringify(i) === JSON.stringify(t);
}
function ae(i, t) {
  const e = new Blob([JSON.stringify(t, null, 2)], {
    type: "application/json"
  }), r = URL.createObjectURL(e), s = document.createElement("a");
  s.href = r, s.download = i, s.click(), URL.revokeObjectURL(r);
}
const wt = "conx-dynamic-panel-lang", At = {}, Et = {
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
  "card.editor": "Appearance",
  "card.buttons": "Buttons",
  "card.preview": "Panel preview",
  "card.actions": "Actions",
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
  "card.entity_id": "Entity ID",
  "card.unsaved": "You have unsaved draft changes.",
  "card.loading": "Loading panel…",
  "card.missing_entry": "Configure an entry_id for this card.",
  "card.compact": "Compact mode",
  "card.language": "Language",
  "card.import": "Import",
  "card.export": "Export",
  "card.import_merge": "Import (merge)",
  "card.import_replace": "Import (replace)",
  "card.import_ok": "Profiles imported.",
  "card.export_ok": "Profiles exported.",
  "card.import_invalid": "Invalid profiles JSON file.",
  "card.section_toggle": "Show section",
  "card.activate": "Activate",
  "card.profile_name": "Profile name",
  "editor.entry_id": "Config entry ID",
  "mode.toggle": "Toggle",
  "mode.radio_mandatory": "Radio mandatory",
  "mode.radio_optional": "Radio optional"
}, ne = {
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
  "card.editor": "מראה",
  "card.buttons": "כפתורים",
  "card.preview": "תצוגת פאנל",
  "card.actions": "פעולות",
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
  "card.entity_id": "מזהה ישות",
  "card.unsaved": "יש שינויי טיוטה שלא נשמרו.",
  "card.loading": "טוען פאנל…",
  "card.missing_entry": "יש להגדיר entry_id לכרטיס.",
  "card.compact": "מצב קומפקטי",
  "card.language": "שפה",
  "card.import": "ייבוא",
  "card.export": "ייצוא",
  "card.import_merge": "ייבוא (מיזוג)",
  "card.import_replace": "ייבוא (החלפה)",
  "card.import_ok": "הפרופילים יובאו.",
  "card.export_ok": "הפרופילים יוצאו.",
  "card.import_invalid": "קובץ JSON של פרופילים לא תקין.",
  "card.section_toggle": "הצג מקטע",
  "card.activate": "הפעל",
  "card.profile_name": "שם פרופיל",
  "editor.entry_id": "מזהה רשומת הגדרה",
  "mode.toggle": "החלפה",
  "mode.radio_mandatory": "רדיו חובה",
  "mode.radio_optional": "רדיו אופציונלי"
}, oe = {
  "card.title": "ConX Dynamic Panel",
  "card.sync": "Синхронизация",
  "card.pull": "Считать с панели",
  "card.save": "Сохранить черновик",
  "card.discard": "Отменить изменения",
  "card.create": "Создать",
  "card.duplicate": "Дублировать",
  "card.rename": "Переименовать",
  "card.delete": "Удалить",
  "card.profiles": "Профили",
  "card.editor": "Внешний вид",
  "card.buttons": "Кнопки",
  "card.preview": "Превью панели",
  "card.actions": "Действия",
  "card.status": "Статус",
  "card.error": "Ошибка",
  "card.mode": "Режим",
  "card.color_on": "Цвет ВКЛ",
  "card.color_off": "Цвет ВЫКЛ",
  "card.radar": "Радар",
  "card.backlight": "Подсветка",
  "card.child_lock": "Блокировка",
  "card.button": "Кнопка",
  "card.label": "Название",
  "card.action": "Действие",
  "card.entity_id": "Entity ID",
  "card.unsaved": "Есть несохранённые изменения черновика.",
  "card.loading": "Загрузка панели…",
  "card.missing_entry": "Укажите entry_id для карточки.",
  "card.compact": "Компактный режим",
  "card.language": "Язык",
  "card.import": "Импорт",
  "card.export": "Экспорт",
  "card.import_merge": "Импорт (слияние)",
  "card.import_replace": "Импорт (замена)",
  "card.import_ok": "Профили импортированы.",
  "card.export_ok": "Профили экспортированы.",
  "card.import_invalid": "Некорректный JSON файл профилей.",
  "card.section_toggle": "Показать раздел",
  "card.activate": "Активировать",
  "card.profile_name": "Имя профиля",
  "editor.entry_id": "ID записи конфигурации",
  "mode.toggle": "Переключатель",
  "mode.radio_mandatory": "Радио (обязательно)",
  "mode.radio_optional": "Радио (опционально)"
}, ce = {
  en: Et,
  he: ne,
  ru: oe
}, kt = [
  { id: "he", label: "עברית", flag: "IL" },
  { id: "en", label: "English", flag: "GB" },
  { id: "ru", label: "Русский", flag: "RU" }
];
function L(i) {
  const t = (i || "en").toLowerCase();
  return t.startsWith("he") || t.startsWith("iw") ? "he" : t.startsWith("ru") ? "ru" : "en";
}
function le() {
  var i, t;
  try {
    const e = (t = (i = globalThis.localStorage) == null ? void 0 : i.getItem) == null ? void 0 : t.call(i, wt);
    if (e === "en" || e === "he" || e === "ru")
      return e;
  } catch {
  }
  return At.language || null;
}
function de(i) {
  var t, e;
  At.language = i;
  try {
    (e = (t = globalThis.localStorage) == null ? void 0 : t.setItem) == null || e.call(t, wt, i);
  } catch {
  }
}
function B(i, t) {
  const e = L(i);
  return ce[e][t] || Et[t] || t;
}
function St(i) {
  return L(i) === "he";
}
var pe = Object.defineProperty, he = Object.getOwnPropertyDescriptor, g = (i, t, e, r) => {
  for (var s = r > 1 ? void 0 : r ? he(t, e) : t, a = i.length - 1, n; a >= 0; a--)
    (n = i[a]) && (s = (r ? n(t, e, s) : n(s)) || s);
  return r && s && pe(t, e, s), s;
};
const fe = {
  red: "#ff1744",
  blue: "#2979ff",
  green: "#00e676",
  white: "#f5f7fa",
  yellow: "#ffea00",
  magenta: "#f50057",
  cyan: "#00e5ff",
  warm_white: "#ffe0b2",
  warm_yellow: "#ffc400"
}, Pt = "#00e5ff", ue = "#2979ff";
function z(i, t = Pt) {
  return i && (fe[i] || i) || t;
}
let u = class extends k {
  constructor() {
    super(...arguments), this._loading = !1, this._busy = !1, this._syncPulse = !1, this._pressedRing = null, this._sections = {
      profiles: !0,
      appearance: !0,
      buttons: !0,
      preview: !0,
      actions: !0
    };
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
  setConfig(i) {
    if (!i.entry_id)
      throw new Error("entry_id is required");
    this._config = i, i.language && (this._uiLang = L(i.language));
  }
  connectedCallback() {
    super.connectedCallback(), this._uiLang || (this._uiLang = le() || void 0), this._ensureFonts();
  }
  _ensureFonts() {
    const i = "conx-dynamic-panel-fonts";
    if (document.getElementById(i))
      return;
    const t = document.createElement("link");
    t.id = i, t.rel = "stylesheet", t.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Sora:wght@500;600;700&display=swap", document.head.appendChild(t);
  }
  updated(i) {
    var t;
    (i.has("hass") || i.has("_config")) && this.hass && ((t = this._config) != null && t.entry_id) && !this._panel && !this._loading && this._load();
  }
  get _language() {
    var i, t, e;
    return this._uiLang ? this._uiLang : L(
      ((t = (i = this.hass) == null ? void 0 : i.locale) == null ? void 0 : t.language) || ((e = this.hass) == null ? void 0 : e.language) || "en"
    );
  }
  t(i) {
    return B(this._language, i);
  }
  get _dirty() {
    return !se(this._draft || null, this._saved || null);
  }
  _setLanguage(i) {
    this._uiLang = i, de(i);
  }
  _toggleSection(i) {
    this._sections = { ...this._sections, [i]: !this._sections[i] };
  }
  async _load() {
    var i;
    if (!(!this.hass || !((i = this._config) != null && i.entry_id))) {
      this._loading = !0, this._error = void 0;
      try {
        const t = await ut(this.hass, this._config.entry_id);
        this._applyPanel(t);
      } catch (t) {
        this._error = t instanceof Error ? t.message : String(t);
      } finally {
        this._loading = !1;
      }
    }
  }
  _applyPanel(i) {
    this._panel = i;
    const t = i.active_profile_id, e = t ? i.profiles[t] : void 0;
    this._saved = e ? O(e) : void 0, this._draft = e ? O(e) : void 0;
  }
  async _guardDirty() {
    return this._dirty ? window.confirm(this.t("card.unsaved")) : !0;
  }
  async _selectProfile(i) {
    if (!(!await this._guardDirty() || !this.hass || !this._config)) {
      this._busy = !0;
      try {
        const t = await Y(
          this.hass,
          this._config.entry_id,
          i,
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
        const i = await Yt(
          this.hass,
          this._config.entry_id,
          this._draft.id,
          this._draft
        ), t = await ut(this.hass, this._config.entry_id);
        this._applyPanel(t), this._saved = O(i), this._draft = O(i);
      } catch (i) {
        this._error = i instanceof Error ? i.message : String(i);
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
      this._dirty && await this._saveDraft(), this._busy = !0, this._error = void 0, this._syncPulse = !0;
      try {
        const i = await te(this.hass, this._config.entry_id);
        this._applyPanel(i);
      } catch (i) {
        this._error = i instanceof Error ? i.message : String(i), this._config && await this._load();
      } finally {
        this._busy = !1, window.setTimeout(() => {
          this._syncPulse = !1;
        }, 700);
      }
    }
  }
  async _pull() {
    if (!(!this.hass || !this._config) && await this._guardDirty()) {
      this._busy = !0, this._error = void 0;
      try {
        const i = await ee(this.hass, this._config.entry_id);
        this._applyPanel(i);
      } catch (i) {
        this._error = i instanceof Error ? i.message : String(i);
      } finally {
        this._busy = !1;
      }
    }
  }
  async _createProfile() {
    if (!this.hass || !this._config || !this._panel || !await this._guardDirty())
      return;
    const i = `profile_${Date.now()}`, t = {
      id: i,
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
      await Zt(this.hass, this._config.entry_id, t);
      const e = await Y(
        this.hass,
        this._config.entry_id,
        i,
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
    const i = `${this._draft.id}_copy_${Date.now()}`;
    this._busy = !0;
    try {
      await Qt(
        this.hass,
        this._config.entry_id,
        this._draft.id,
        i,
        `${this._draft.name} copy`
      );
      const t = await Y(
        this.hass,
        this._config.entry_id,
        i,
        !1
      );
      this._applyPanel(t);
    } catch (t) {
      this._error = t instanceof Error ? t.message : String(t);
    } finally {
      this._busy = !1;
    }
  }
  _renameProfile() {
    if (!this._draft)
      return;
    const i = window.prompt(this.t("card.rename"), this._draft.name);
    i && (this._draft.name = i, this.requestUpdate());
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
          await Kt(this.hass, this._config.entry_id, this._draft.id), await this._load();
        } catch (i) {
          this._error = i instanceof Error ? i.message : String(i);
        } finally {
          this._busy = !1;
        }
      }
    }
  }
  async _export() {
    if (!(!this.hass || !this._config || !this._panel)) {
      this._busy = !0, this._error = void 0;
      try {
        const i = await ie(this.hass, this._config.entry_id), t = this._panel.panel_name.replace(/[^\w.-]+/g, "_");
        ae(`conx-profiles-${t}.json`, i), this._notice = this.t("card.export_ok");
      } catch (i) {
        this._error = i instanceof Error ? i.message : String(i);
      } finally {
        this._busy = !1;
      }
    }
  }
  _openImport(i) {
    this._importInput || (this._importInput = document.createElement("input"), this._importInput.type = "file", this._importInput.accept = "application/json,.json", this._importInput.hidden = !0, this.renderRoot.appendChild(this._importInput)), this._importInput.onchange = () => {
      var e, r;
      const t = (r = (e = this._importInput) == null ? void 0 : e.files) == null ? void 0 : r[0];
      this._importInput.value = "", t && this._importFile(t, i);
    }, this._importInput.click();
  }
  async _importFile(i, t) {
    if (!(!this.hass || !this._config) && await this._guardDirty()) {
      this._busy = !0, this._error = void 0;
      try {
        const e = await i.text(), r = JSON.parse(e);
        if (!(r != null && r.profiles) || typeof r.profiles != "object")
          throw new Error(this.t("card.import_invalid"));
        const s = await re(
          this.hass,
          this._config.entry_id,
          {
            schema_version: r.schema_version || 1,
            active_profile_id: r.active_profile_id ?? null,
            profiles: r.profiles
          },
          t
        );
        this._applyPanel(s), this._notice = this.t("card.import_ok");
      } catch (e) {
        this._error = e instanceof Error ? e.message : String(e);
      } finally {
        this._busy = !1;
      }
    }
  }
  /** In-place draft mutation keeps text inputs focused while typing. */
  _patchDraft(i) {
    this._draft && (i(this._draft), this.requestUpdate());
  }
  _onProfileNameInput(i) {
    const t = i.target.value;
    this._patchDraft((e) => {
      e.name = t;
    });
  }
  _onButtonNameInput(i, t) {
    const e = t.target.value;
    this._patchDraft((r) => {
      const s = r.buttons.find((a) => a.index === i);
      s && (s.name = e);
    });
  }
  _onButtonActionInput(i, t) {
    const e = t.target.value.trim();
    this._patchDraft((r) => {
      var a, n;
      const s = r.buttons.find((o) => o.index === i);
      if (s) {
        if (!e) {
          s.action = null;
          return;
        }
        s.action = {
          action: e,
          target: ((a = s.action) == null ? void 0 : a.target) || {},
          data: ((n = s.action) == null ? void 0 : n.data) || {}
        };
      }
    });
  }
  _onButtonEntityInput(i, t) {
    const e = t.target.value.trim();
    this._patchDraft((r) => {
      var n, o;
      const s = r.buttons.find((c) => c.index === i);
      if (!s)
        return;
      const a = ((n = s.action) == null ? void 0 : n.action) || "";
      if (!a) {
        s.action = null;
        return;
      }
      s.action = {
        action: a,
        target: e ? { entity_id: e } : {},
        data: ((o = s.action) == null ? void 0 : o.data) || {}
      };
    });
  }
  _buttonEntityId(i) {
    var r, s, a;
    const t = (r = this._draft) == null ? void 0 : r.buttons.find((n) => n.index === i), e = (a = (s = t == null ? void 0 : t.action) == null ? void 0 : s.target) == null ? void 0 : a.entity_id;
    return (e == null ? void 0 : e.trim()) || null;
  }
  _entityIsOn(i) {
    var r, s, a;
    const t = (a = (s = (r = this.hass) == null ? void 0 : r.states) == null ? void 0 : s[i]) == null ? void 0 : a.state;
    if (t == null)
      return null;
    const e = String(t).toLowerCase();
    return ["unavailable", "unknown"].includes(e) ? null : ["on", "open", "home", "playing", "active"].includes(e);
  }
  _isRingOn(i) {
    if (!this._draft)
      return !1;
    if (this._draft.mode !== "toggle")
      return this._draft.selected_button === i;
    const t = this._buttonEntityId(i);
    if (t) {
      const e = this._entityIsOn(t);
      if (e !== null)
        return e;
    }
    return i % 2 === 1;
  }
  _onRingPress(i) {
    this._pressedRing = i, window.setTimeout(() => {
      this._pressedRing === i && (this._pressedRing = null);
    }, 180), !(!this._draft || this._draft.mode === "toggle") && this._patchDraft((t) => {
      t.mode === "radio_optional" && t.selected_button === i ? t.selected_button = null : t.selected_button = i;
    });
  }
  _ringOnColor() {
    var i;
    return z((i = this._draft) == null ? void 0 : i.color_on, Pt);
  }
  _ringOffColor() {
    var i;
    return z((i = this._draft) == null ? void 0 : i.color_off, ue);
  }
  _renderFlag(i) {
    return i === "IL" ? l`
        <span class="flag flag-il" aria-hidden="true">
          <span class="flag-il-bar"></span>
          <span class="flag-il-star">✦</span>
          <span class="flag-il-bar"></span>
        </span>
      ` : i === "GB" ? l`<span class="flag flag-gb" aria-hidden="true"></span>` : l`<span class="flag flag-ru" aria-hidden="true"></span>`;
  }
  _renderSection(i, t, e) {
    const r = this._sections[i];
    return l`
      <section class="panel-section ${r ? "open" : "closed"}">
        <header class="section-head">
          <div class="section-title">${t}</div>
          <label class="switch" title=${this.t("card.section_toggle")}>
            <input
              type="checkbox"
              .checked=${r}
              @change=${() => this._toggleSection(i)}
            />
            <span class="slider"></span>
          </label>
        </header>
        <div class="section-body">
          <div class="section-body-inner">${r ? e : p}</div>
        </div>
      </section>
    `;
  }
  _renderFaceplate() {
    if (!this._draft)
      return p;
    const i = this._ringOnColor(), t = this._ringOffColor();
    return l`
      <!--
        Faceplate topography matches Zemismart 4-gang: black label bar,
        white glass touch face, 4 LED rings L→R. Rings use profile
        color_on / color_off. Extension point for a future photo skin:
        set --conx-faceplate-skin on .faceplate.
      -->
      <div
        class="faceplate"
        style="--ring-on:${i};--ring-off:${t}"
        role="img"
        aria-label=${this.t("card.preview")}
      >
        <div class="faceplate-bezel">
          <div class="faceplate-skin"></div>
          <div class="faceplate-glass">
            <div class="faceplate-labels">
              ${this._draft.buttons.map(
      (e) => l`
                  <div class="faceplate-label">
                    ${e.name || `L${e.index}`}
                  </div>
                `
    )}
            </div>
            <div class="faceplate-touch">
              <div class="faceplate-rings">
                ${this._draft.buttons.map((e) => {
      const r = this._isRingOn(e.index), s = this._pressedRing === e.index;
      return l`
                    <button
                      type="button"
                      class="ring ${r ? "on" : "off"} ${s ? "pressed" : ""}"
                      ?disabled=${this._busy}
                      @click=${() => this._onRingPress(e.index)}
                      aria-label=${`${this.t("card.button")} ${e.index}`}
                    >
                      <span class="ring-glow"></span>
                    </button>
                  `;
    })}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  render() {
    var e;
    const i = St(this._language);
    if (!((e = this._config) != null && e.entry_id))
      return l`<ha-card class="conx-card"><div class="pad">${this.t("card.missing_entry")}</div></ha-card>`;
    if (this._loading && !this._panel)
      return l`<ha-card class="conx-card"><div class="pad">${this.t("card.loading")}</div></ha-card>`;
    if (!this._panel || !this._draft)
      return l`<ha-card class="conx-card"><div class="pad error">${this._error || this.t("card.loading")}</div></ha-card>`;
    const t = !!this._config.compact;
    return l`
      <ha-card
        dir=${i ? "rtl" : "ltr"}
        class="conx-card ${t ? "compact" : ""} ${this._syncPulse ? "syncing-pulse" : ""}"
      >
        <div class="atmosphere"></div>
        <div class="header">
          <div class="brand-block">
            <div class="brand">ConX</div>
            <div class="title">${this._panel.panel_name}</div>
            <div class="subtitle">${this._draft.name}</div>
          </div>
          <div class="header-side">
            <div class="lang-flags" role="group" aria-label=${this.t("card.language")}>
              ${kt.map(
      (r) => l`
                  <button
                    type="button"
                    class="lang-btn ${this._language === r.id ? "active" : ""}"
                    ?disabled=${this._busy}
                    title=${r.label}
                    @click=${() => this._setLanguage(r.id)}
                  >
                    ${this._renderFlag(r.flag)}
                    <span class="lang-code">${r.id.toUpperCase()}</span>
                  </button>
                `
    )}
            </div>
            <div class="badge status-${this._panel.sync_status}">
              ${this.t("card.status")}: ${this._panel.sync_status}
            </div>
          </div>
        </div>

        ${this._dirty ? l`<div class="warn">${this.t("card.unsaved")}</div>` : p}
        ${this._notice ? l`<div class="notice">${this._notice}</div>` : p}
        ${this._error || this._panel.last_error ? l`<div class="error">${this._error || this._panel.last_error}</div>` : p}

        <div class="layout">
          ${this._renderSection(
      "profiles",
      this.t("card.profiles"),
      l`
              <div class="profile-list">
                ${Object.values(this._panel.profiles).map(
        (r) => {
          var s;
          return l`
                    <button
                      type="button"
                      class="profile-chip ${r.id === ((s = this._draft) == null ? void 0 : s.id) ? "active" : ""}"
                      ?disabled=${this._busy}
                      @click=${() => this._selectProfile(r.id)}
                    >
                      <span class="chip-name">${r.name}</span>
                      <span class="chip-id">${r.id}</span>
                    </button>
                  `;
        }
      )}
              </div>
              <label class="field">
                <span>${this.t("card.profile_name")}</span>
                <input
                  type="text"
                  .value=${this._draft.name}
                  ?disabled=${this._busy}
                  @input=${this._onProfileNameInput}
                />
              </label>
              <div class="row actions">
                <button type="button" class="btn" ?disabled=${this._busy} @click=${this._createProfile}>
                  ${this.t("card.create")}
                </button>
                <button type="button" class="btn" ?disabled=${this._busy} @click=${this._duplicateProfile}>
                  ${this.t("card.duplicate")}
                </button>
                <button type="button" class="btn" ?disabled=${this._busy} @click=${this._renameProfile}>
                  ${this.t("card.rename")}
                </button>
                <button type="button" class="btn danger" ?disabled=${this._busy} @click=${this._deleteProfile}>
                  ${this.t("card.delete")}
                </button>
              </div>
              <div class="row actions">
                <button type="button" class="btn" ?disabled=${this._busy} @click=${this._export}>
                  ${this.t("card.export")}
                </button>
                <button
                  type="button"
                  class="btn"
                  ?disabled=${this._busy}
                  @click=${() => this._openImport("merge")}
                >
                  ${this.t("card.import_merge")}
                </button>
                <button
                  type="button"
                  class="btn danger"
                  ?disabled=${this._busy}
                  @click=${() => this._openImport("replace")}
                >
                  ${this.t("card.import_replace")}
                </button>
              </div>
            `
    )}

          ${this._renderSection(
      "appearance",
      this.t("card.editor"),
      l`
              <label class="field">
                <span>${this.t("card.mode")}</span>
                <div class="select-wrap">
                  <select
                    .value=${this._draft.mode}
                    ?disabled=${this._busy}
                    @change=${(r) => this._patchDraft((s) => {
        s.mode = r.target.value;
      })}
                  >
                    ${this._panel.capabilities.modes.map(
        (r) => l`<option value=${r}>${this.t(`mode.${r}`)}</option>`
      )}
                  </select>
                </div>
              </label>
              <div class="grid-2">
                <label class="field">
                  <span>${this.t("card.color_on")}</span>
                  <div class="select-wrap color-select">
                    <span
                      class="swatch"
                      style="background:${z(this._draft.color_on)}"
                    ></span>
                    <select
                      .value=${this._draft.color_on}
                      ?disabled=${this._busy}
                      @change=${(r) => this._patchDraft((s) => {
        s.color_on = r.target.value;
      })}
                    >
                      ${this._panel.capabilities.colors.map(
        (r) => l`<option value=${r}>${r}</option>`
      )}
                    </select>
                  </div>
                </label>
                <label class="field">
                  <span>${this.t("card.color_off")}</span>
                  <div class="select-wrap color-select">
                    <span
                      class="swatch"
                      style="background:${z(this._draft.color_off)}"
                    ></span>
                    <select
                      .value=${this._draft.color_off}
                      ?disabled=${this._busy}
                      @change=${(r) => this._patchDraft((s) => {
        s.color_off = r.target.value;
      })}
                    >
                      ${this._panel.capabilities.colors.map(
        (r) => l`<option value=${r}>${r}</option>`
      )}
                    </select>
                  </div>
                </label>
              </div>
              <label class="field">
                <span>${this.t("card.radar")}</span>
                <div class="select-wrap">
                  <select
                    .value=${this._draft.radar}
                    ?disabled=${this._busy}
                    @change=${(r) => this._patchDraft((s) => {
        s.radar = r.target.value;
      })}
                  >
                    ${this._panel.capabilities.radar.map(
        (r) => l`<option value=${r}>${r}</option>`
      )}
                  </select>
                </div>
              </label>
              <div class="toggle-row">
                <label class="switch-field">
                  <span>${this.t("card.backlight")}</span>
                  <label class="switch">
                    <input
                      type="checkbox"
                      .checked=${this._draft.backlight}
                      ?disabled=${this._busy}
                      @change=${(r) => this._patchDraft((s) => {
        s.backlight = r.target.checked;
      })}
                    />
                    <span class="slider"></span>
                  </label>
                </label>
                <label class="switch-field">
                  <span>${this.t("card.child_lock")}</span>
                  <label class="switch">
                    <input
                      type="checkbox"
                      .checked=${this._draft.child_lock}
                      ?disabled=${this._busy}
                      @change=${(r) => this._patchDraft((s) => {
        s.child_lock = r.target.checked;
      })}
                    />
                    <span class="slider"></span>
                  </label>
                </label>
              </div>
            `
    )}

          ${this._renderSection(
      "buttons",
      this.t("card.buttons"),
      l`
              ${this._draft.buttons.map(
        (r) => {
          var s, a, n;
          return l`
                  <div class="button-edit" data-button=${r.index}>
                    <div class="button-edit-title">
                      ${this.t("card.button")} ${r.index}
                    </div>
                    <label class="field">
                      <span>${this.t("card.label")}</span>
                      <input
                        type="text"
                        .value=${r.name}
                        ?disabled=${this._busy}
                        @input=${(o) => this._onButtonNameInput(r.index, o)}
                      />
                    </label>
                    <label class="field">
                      <span>${this.t("card.action")}</span>
                      <input
                        type="text"
                        .value=${((s = r.action) == null ? void 0 : s.action) || ""}
                        placeholder="light.toggle"
                        ?disabled=${this._busy}
                        @input=${(o) => this._onButtonActionInput(r.index, o)}
                      />
                    </label>
                    <label class="field">
                      <span>${this.t("card.entity_id")}</span>
                      <input
                        type="text"
                        .value=${String(
            ((n = (a = r.action) == null ? void 0 : a.target) == null ? void 0 : n.entity_id) || ""
          )}
                        placeholder="light.living_room"
                        ?disabled=${this._busy}
                        @input=${(o) => this._onButtonEntityInput(r.index, o)}
                      />
                    </label>
                  </div>
                `;
        }
      )}
            `
    )}

          ${this._renderSection(
      "preview",
      this.t("card.preview"),
      l`${this._renderFaceplate()}`
    )}

          ${this._renderSection(
      "actions",
      this.t("card.actions"),
      l`
              <div class="row actions">
                <button
                  type="button"
                  class="btn primary"
                  ?disabled=${this._busy || !this._dirty}
                  @click=${this._saveDraft}
                >
                  ${this.t("card.save")}
                </button>
                <button
                  type="button"
                  class="btn"
                  ?disabled=${this._busy || !this._dirty}
                  @click=${this._discard}
                >
                  ${this.t("card.discard")}
                </button>
                <button
                  type="button"
                  class="btn primary sync-btn"
                  ?disabled=${this._busy}
                  @click=${this._sync}
                >
                  ${this.t("card.sync")}
                </button>
                <button type="button" class="btn" ?disabled=${this._busy} @click=${this._pull}>
                  ${this.t("card.pull")}
                </button>
              </div>
            `
    )}
        </div>
      </ha-card>
    `;
  }
};
u.styles = bt`
    :host {
      display: block;
      --conx-font: "Outfit", "Sora", ui-sans-serif, sans-serif;
      --conx-display: "Sora", "Outfit", ui-sans-serif, sans-serif;
      --conx-steel: #8b949e;
      --conx-ink: #1a222c;
      --conx-panel: #eef2f5;
      --conx-glass: color-mix(in srgb, #ffffff 72%, transparent);
      --conx-bevel-light: color-mix(in srgb, #ffffff 55%, transparent);
      --conx-bevel-dark: color-mix(in srgb, #0b1218 22%, transparent);
      --conx-accent: #1f7a8c;
      --conx-accent-soft: color-mix(in srgb, #1f7a8c 18%, transparent);
      --conx-ring: #00e5ff;
      --conx-ring-off: #2979ff;
      --conx-danger: #c62828;
      --conx-radius: 18px;
      --conx-gap: 12px;
    }

    ha-card.conx-card {
      position: relative;
      overflow: hidden;
      font-family: var(--conx-font);
      color: var(--primary-text-color, var(--conx-ink));
      background:
        linear-gradient(
          155deg,
          color-mix(in srgb, var(--ha-card-background, #fff) 88%, #d7dee6) 0%,
          var(--ha-card-background, var(--card-background-color, #f7f9fb)) 48%,
          color-mix(in srgb, var(--ha-card-background, #fff) 90%, #c5d0da) 100%
        );
      border: 1px solid color-mix(in srgb, var(--conx-steel) 35%, transparent);
      box-shadow:
        inset 0 1px 0 var(--conx-bevel-light),
        inset 0 -1px 0 var(--conx-bevel-dark),
        0 10px 28px color-mix(in srgb, #0b1218 14%, transparent);
      padding: 18px;
    }

    .atmosphere {
      pointer-events: none;
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 12% 0%, color-mix(in srgb, #9eb6c8 28%, transparent), transparent 42%),
        radial-gradient(circle at 88% 100%, color-mix(in srgb, #1f7a8c 12%, transparent), transparent 40%),
        repeating-linear-gradient(
          -18deg,
          transparent,
          transparent 10px,
          color-mix(in srgb, #0b1218 2.5%, transparent) 10px,
          color-mix(in srgb, #0b1218 2.5%, transparent) 11px
        );
      opacity: 0.55;
    }

    .header,
    .warn,
    .error,
    .notice,
    .layout {
      position: relative;
      z-index: 1;
    }

    .header {
      display: flex;
      justify-content: space-between;
      gap: var(--conx-gap);
      align-items: flex-start;
      margin-bottom: 14px;
    }

    .brand {
      font-family: var(--conx-display);
      font-size: 1.55rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      line-height: 1;
      color: var(--conx-accent);
      text-shadow: 0 1px 0 var(--conx-bevel-light);
    }

    .title {
      font-family: var(--conx-display);
      font-size: 1.15rem;
      font-weight: 600;
      margin-top: 4px;
    }

    .subtitle {
      opacity: 0.72;
      margin-top: 2px;
      font-size: 0.92rem;
    }

    .header-side {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
    }

    .lang-flags {
      display: flex;
      gap: 6px;
    }

    .lang-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 8px;
      border-radius: 999px;
      border: 1px solid color-mix(in srgb, var(--conx-steel) 45%, transparent);
      background:
        linear-gradient(180deg, color-mix(in srgb, #fff 70%, transparent), color-mix(in srgb, #c9d3dc 40%, transparent));
      box-shadow: inset 0 1px 0 var(--conx-bevel-light);
      cursor: pointer;
      color: inherit;
      font: inherit;
    }

    .lang-btn.active {
      border-color: color-mix(in srgb, var(--conx-accent) 55%, transparent);
      background: var(--conx-accent-soft);
      box-shadow:
        inset 0 1px 0 var(--conx-bevel-light),
        0 0 0 1px color-mix(in srgb, var(--conx-accent) 25%, transparent);
    }

    .lang-code {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    .flag {
      width: 18px;
      height: 12px;
      border-radius: 2px;
      border: 1px solid color-mix(in srgb, #000 18%, transparent);
      display: inline-block;
      overflow: hidden;
      position: relative;
      flex-shrink: 0;
    }

    .flag-il {
      background: #fff;
      display: grid;
      grid-template-rows: 2px 1fr 2px;
      place-items: center;
    }

    .flag-il-bar {
      width: 100%;
      height: 2px;
      background: #0038b8;
    }

    .flag-il-star {
      color: #0038b8;
      font-size: 7px;
      line-height: 1;
    }

    .flag-gb {
      background:
        linear-gradient(90deg, transparent 44%, #fff 44%, #fff 56%, transparent 56%),
        linear-gradient(#fff 38%, transparent 38%, transparent 62%, #fff 62%),
        linear-gradient(90deg, transparent 46%, #c8102e 46%, #c8102e 54%, transparent 54%),
        linear-gradient(#c8102e 42%, transparent 42%, transparent 58%, #c8102e 58%),
        #012169;
    }

    .flag-ru {
      background: linear-gradient(
        to bottom,
        #fff 0 33%,
        #0039a6 33% 66%,
        #d52b1e 66% 100%
      );
    }

    .badge {
      border-radius: 999px;
      padding: 5px 11px;
      font-size: 0.8rem;
      font-weight: 600;
      border: 1px solid color-mix(in srgb, var(--conx-steel) 40%, transparent);
      background: color-mix(in srgb, #fff 45%, transparent);
      text-transform: lowercase;
      box-shadow: inset 0 1px 0 var(--conx-bevel-light);
    }

    .status-synced {
      color: var(--success-color, #2e7d32);
    }
    .status-pending,
    .status-out_of_sync {
      color: var(--warning-color, #ed6c02);
    }
    .status-syncing {
      color: var(--conx-accent);
    }
    .status-error {
      color: var(--error-color, var(--conx-danger));
    }

    .warn,
    .error,
    .notice {
      padding: 9px 12px;
      border-radius: 12px;
      margin-bottom: 10px;
      font-size: 0.9rem;
      border: 1px solid transparent;
    }

    .warn {
      background: color-mix(in srgb, var(--warning-color, #ed6c02) 14%, transparent);
      border-color: color-mix(in srgb, var(--warning-color, #ed6c02) 28%, transparent);
    }

    .error {
      background: color-mix(in srgb, var(--error-color, #d32f2f) 14%, transparent);
      color: var(--error-color, #d32f2f);
      border-color: color-mix(in srgb, var(--error-color, #d32f2f) 28%, transparent);
    }

    .notice {
      background: color-mix(in srgb, var(--conx-accent) 12%, transparent);
      border-color: color-mix(in srgb, var(--conx-accent) 28%, transparent);
    }

    .layout {
      display: grid;
      gap: 14px;
    }

    @media (min-width: 920px) {
      .layout {
        grid-template-columns: 1fr 1.15fr;
      }
      .compact .layout {
        grid-template-columns: 1fr;
      }
    }

    .panel-section {
      border-radius: 16px;
      border: 1px solid color-mix(in srgb, var(--conx-steel) 32%, transparent);
      background:
        linear-gradient(
          180deg,
          color-mix(in srgb, #fff 55%, transparent),
          color-mix(in srgb, var(--secondary-background-color, #e8eef3) 55%, transparent)
        );
      box-shadow:
        inset 0 1px 0 var(--conx-bevel-light),
        0 6px 16px color-mix(in srgb, #0b1218 8%, transparent);
      overflow: hidden;
    }

    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px 14px;
      border-bottom: 1px solid color-mix(in srgb, var(--conx-steel) 22%, transparent);
    }

    .section-title {
      font-family: var(--conx-display);
      font-weight: 600;
      letter-spacing: 0.01em;
    }

    .section-body {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 220ms ease;
    }

    .panel-section.open .section-body {
      grid-template-rows: 1fr;
    }

    .section-body-inner {
      overflow: hidden;
      padding: 0 14px;
    }

    .panel-section.open .section-body-inner {
      padding: 12px 14px 14px;
    }

    .switch {
      position: relative;
      display: inline-block;
      width: 42px;
      height: 24px;
      flex-shrink: 0;
    }

    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      inset: 0;
      cursor: pointer;
      border-radius: 999px;
      background: color-mix(in srgb, var(--conx-steel) 45%, #d5dde5);
      box-shadow: inset 0 1px 2px color-mix(in srgb, #0b1218 25%, transparent);
      transition: background 180ms ease;
    }

    .slider::before {
      content: "";
      position: absolute;
      width: 18px;
      height: 18px;
      left: 3px;
      top: 3px;
      border-radius: 50%;
      background: linear-gradient(180deg, #fff, #dce3ea);
      box-shadow: 0 1px 3px color-mix(in srgb, #0b1218 30%, transparent);
      transition: transform 180ms ease;
    }

    .switch input:checked + .slider {
      background: color-mix(in srgb, var(--conx-accent) 75%, #89b4c0);
    }

    .switch input:checked + .slider::before {
      transform: translateX(18px);
    }

    :host([dir="rtl"]) .switch input:checked + .slider::before,
    ha-card[dir="rtl"] .switch input:checked + .slider::before {
      transform: translateX(-18px);
    }

    .profile-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 10px;
    }

    .profile-chip {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      text-align: start;
      border-radius: 12px;
      border: 1px solid color-mix(in srgb, var(--conx-steel) 35%, transparent);
      background: color-mix(in srgb, #fff 50%, transparent);
      padding: 10px 12px;
      cursor: pointer;
      color: inherit;
      font: inherit;
      box-shadow: inset 0 1px 0 var(--conx-bevel-light);
      transition: transform 140ms ease, border-color 140ms ease;
    }

    .profile-chip:hover {
      transform: translateY(-1px);
    }

    .profile-chip.active {
      border-color: color-mix(in srgb, var(--conx-accent) 55%, transparent);
      background: var(--conx-accent-soft);
    }

    .chip-name {
      font-weight: 600;
    }

    .chip-id {
      font-size: 0.75rem;
      opacity: 0.65;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 5px;
      margin-bottom: 10px;
      font-size: 0.9rem;
    }

    .field > span {
      font-weight: 500;
      opacity: 0.85;
    }

    input[type="text"],
    select {
      font: inherit;
      color: inherit;
      background:
        linear-gradient(180deg, color-mix(in srgb, #fff 80%, transparent), color-mix(in srgb, #e4ebf1 55%, transparent));
      border: 1px solid color-mix(in srgb, var(--conx-steel) 40%, transparent);
      border-radius: 11px;
      padding: 9px 11px;
      box-shadow:
        inset 0 1px 0 var(--conx-bevel-light),
        inset 0 -1px 0 color-mix(in srgb, #0b1218 6%, transparent);
    }

    input[type="text"]:focus,
    select:focus {
      outline: none;
      border-color: color-mix(in srgb, var(--conx-accent) 55%, transparent);
      box-shadow:
        inset 0 1px 0 var(--conx-bevel-light),
        0 0 0 2px var(--conx-accent-soft);
    }

    .select-wrap {
      position: relative;
    }

    .color-select {
      display: grid;
      grid-template-columns: 18px 1fr;
      align-items: center;
      gap: 8px;
    }

    .swatch {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 1px solid color-mix(in srgb, #000 20%, transparent);
      box-shadow: inset 0 1px 2px color-mix(in srgb, #fff 40%, transparent);
    }

    .toggle-row {
      display: grid;
      gap: 10px;
    }

    .switch-field {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 10px;
      border-radius: 12px;
      border: 1px solid color-mix(in srgb, var(--conx-steel) 28%, transparent);
      background: color-mix(in srgb, #fff 40%, transparent);
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

    @media (max-width: 520px) {
      .grid-2 {
        grid-template-columns: 1fr;
      }
      .header {
        flex-direction: column;
      }
      .header-side {
        align-items: flex-start;
      }
    }

    .btn {
      font: inherit;
      color: inherit;
      cursor: pointer;
      border-radius: 11px;
      border: 1px solid color-mix(in srgb, var(--conx-steel) 40%, transparent);
      background:
        linear-gradient(180deg, color-mix(in srgb, #fff 75%, transparent), color-mix(in srgb, #cfd8e1 50%, transparent));
      padding: 8px 12px;
      box-shadow:
        inset 0 1px 0 var(--conx-bevel-light),
        0 2px 6px color-mix(in srgb, #0b1218 10%, transparent);
      transition: transform 120ms ease, filter 120ms ease;
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-1px);
    }

    .btn:active:not(:disabled) {
      transform: translateY(1px);
    }

    .btn.primary {
      background: linear-gradient(180deg, #2a93a8, var(--conx-accent));
      color: #fff;
      border-color: color-mix(in srgb, var(--conx-accent) 70%, #0b1218);
    }

    .btn.danger {
      color: var(--conx-danger);
    }

    .btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
      transform: none;
    }

    .button-edit {
      border-top: 1px solid color-mix(in srgb, var(--conx-steel) 26%, transparent);
      padding-top: 10px;
      margin-top: 10px;
    }

    .button-edit:first-child {
      border-top: 0;
      padding-top: 0;
      margin-top: 0;
    }

    .button-edit-title {
      font-weight: 600;
      margin-bottom: 8px;
    }

    /* Zemismart 4-gang faceplate recreation (labels top / rings bottom, 1×4). */
    .faceplate {
      --conx-faceplate-skin: none; /* future: url(...) photo overlay */
      width: 100%;
      overflow-x: auto;
      padding: 4px 2px 8px;
    }

    .faceplate-bezel {
      position: relative;
      min-width: 320px;
      width: min(100%, 560px);
      margin: 0 auto;
      aspect-ratio: 2.55 / 1;
      border-radius: 18px;
      padding: 5px;
      background:
        linear-gradient(145deg, #f4f6f8 0%, #b7c0c8 38%, #eceff2 62%, #8e99a3 100%);
      box-shadow:
        inset 0 1px 1px #fff,
        inset 0 -1px 2px color-mix(in srgb, #000 35%, transparent),
        0 8px 18px color-mix(in srgb, #0b1218 18%, transparent);
    }

    .faceplate-skin {
      position: absolute;
      inset: 5px;
      border-radius: 14px;
      background-image: var(--conx-faceplate-skin);
      background-size: cover;
      background-position: center;
      opacity: 0;
      pointer-events: none;
      z-index: 2;
    }

    .faceplate-glass {
      position: relative;
      z-index: 1;
      height: 100%;
      border-radius: 14px;
      overflow: hidden;
      display: grid;
      grid-template-rows: 26% 74%;
      background: #fff;
      box-shadow: inset 0 0 0 1px color-mix(in srgb, #000 8%, transparent);
    }

    .faceplate-labels {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      align-items: center;
      background: #0a0a0a;
      color: #f5f5f5;
      padding: 0 4px;
    }

    .faceplate-label {
      text-align: center;
      font-size: clamp(0.62rem, 2.1vw, 0.9rem);
      font-weight: 500;
      letter-spacing: 0.01em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding: 0 4px;
    }

    .faceplate-touch {
      display: flex;
      align-items: flex-end;
      justify-content: stretch;
      background:
        linear-gradient(180deg, #ffffff 0%, #f7f8fa 70%, #eef1f4 100%);
      padding: 0 2% 10%;
    }

    .faceplate-rings {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      width: 100%;
      place-items: center;
    }

    .ring {
      width: clamp(18px, 5.2vw, 28px);
      height: clamp(18px, 5.2vw, 28px);
      border-radius: 50%;
      border: 2.5px solid
        color-mix(in srgb, var(--ring-off, var(--conx-ring-off)) 70%, #9aa7b5);
      background: transparent;
      padding: 0;
      cursor: pointer;
      position: relative;
      box-shadow:
        0 0 5px color-mix(in srgb, var(--ring-off, var(--conx-ring-off)) 40%, transparent),
        inset 0 0 0 1px color-mix(in srgb, #fff 40%, transparent);
      transition:
        border-color 160ms ease,
        box-shadow 160ms ease,
        transform 120ms ease;
    }

    .ring.on {
      border-color: var(--ring-on, var(--conx-ring));
      box-shadow:
        0 0 12px color-mix(in srgb, var(--ring-on, var(--conx-ring)) 75%, transparent),
        0 0 4px color-mix(in srgb, var(--ring-on, var(--conx-ring)) 90%, transparent),
        inset 0 0 5px color-mix(in srgb, var(--ring-on, var(--conx-ring)) 45%, transparent);
    }

    .ring.pressed {
      transform: scale(0.9);
    }

    .ring-glow {
      position: absolute;
      inset: 4px;
      border-radius: 50%;
      background: color-mix(
        in srgb,
        var(--ring-off, var(--conx-ring-off)) 14%,
        transparent
      );
    }

    .ring.on .ring-glow {
      background: color-mix(in srgb, var(--ring-on, var(--conx-ring)) 28%, transparent);
    }

    .syncing-pulse .sync-btn,
    .syncing-pulse .badge.status-syncing {
      animation: conx-pulse 700ms ease;
    }

    @keyframes conx-pulse {
      0% {
        filter: brightness(1);
        box-shadow: 0 0 0 0 color-mix(in srgb, var(--conx-accent) 0%, transparent);
      }
      40% {
        filter: brightness(1.12);
        box-shadow: 0 0 0 6px color-mix(in srgb, var(--conx-accent) 22%, transparent);
      }
      100% {
        filter: brightness(1);
        box-shadow: 0 0 0 0 color-mix(in srgb, var(--conx-accent) 0%, transparent);
      }
    }

    .pad {
      padding: 16px;
      position: relative;
      z-index: 1;
    }
  `;
g([
  et({ attribute: !1 })
], u.prototype, "hass", 2);
g([
  _()
], u.prototype, "_config", 2);
g([
  _()
], u.prototype, "_panel", 2);
g([
  _()
], u.prototype, "_draft", 2);
g([
  _()
], u.prototype, "_saved", 2);
g([
  _()
], u.prototype, "_error", 2);
g([
  _()
], u.prototype, "_notice", 2);
g([
  _()
], u.prototype, "_loading", 2);
g([
  _()
], u.prototype, "_busy", 2);
g([
  _()
], u.prototype, "_syncPulse", 2);
g([
  _()
], u.prototype, "_pressedRing", 2);
g([
  _()
], u.prototype, "_uiLang", 2);
g([
  _()
], u.prototype, "_sections", 2);
u = g([
  $t("conx-dynamic-panel-card")
], u);
var ge = Object.defineProperty, _e = Object.getOwnPropertyDescriptor, it = (i, t, e, r) => {
  for (var s = r > 1 ? void 0 : r ? _e(t, e) : t, a = i.length - 1, n; a >= 0; a--)
    (n = i[a]) && (s = (r ? n(t, e, s) : n(s)) || s);
  return r && s && ge(t, e, s), s;
};
let T = class extends k {
  setConfig(i) {
    this._config = i;
  }
  get _language() {
    var i, t, e, r;
    return ((i = this._config) == null ? void 0 : i.language) || ((e = (t = this.hass) == null ? void 0 : t.locale) == null ? void 0 : e.language) || ((r = this.hass) == null ? void 0 : r.language) || "en";
  }
  _valueChanged(i) {
    if (!this._config)
      return;
    const t = { ...this._config, ...i };
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
      return l``;
    const i = St(this._language);
    return l`
      <div class="editor" dir=${i ? "rtl" : "ltr"}>
        <label>
          ${B(this._language, "editor.entry_id")}
          <input
            .value=${this._config.entry_id || ""}
            @input=${(t) => this._valueChanged({
      entry_id: t.target.value.trim()
    })}
          />
        </label>
        <label>
          ${B(this._language, "card.language")}
          <select
            .value=${L(this._config.language || this._language)}
            @change=${(t) => this._valueChanged({
      language: t.target.value
    })}
          >
            ${kt.map(
      (t) => l`<option value=${t.id}>${t.label}</option>`
    )}
          </select>
        </label>
        <label class="check">
          <input
            type="checkbox"
            .checked=${!!this._config.compact}
            @change=${(t) => this._valueChanged({
      compact: t.target.checked
    })}
          />
          ${B(this._language, "card.compact")}
        </label>
      </div>
    `;
  }
};
T.styles = bt`
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
    select {
      font: inherit;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid var(--divider-color, #ccc);
      background: var(--secondary-background-color, transparent);
      color: inherit;
    }
  `;
it([
  et({ attribute: !1 })
], T.prototype, "hass", 2);
it([
  _()
], T.prototype, "_config", 2);
T = it([
  $t("conx-dynamic-panel-card-editor")
], T);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "conx-dynamic-panel-card",
  name: "ConX Dynamic Panel Card",
  description: "Private ConX card for multi-profile smart panels",
  preview: !0
});
//# sourceMappingURL=conx-dynamic-panel-card.js.map
