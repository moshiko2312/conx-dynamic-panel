/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const me = globalThis, Be = me.ShadowRoot && (me.ShadyCSS === void 0 || me.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Fe = Symbol(), Je = /* @__PURE__ */ new WeakMap();
let St = class {
  constructor(t, r, i) {
    if (this._$cssResult$ = !0, i !== Fe) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = r;
  }
  get styleSheet() {
    let t = this.o;
    const r = this.t;
    if (Be && t === void 0) {
      const i = r !== void 0 && r.length === 1;
      i && (t = Je.get(r)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && Je.set(r, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const Zt = (e) => new St(typeof e == "string" ? e : e + "", void 0, Fe), At = (e, ...t) => {
  const r = e.length === 1 ? e[0] : t.reduce((i, a, o) => i + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(a) + e[o + 1], e[0]);
  return new St(r, e, Fe);
}, Qt = (e, t) => {
  if (Be) e.adoptedStyleSheets = t.map((r) => r instanceof CSSStyleSheet ? r : r.styleSheet);
  else for (const r of t) {
    const i = document.createElement("style"), a = me.litNonce;
    a !== void 0 && i.setAttribute("nonce", a), i.textContent = r.cssText, e.appendChild(i);
  }
}, qe = Be ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((t) => {
  let r = "";
  for (const i of t.cssRules) r += i.cssText;
  return Zt(r);
})(e) : e;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: er, defineProperty: tr, getOwnPropertyDescriptor: rr, getOwnPropertyNames: ir, getOwnPropertySymbols: ar, getPrototypeOf: or } = Object, T = globalThis, Ke = T.trustedTypes, nr = Ke ? Ke.emptyScript : "", $e = T.reactiveElementPolyfillSupport, Q = (e, t) => e, fe = { toAttribute(e, t) {
  switch (t) {
    case Boolean:
      e = e ? nr : null;
      break;
    case Object:
    case Array:
      e = e == null ? e : JSON.stringify(e);
  }
  return e;
}, fromAttribute(e, t) {
  let r = e;
  switch (t) {
    case Boolean:
      r = e !== null;
      break;
    case Number:
      r = e === null ? null : Number(e);
      break;
    case Object:
    case Array:
      try {
        r = JSON.parse(e);
      } catch {
        r = null;
      }
  }
  return r;
} }, He = (e, t) => !er(e, t), Xe = { attribute: !0, type: String, converter: fe, reflect: !1, useDefault: !1, hasChanged: He };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), T.litPropertyMetadata ?? (T.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let j = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, r = Xe) {
    if (r.state && (r.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((r = Object.create(r)).wrapped = !0), this.elementProperties.set(t, r), !r.noAccessor) {
      const i = Symbol(), a = this.getPropertyDescriptor(t, i, r);
      a !== void 0 && tr(this.prototype, t, a);
    }
  }
  static getPropertyDescriptor(t, r, i) {
    const { get: a, set: o } = rr(this.prototype, t) ?? { get() {
      return this[r];
    }, set(n) {
      this[r] = n;
    } };
    return { get: a, set(n) {
      const s = a == null ? void 0 : a.call(this);
      o == null || o.call(this, n), this.requestUpdate(t, s, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? Xe;
  }
  static _$Ei() {
    if (this.hasOwnProperty(Q("elementProperties"))) return;
    const t = or(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(Q("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(Q("properties"))) {
      const r = this.properties, i = [...ir(r), ...ar(r)];
      for (const a of i) this.createProperty(a, r[a]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const r = litPropertyMetadata.get(t);
      if (r !== void 0) for (const [i, a] of r) this.elementProperties.set(i, a);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [r, i] of this.elementProperties) {
      const a = this._$Eu(r, i);
      a !== void 0 && this._$Eh.set(a, r);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const r = [];
    if (Array.isArray(t)) {
      const i = new Set(t.flat(1 / 0).reverse());
      for (const a of i) r.unshift(qe(a));
    } else t !== void 0 && r.push(qe(t));
    return r;
  }
  static _$Eu(t, r) {
    const i = r.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var t;
    this._$ES = new Promise((r) => this.enableUpdating = r), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (t = this.constructor.l) == null || t.forEach((r) => r(this));
  }
  addController(t) {
    var r;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(t), this.renderRoot !== void 0 && this.isConnected && ((r = t.hostConnected) == null || r.call(t));
  }
  removeController(t) {
    var r;
    (r = this._$EO) == null || r.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), r = this.constructor.elementProperties;
    for (const i of r.keys()) this.hasOwnProperty(i) && (t.set(i, this[i]), delete this[i]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return Qt(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    var t;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (t = this._$EO) == null || t.forEach((r) => {
      var i;
      return (i = r.hostConnected) == null ? void 0 : i.call(r);
    });
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    var t;
    (t = this._$EO) == null || t.forEach((r) => {
      var i;
      return (i = r.hostDisconnected) == null ? void 0 : i.call(r);
    });
  }
  attributeChangedCallback(t, r, i) {
    this._$AK(t, i);
  }
  _$ET(t, r) {
    var o;
    const i = this.constructor.elementProperties.get(t), a = this.constructor._$Eu(t, i);
    if (a !== void 0 && i.reflect === !0) {
      const n = (((o = i.converter) == null ? void 0 : o.toAttribute) !== void 0 ? i.converter : fe).toAttribute(r, i.type);
      this._$Em = t, n == null ? this.removeAttribute(a) : this.setAttribute(a, n), this._$Em = null;
    }
  }
  _$AK(t, r) {
    var o, n;
    const i = this.constructor, a = i._$Eh.get(t);
    if (a !== void 0 && this._$Em !== a) {
      const s = i.getPropertyOptions(a), c = typeof s.converter == "function" ? { fromAttribute: s.converter } : ((o = s.converter) == null ? void 0 : o.fromAttribute) !== void 0 ? s.converter : fe;
      this._$Em = a;
      const l = c.fromAttribute(r, s.type);
      this[a] = l ?? ((n = this._$Ej) == null ? void 0 : n.get(a)) ?? l, this._$Em = null;
    }
  }
  requestUpdate(t, r, i, a = !1, o) {
    var n;
    if (t !== void 0) {
      const s = this.constructor;
      if (a === !1 && (o = this[t]), i ?? (i = s.getPropertyOptions(t)), !((i.hasChanged ?? He)(o, r) || i.useDefault && i.reflect && o === ((n = this._$Ej) == null ? void 0 : n.get(t)) && !this.hasAttribute(s._$Eu(t, i)))) return;
      this.C(t, r, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, r, { useDefault: i, reflect: a, wrapped: o }, n) {
    i && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(t) && (this._$Ej.set(t, n ?? r ?? this[t]), o !== !0 || n !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (r = void 0), this._$AL.set(t, r)), a === !0 && this._$Em !== t && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (r) {
      Promise.reject(r);
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
        for (const [o, n] of this._$Ep) this[o] = n;
        this._$Ep = void 0;
      }
      const a = this.constructor.elementProperties;
      if (a.size > 0) for (const [o, n] of a) {
        const { wrapped: s } = n, c = this[o];
        s !== !0 || this._$AL.has(o) || c === void 0 || this.C(o, void 0, n, c);
      }
    }
    let t = !1;
    const r = this._$AL;
    try {
      t = this.shouldUpdate(r), t ? (this.willUpdate(r), (i = this._$EO) == null || i.forEach((a) => {
        var o;
        return (o = a.hostUpdate) == null ? void 0 : o.call(a);
      }), this.update(r)) : this._$EM();
    } catch (a) {
      throw t = !1, this._$EM(), a;
    }
    t && this._$AE(r);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    var r;
    (r = this._$EO) == null || r.forEach((i) => {
      var a;
      return (a = i.hostUpdated) == null ? void 0 : a.call(i);
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
    this._$Eq && (this._$Eq = this._$Eq.forEach((r) => this._$ET(r, this[r]))), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
j.elementStyles = [], j.shadowRootOptions = { mode: "open" }, j[Q("elementProperties")] = /* @__PURE__ */ new Map(), j[Q("finalized")] = /* @__PURE__ */ new Map(), $e == null || $e({ ReactiveElement: j }), (T.reactiveElementVersions ?? (T.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ee = globalThis, Ve = (e) => e, ge = ee.trustedTypes, Ze = ge ? ge.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, Ot = "$lit$", C = `lit$${Math.random().toFixed(9).slice(2)}$`, Et = "?" + C, sr = `<${Et}>`, F = document, oe = () => F.createComment(""), ne = (e) => e === null || typeof e != "object" && typeof e != "function", je = Array.isArray, cr = (e) => je(e) || typeof (e == null ? void 0 : e[Symbol.iterator]) == "function", we = `[ 	
\f\r]`, K = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Qe = /-->/g, et = />/g, z = RegExp(`>|${we}(?:([^\\s"'>=/]+)(${we}*=${we}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), tt = /'/g, rt = /"/g, Ct = /^(?:script|style|textarea|title)$/i, lr = (e) => (t, ...r) => ({ _$litType$: e, strings: t, values: r }), d = lr(1), J = Symbol.for("lit-noChange"), u = Symbol.for("lit-nothing"), it = /* @__PURE__ */ new WeakMap(), N = F.createTreeWalker(F, 129);
function Pt(e, t) {
  if (!je(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Ze !== void 0 ? Ze.createHTML(t) : t;
}
const dr = (e, t) => {
  const r = e.length - 1, i = [];
  let a, o = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", n = K;
  for (let s = 0; s < r; s++) {
    const c = e[s];
    let l, p, h = -1, _ = 0;
    for (; _ < c.length && (n.lastIndex = _, p = n.exec(c), p !== null); ) _ = n.lastIndex, n === K ? p[1] === "!--" ? n = Qe : p[1] !== void 0 ? n = et : p[2] !== void 0 ? (Ct.test(p[2]) && (a = RegExp("</" + p[2], "g")), n = z) : p[3] !== void 0 && (n = z) : n === z ? p[0] === ">" ? (n = a ?? K, h = -1) : p[1] === void 0 ? h = -2 : (h = n.lastIndex - p[2].length, l = p[1], n = p[3] === void 0 ? z : p[3] === '"' ? rt : tt) : n === rt || n === tt ? n = z : n === Qe || n === et ? n = K : (n = z, a = void 0);
    const b = n === z && e[s + 1].startsWith("/>") ? " " : "";
    o += n === K ? c + sr : h >= 0 ? (i.push(l), c.slice(0, h) + Ot + c.slice(h) + C + b) : c + C + (h === -2 ? s : b);
  }
  return [Pt(e, o + (e[r] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class se {
  constructor({ strings: t, _$litType$: r }, i) {
    let a;
    this.parts = [];
    let o = 0, n = 0;
    const s = t.length - 1, c = this.parts, [l, p] = dr(t, r);
    if (this.el = se.createElement(l, i), N.currentNode = this.el.content, r === 2 || r === 3) {
      const h = this.el.content.firstChild;
      h.replaceWith(...h.childNodes);
    }
    for (; (a = N.nextNode()) !== null && c.length < s; ) {
      if (a.nodeType === 1) {
        if (a.hasAttributes()) for (const h of a.getAttributeNames()) if (h.endsWith(Ot)) {
          const _ = p[n++], b = a.getAttribute(h).split(C), y = /([.?@])?(.*)/.exec(_);
          c.push({ type: 1, index: o, name: y[2], strings: b, ctor: y[1] === "." ? hr : y[1] === "?" ? ur : y[1] === "@" ? _r : ye }), a.removeAttribute(h);
        } else h.startsWith(C) && (c.push({ type: 6, index: o }), a.removeAttribute(h));
        if (Ct.test(a.tagName)) {
          const h = a.textContent.split(C), _ = h.length - 1;
          if (_ > 0) {
            a.textContent = ge ? ge.emptyScript : "";
            for (let b = 0; b < _; b++) a.append(h[b], oe()), N.nextNode(), c.push({ type: 2, index: ++o });
            a.append(h[_], oe());
          }
        }
      } else if (a.nodeType === 8) if (a.data === Et) c.push({ type: 2, index: o });
      else {
        let h = -1;
        for (; (h = a.data.indexOf(C, h + 1)) !== -1; ) c.push({ type: 7, index: o }), h += C.length - 1;
      }
      o++;
    }
  }
  static createElement(t, r) {
    const i = F.createElement("template");
    return i.innerHTML = t, i;
  }
}
function q(e, t, r = e, i) {
  var n, s;
  if (t === J) return t;
  let a = i !== void 0 ? (n = r._$Co) == null ? void 0 : n[i] : r._$Cl;
  const o = ne(t) ? void 0 : t._$litDirective$;
  return (a == null ? void 0 : a.constructor) !== o && ((s = a == null ? void 0 : a._$AO) == null || s.call(a, !1), o === void 0 ? a = void 0 : (a = new o(e), a._$AT(e, r, i)), i !== void 0 ? (r._$Co ?? (r._$Co = []))[i] = a : r._$Cl = a), a !== void 0 && (t = q(e, a._$AS(e, t.values), a, i)), t;
}
class pr {
  constructor(t, r) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = r;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: r }, parts: i } = this._$AD, a = ((t == null ? void 0 : t.creationScope) ?? F).importNode(r, !0);
    N.currentNode = a;
    let o = N.nextNode(), n = 0, s = 0, c = i[0];
    for (; c !== void 0; ) {
      if (n === c.index) {
        let l;
        c.type === 2 ? l = new de(o, o.nextSibling, this, t) : c.type === 1 ? l = new c.ctor(o, c.name, c.strings, this, t) : c.type === 6 && (l = new mr(o, this, t)), this._$AV.push(l), c = i[++s];
      }
      n !== (c == null ? void 0 : c.index) && (o = N.nextNode(), n++);
    }
    return N.currentNode = F, a;
  }
  p(t) {
    let r = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, r), r += i.strings.length - 2) : i._$AI(t[r])), r++;
  }
}
class de {
  get _$AU() {
    var t;
    return ((t = this._$AM) == null ? void 0 : t._$AU) ?? this._$Cv;
  }
  constructor(t, r, i, a) {
    this.type = 2, this._$AH = u, this._$AN = void 0, this._$AA = t, this._$AB = r, this._$AM = i, this.options = a, this._$Cv = (a == null ? void 0 : a.isConnected) ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const r = this._$AM;
    return r !== void 0 && (t == null ? void 0 : t.nodeType) === 11 && (t = r.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, r = this) {
    t = q(this, t, r), ne(t) ? t === u || t == null || t === "" ? (this._$AH !== u && this._$AR(), this._$AH = u) : t !== this._$AH && t !== J && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : cr(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== u && ne(this._$AH) ? this._$AA.nextSibling.data = t : this.T(F.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    var o;
    const { values: r, _$litType$: i } = t, a = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = se.createElement(Pt(i.h, i.h[0]), this.options)), i);
    if (((o = this._$AH) == null ? void 0 : o._$AD) === a) this._$AH.p(r);
    else {
      const n = new pr(a, this), s = n.u(this.options);
      n.p(r), this.T(s), this._$AH = n;
    }
  }
  _$AC(t) {
    let r = it.get(t.strings);
    return r === void 0 && it.set(t.strings, r = new se(t)), r;
  }
  k(t) {
    je(this._$AH) || (this._$AH = [], this._$AR());
    const r = this._$AH;
    let i, a = 0;
    for (const o of t) a === r.length ? r.push(i = new de(this.O(oe()), this.O(oe()), this, this.options)) : i = r[a], i._$AI(o), a++;
    a < r.length && (this._$AR(i && i._$AB.nextSibling, a), r.length = a);
  }
  _$AR(t = this._$AA.nextSibling, r) {
    var i;
    for ((i = this._$AP) == null ? void 0 : i.call(this, !1, !0, r); t !== this._$AB; ) {
      const a = Ve(t).nextSibling;
      Ve(t).remove(), t = a;
    }
  }
  setConnected(t) {
    var r;
    this._$AM === void 0 && (this._$Cv = t, (r = this._$AP) == null || r.call(this, t));
  }
}
class ye {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, r, i, a, o) {
    this.type = 1, this._$AH = u, this._$AN = void 0, this.element = t, this.name = r, this._$AM = a, this.options = o, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = u;
  }
  _$AI(t, r = this, i, a) {
    const o = this.strings;
    let n = !1;
    if (o === void 0) t = q(this, t, r, 0), n = !ne(t) || t !== this._$AH && t !== J, n && (this._$AH = t);
    else {
      const s = t;
      let c, l;
      for (t = o[0], c = 0; c < o.length - 1; c++) l = q(this, s[i + c], r, c), l === J && (l = this._$AH[c]), n || (n = !ne(l) || l !== this._$AH[c]), l === u ? t = u : t !== u && (t += (l ?? "") + o[c + 1]), this._$AH[c] = l;
    }
    n && !a && this.j(t);
  }
  j(t) {
    t === u ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class hr extends ye {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === u ? void 0 : t;
  }
}
class ur extends ye {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== u);
  }
}
class _r extends ye {
  constructor(t, r, i, a, o) {
    super(t, r, i, a, o), this.type = 5;
  }
  _$AI(t, r = this) {
    if ((t = q(this, t, r, 0) ?? u) === J) return;
    const i = this._$AH, a = t === u && i !== u || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, o = t !== u && (i === u || a);
    a && this.element.removeEventListener(this.name, this, i), o && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    var r;
    typeof this._$AH == "function" ? this._$AH.call(((r = this.options) == null ? void 0 : r.host) ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class mr {
  constructor(t, r, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = r, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    q(this, t);
  }
}
const ke = ee.litHtmlPolyfillSupport;
ke == null || ke(se, de), (ee.litHtmlVersions ?? (ee.litHtmlVersions = [])).push("3.3.3");
const fr = (e, t, r) => {
  const i = (r == null ? void 0 : r.renderBefore) ?? t;
  let a = i._$litPart$;
  if (a === void 0) {
    const o = (r == null ? void 0 : r.renderBefore) ?? null;
    i._$litPart$ = a = new de(t.insertBefore(oe(), o), o, void 0, r ?? {});
  }
  return a._$AI(e), a;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const B = globalThis;
class Y extends j {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var r;
    const t = super.createRenderRoot();
    return (r = this.renderOptions).renderBefore ?? (r.renderBefore = t.firstChild), t;
  }
  update(t) {
    const r = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = fr(r, this.renderRoot, this.renderOptions);
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
    return J;
  }
}
var kt;
Y._$litElement$ = !0, Y.finalized = !0, (kt = B.litElementHydrateSupport) == null || kt.call(B, { LitElement: Y });
const Se = B.litElementPolyfillSupport;
Se == null || Se({ LitElement: Y });
(B.litElementVersions ?? (B.litElementVersions = [])).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Dt = (e) => (t, r) => {
  r !== void 0 ? r.addInitializer(() => {
    customElements.define(e, t);
  }) : customElements.define(e, t);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const gr = { attribute: !0, type: String, converter: fe, reflect: !1, hasChanged: He }, br = (e = gr, t, r) => {
  const { kind: i, metadata: a } = r;
  let o = globalThis.litPropertyMetadata.get(a);
  if (o === void 0 && globalThis.litPropertyMetadata.set(a, o = /* @__PURE__ */ new Map()), i === "setter" && ((e = Object.create(e)).wrapped = !0), o.set(r.name, e), i === "accessor") {
    const { name: n } = r;
    return { set(s) {
      const c = t.get.call(this);
      t.set.call(this, s), this.requestUpdate(n, c, e, !0, s);
    }, init(s) {
      return s !== void 0 && this.C(n, void 0, e, s), s;
    } };
  }
  if (i === "setter") {
    const { name: n } = r;
    return function(s) {
      const c = this[n];
      t.call(this, s), this.requestUpdate(n, c, e, !0, s);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function Ie(e) {
  return (t, r) => typeof r == "object" ? br(e, t, r) : ((i, a, o) => {
    const n = a.hasOwnProperty(o);
    return a.constructor.createProperty(o, i), n ? Object.getOwnPropertyDescriptor(a, o) : void 0;
  })(e, t, r);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function g(e) {
  return Ie({ ...e, state: !0, attribute: !1 });
}
const I = 1, te = 600, V = 0, Z = 5, Ae = {
  open_time_s: 20,
  close_time_s: 20,
  direction_settle_s: 0.5
};
async function at(e, t) {
  return e.callWS({
    type: "conx_dynamic_panel/get_config",
    entry_id: t
  });
}
async function vr(e, t, r, i) {
  return e.callWS({
    type: "conx_dynamic_panel/update_profile",
    entry_id: t,
    profile_id: r,
    profile: i
  });
}
async function yr(e, t, r) {
  return e.callWS({
    type: "conx_dynamic_panel/create_profile",
    entry_id: t,
    profile: r
  });
}
async function xr(e, t, r) {
  return e.callWS({
    type: "conx_dynamic_panel/delete_profile",
    entry_id: t,
    profile_id: r
  });
}
async function $r(e, t, r, i, a) {
  const o = {
    type: "conx_dynamic_panel/duplicate_profile",
    entry_id: t,
    profile_id: r,
    new_id: i
  };
  return a !== void 0 && (o.new_name = a), e.callWS(o);
}
function wr(e, t = Date.now()) {
  return `${(e || "").trim() || "profile"}_copy_${t}`;
}
function ot(e, t) {
  if (e === null)
    return null;
  const r = e.trim();
  return r || `${(t || "").trim()} copy`.trim() || "copy";
}
async function Oe(e, t, r, i = !1) {
  return e.callWS({
    type: "conx_dynamic_panel/set_active_profile",
    entry_id: t,
    profile_id: r,
    sync: i
  });
}
async function kr(e, t) {
  return e.callWS({
    type: "conx_dynamic_panel/sync",
    entry_id: t
  });
}
async function Sr(e, t) {
  return e.callWS({
    type: "conx_dynamic_panel/pull",
    entry_id: t
  });
}
async function Ar(e, t) {
  return e.callWS({
    type: "conx_dynamic_panel/export_profiles",
    entry_id: t
  });
}
async function Or(e, t, r, i = "merge") {
  return e.callWS({
    type: "conx_dynamic_panel/import_profiles",
    entry_id: t,
    payload: r,
    mode: i
  });
}
async function Er(e, t) {
  return e.callWS({
    type: "conx_dynamic_panel/export_scheduler",
    entry_id: t
  });
}
async function Cr(e, t, r, i = "merge") {
  return e.callWS({
    type: "conx_dynamic_panel/import_scheduler",
    entry_id: t,
    payload: r,
    mode: i
  });
}
async function Pr(e, t, r) {
  return e.callWS({
    type: "conx_dynamic_panel/update_panel_name",
    entry_id: t,
    panel_name: r
  });
}
async function Dr(e, t, r, i) {
  const a = {
    type: "conx_dynamic_panel/cover_command",
    entry_id: t,
    command: r
  };
  return i && (a.cover_id = i), e.callWS(a);
}
async function Tr(e, t, r) {
  return e.callWS({
    type: "conx_dynamic_panel/execute_button",
    entry_id: t,
    button: r
  });
}
async function Rr(e, t, r) {
  const i = await e.callWS({
    type: "conx_dynamic_panel/upsert_scheduler_task",
    entry_id: t,
    task: r
  });
  return i.config || i;
}
async function Mr(e, t, r) {
  return e.callWS({
    type: "conx_dynamic_panel/delete_scheduler_task",
    entry_id: t,
    task_id: r
  });
}
async function zr(e, t, r) {
  return e.callWS({
    type: "conx_dynamic_panel/set_default_profile",
    entry_id: t,
    profile_id: r
  });
}
async function Lr(e, t, r, i = "panel") {
  return e.callWS({
    type: "conx_dynamic_panel/set_holiday_mode",
    entry_id: t,
    enabled: r,
    scope: i
  });
}
async function Nr(e, t, r, i) {
  return e.callWS({
    type: "conx_dynamic_panel/set_scheduler_task_enabled",
    entry_id: t,
    task_id: r,
    enabled: i
  });
}
async function Br(e, t, r) {
  var i;
  return (i = e.connection) != null && i.subscribeMessage ? e.connection.subscribeMessage(r, {
    type: "conx_dynamic_panel/subscribe",
    entry_id: t
  }) : () => {
  };
}
function re(e, t, r, i) {
  const a = typeof e == "number" ? e : Number(e);
  return Number.isFinite(a) ? Math.max(t, Math.min(r, a)) : i;
}
function k(e) {
  return Math.round(re(e, 1, 4, 4));
}
const Fr = /* @__PURE__ */ new Set([
  "radio_mandatory",
  "radio_optional",
  "radio_split",
  "cover"
]), Tt = 0.1, Rt = 600, D = 2, Te = [
  "toggle",
  "momentary",
  "radio",
  "cover_open",
  "cover_close"
], Hr = /* @__PURE__ */ new Set(["radio", "cover_open", "cover_close"]);
function ie(e, t = D) {
  return re(e, Tt, Rt, t);
}
function Mt(e, t) {
  const r = String(e || "").trim().toLowerCase();
  return Te.includes(r) ? r : String(t || "").trim().toLowerCase() === "momentary" ? "momentary" : "toggle";
}
function Re(e) {
  return k(e) > 1 ? [...Te] : Te.filter((t) => !Hr.has(t));
}
function zt(e) {
  return Fr.has(e);
}
function nt(e, t) {
  return k(t) > 1 ? [...e] : e.filter((r) => !zt(r));
}
function Me(e, t) {
  return k(t) === 1 && zt(e) ? "toggle" : e;
}
function ze(e) {
  return Math.max(0, Math.floor(k(e) / 2));
}
function jr(e, t) {
  const r = e * 2 + 1, i = e * 2 + 2;
  return i > t ? [1, t >= 2 ? 2 : 1] : [r, i];
}
function st(e, t, r) {
  const i = Math.round(typeof e == "number" ? e : Number(e)), a = k(r);
  return !Number.isFinite(i) || i < 1 || i > a ? Math.min(t, a) : i;
}
function G(e, t = {}) {
  const r = k(t.gangCount ?? 4), i = t.slot ?? 0, a = t.defaultId ?? `cover_${i + 1}`, [o, n] = jr(i, r), s = e || {}, c = st(s.open_button, o, r);
  let l = st(s.close_button, n, r);
  l === c && (l = Array.from({ length: r }, (_, b) => b + 1).find((_) => _ !== c) ?? Math.min(c + 1, r));
  const p = s.ha_entity_id ?? s.entity_id, h = typeof p == "string" && p.trim().startsWith("cover.") ? p.trim() : null;
  return {
    id: String(s.id || "").trim() || a,
    open_button: c,
    close_button: l,
    open_time_s: re(
      s.open_time_s,
      I,
      te,
      Ae.open_time_s
    ),
    close_time_s: re(
      s.close_time_s,
      I,
      te,
      Ae.close_time_s
    ),
    direction_settle_s: re(
      s.direction_settle_s,
      V,
      Z,
      Ae.direction_settle_s
    ),
    opposite_press: s.opposite_press === "stop_then_reverse" ? "stop_then_reverse" : "stop_only",
    ha_entity_id: h
  };
}
function E(e) {
  const t = k((e == null ? void 0 : e.gang_count) ?? 4), r = ze(t);
  let i = [];
  if (Array.isArray(e == null ? void 0 : e.covers) && e.covers.length ? i = e.covers.map(
    (o, n) => G(o, { gangCount: t, defaultId: `cover_${n + 1}`, slot: n })
  ) : e != null && e.cover ? i = [G(e.cover, { gangCount: t, defaultId: "cover_1", slot: 0 })] : r > 0 && (i = [G(void 0, { gangCount: t, defaultId: "cover_1", slot: 0 })]), r === 0)
    return [];
  i = i.slice(0, r);
  const a = /* @__PURE__ */ new Set();
  return i.map((o, n) => {
    let s = o.id || `cover_${n + 1}`, c = 2;
    for (; a.has(s); )
      s = `${o.id || `cover_${n + 1}`}_${c}`, c += 1;
    return a.add(s), { ...o, id: s };
  });
}
function Lt(e) {
  const t = structuredClone(e);
  t.gang_count = k(t.gang_count ?? 4);
  let r = String(t.mode || "toggle");
  r === "momentary_mix" && (r = "mixed"), t.mode = Me(r, t.gang_count), typeof t.backlight_brightness != "number" || !Number.isFinite(t.backlight_brightness) ? t.backlight_brightness = 100 : t.backlight_brightness = Math.max(
    0,
    Math.min(100, Math.round(t.backlight_brightness))
  );
  const i = new Set(Re(t.gang_count));
  t.buttons = [1, 2, 3, 4].map((s) => {
    var p;
    const c = (p = t.buttons) == null ? void 0 : p.find((h) => h.index === s);
    let l = Mt(c == null ? void 0 : c.role, c == null ? void 0 : c.press_mode);
    return i.has(l) || (l = "toggle"), {
      index: s,
      name: (c == null ? void 0 : c.name) ?? `Button ${s}`,
      action: (c == null ? void 0 : c.action) ?? null,
      action_double: (c == null ? void 0 : c.action_double) ?? null,
      radio_member: (c == null ? void 0 : c.radio_member) !== !1,
      role: l,
      pulse_time_s: ie(c == null ? void 0 : c.pulse_time_s, D),
      cover_id: l === "cover_open" || l === "cover_close" ? String((c == null ? void 0 : c.cover_id) || "cover_1").trim() || "cover_1" : null
    };
  });
  const a = Array.isArray(t.radio_groups) ? t.radio_groups : [], o = new Set(
    t.buttons.filter((s) => s.role === "radio" && s.index <= t.gang_count).map((s) => s.index)
  ), n = a.map((s, c) => ({
    id: String((s == null ? void 0 : s.id) || `g${c + 1}`),
    buttons: Array.isArray(s == null ? void 0 : s.buttons) ? s.buttons.map((l) => Number(l)).filter(
      (l, p, h) => l >= 1 && l <= t.gang_count && h.indexOf(l) === p && (t.mode !== "mixed" || o.has(l))
    ) : []
  }));
  for (; n.length < 2; )
    n.push({ id: `g${n.length + 1}`, buttons: [] });
  return t.radio_groups = n, t.covers = E(t), delete t.cover, t.selected_button != null && (t.selected_button < 1 || t.selected_button > t.gang_count) && (t.selected_button = null), t;
}
function X(e) {
  return Lt(e);
}
function Ir(e, t) {
  return !e || !t ? e === t : JSON.stringify(e) === JSON.stringify(t);
}
function ct(e, t) {
  const r = new Blob([JSON.stringify(t, null, 2)], {
    type: "application/json"
  }), i = URL.createObjectURL(r), a = document.createElement("a");
  a.href = i, a.download = e, a.click(), URL.revokeObjectURL(i);
}
const L = 1440, lt = [
  "scheduler.day_mon",
  "scheduler.day_tue",
  "scheduler.day_wed",
  "scheduler.day_thu",
  "scheduler.day_fri",
  "scheduler.day_sat",
  "scheduler.day_sun"
], Ur = [
  "eq",
  "neq",
  "gt",
  "lt",
  "gte",
  "lte"
];
function pe(e) {
  const t = String(e || "").trim();
  if (!/^\d{2}:\d{2}$/.test(t))
    throw new Error(`Invalid time '${e}'`);
  const [r, i] = t.split(":").map((a) => Number(a));
  if (r < 0 || r > 23 || i < 0 || i > 59)
    throw new Error(`Invalid time '${e}'`);
  return r * 60 + i;
}
function dt(e, t) {
  const r = (e % L + L) % L, i = (t % L + L) % L, a = /* @__PURE__ */ new Set();
  if (r === i)
    return a.add(r), a;
  if (r < i) {
    for (let o = r; o < i; o += 1) a.add(o);
    return a;
  }
  for (let o = r; o < L; o += 1) a.add(o);
  for (let o = 0; o < i; o += 1) a.add(o);
  return a;
}
function Wr(e, t) {
  const r = dt(pe(e.start), pe(e.end)), i = dt(pe(t.start), pe(t.end));
  for (const a of r)
    if (i.has(a)) return !0;
  return !1;
}
function Yr(e) {
  const t = e.filter((i) => i.enabled), r = [];
  for (let i = 0; i < t.length; i += 1) {
    const a = t[i];
    for (let o = i; o < t.length; o += 1) {
      const n = t[o], s = a.id === n.id, c = a.weekdays.filter((p) => n.weekdays.includes(p)), l = a.months.filter((p) => n.months.includes(p));
      if (!(!c.length || !l.length))
        for (let p = 0; p < a.ranges.length; p += 1) {
          const h = a.ranges[p], _ = s ? p + 1 : 0;
          for (let b = _; b < n.ranges.length; b += 1) {
            const y = n.ranges[b];
            h.profile_id !== y.profile_id && Wr(h, y) && r.push({
              task_a_id: a.id,
              task_a_name: a.name,
              range_a: h,
              task_b_id: n.id,
              task_b_name: n.name,
              range_b: y,
              weekdays: c,
              months: l,
              message: `Conflict: '${a.name}' (${h.start}–${h.end} → ${h.profile_id}) overlaps '${n.name}' (${y.start}–${y.end} → ${y.profile_id})`
            });
          }
        }
    }
  }
  return r;
}
function pt(e, t, r) {
  return [
    ...e.filter((i) => (i.scope || "local") !== "master"),
    ...t.filter(
      (i) => (i.scope || "master") === "master" && (i.entry_ids || []).includes(r)
    )
  ];
}
function ht(e) {
  return e != null && e.length ? e.map((t) => ({
    entity_id: String(t.entity_id || "").trim(),
    operator: t.operator || "eq",
    value: String(t.value ?? "")
  })).filter((t) => !!t.entity_id) : [];
}
function Gr() {
  return { entity_id: "", operator: "eq", value: "" };
}
function Nt(e = "task") {
  return `${e}_${Date.now().toString(36)}`;
}
function Bt(e, t) {
  return {
    id: Nt("task"),
    name: "Schedule",
    enabled: !0,
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    // Prefer a non-default profile when available so the faceplate next-row
    // can show a real profile change after save.
    ranges: [
      {
        start: "08:00",
        end: "17:00",
        profile_id: t || e
      }
    ],
    notes: "",
    scope: "local",
    entry_ids: [],
    conditions: []
  };
}
function Jr(e, t, r) {
  return {
    ...Bt(e, r),
    id: Nt("master"),
    name: "Master schedule",
    scope: "master",
    entry_ids: [...t]
  };
}
const qr = "YOUR_ENTRY_ID", Ee = [
  { id: "morning", at: "06:30:00", profile: "morning" },
  { id: "evening", at: "18:00:00", profile: "evening" },
  { id: "night", at: "23:00:00", profile: "night" }
];
function ut(e, t) {
  const r = (e || "").trim();
  return r || t;
}
function Ce(e) {
  return String(e).split(`
`).map((t) => `# ${t.trim()}`.trimEnd());
}
function Kr(e) {
  const { comments: t } = e, r = ut(e.entryId, qr), i = {
    morning: t.morning,
    evening: t.evening,
    night: t.night
  }, a = (n) => {
    var s;
    return ut((s = e.profileIds) == null ? void 0 : s[n], Ee[n].profile);
  }, o = [
    ...Ce(t.header),
    ...Ce(t.sync),
    ...Ce(t.ids),
    `alias: ${t.alias}`,
    "mode: single",
    "triggers:"
  ];
  return Ee.forEach((n) => {
    o.push(`  # ${i[n.id]}`), o.push("  - trigger: time"), o.push(`    at: "${n.at}"`), o.push(`    id: ${n.id}`);
  }), o.push("actions:"), o.push("  - choose:"), Ee.forEach((n, s) => {
    o.push("      - conditions:"), o.push("          - condition: trigger"), o.push(`            id: ${n.id}`), o.push("        sequence:"), o.push("          - action: conx_dynamic_panel.activate_profile"), o.push("            data:"), o.push(`              entry_id: ${r}`), o.push(`              profile_id: ${a(s)}`), o.push("              sync: true");
  }), `${o.join(`
`)}
`;
}
const ae = 2, Xr = /* @__PURE__ */ new Set([3, 4, 5]), Vr = /* @__PURE__ */ new Set([
  "toggle",
  "radio_mandatory",
  "radio_optional",
  "radio_split",
  "mixed",
  "cover",
  "momentary_mix"
  // legacy alias → mixed via normalizeProfile
]);
function Zr(e) {
  const t = [];
  for (Array.isArray(e) && e.forEach((r, i) => {
    if (!$(r)) return;
    const a = [], o = Array.isArray(r.buttons) ? r.buttons : [];
    for (const n of o) {
      const s = Number(n);
      s >= 1 && s <= 4 && !a.includes(s) && a.push(s);
    }
    t.push({ id: String(r.id || `g${i + 1}`), buttons: a });
  }); t.length < 2; )
    t.push({ id: `g${t.length + 1}`, buttons: [] });
  return t;
}
function $(e) {
  return typeof e == "object" && e !== null && !Array.isArray(e);
}
function Qr(e) {
  return !Number.isInteger(e) || e < 1 ? !1 : e <= ae ? !0 : Xr.has(e);
}
function ei(e) {
  if ($(e)) {
    const t = Object.entries(e);
    if (!t.length)
      return { ok: !1, error: "profiles must be a non-empty object or array" };
    const r = {};
    for (const [i, a] of t) {
      const o = mt(a, i);
      if (!o.ok)
        return o;
      r[o.profile.id] = o.profile;
    }
    return { ok: !0, profiles: r };
  }
  if (Array.isArray(e)) {
    if (!e.length)
      return { ok: !1, error: "profiles must be a non-empty object or array" };
    const t = {};
    for (let r = 0; r < e.length; r += 1) {
      const i = mt(e[r], void 0);
      if (!i.ok)
        return { ok: !1, error: `${i.error} (index ${r})` };
      t[i.profile.id] = i.profile;
    }
    return { ok: !0, profiles: t };
  }
  return { ok: !1, error: "profiles must be a non-empty object or array" };
}
function _t(e) {
  return !$(e) || typeof e.action != "string" || !e.action ? null : {
    action: e.action,
    target: $(e.target) ? e.target : {},
    data: $(e.data) ? e.data : {}
  };
}
function mt(e, t) {
  if (!$(e))
    return { ok: !1, error: "each profile must be an object" };
  const r = String(e.id || t || "").trim();
  if (!r)
    return { ok: !1, error: "profile is missing id" };
  const i = String(e.mode || "toggle");
  if (!Vr.has(i))
    return { ok: !1, error: `unsupported mode for profile ${r}: ${i}` };
  if (e.backlight_brightness !== void 0 && e.backlight_brightness !== null) {
    const l = Number(e.backlight_brightness);
    if (!Number.isFinite(l))
      return { ok: !1, error: `invalid backlight_brightness for profile ${r}` };
  }
  const a = Array.isArray(e.buttons) ? e.buttons : [], o = [1, 2, 3, 4].map((l) => {
    const p = a.find(
      (_) => $(_) && Number(_.index) === l
    );
    if (!$(p))
      return {
        index: l,
        name: `Button ${l}`,
        action: null,
        action_double: null,
        radio_member: !0,
        role: "toggle",
        pulse_time_s: D,
        cover_id: null
      };
    const h = Mt(
      p.role,
      p.press_mode
    );
    return {
      index: l,
      name: String(p.name ?? `Button ${l}`),
      action: _t(p.action),
      action_double: _t(p.action_double),
      radio_member: p.radio_member === void 0 ? !0 : !!p.radio_member,
      role: h,
      pulse_time_s: ie(p.pulse_time_s, D),
      cover_id: h === "cover_open" || h === "cover_close" ? String(p.cover_id || "cover_1").trim() || "cover_1" : null
    };
  }), n = Math.max(1, Math.min(4, Number(e.gang_count) || 4)), s = {
    id: r,
    name: String(e.name || r),
    mode: i,
    color_on: String(e.color_on || "cyan"),
    color_off: String(e.color_off || "blue"),
    radar: String(e.radar || "30s"),
    backlight: !!(e.backlight ?? !0),
    backlight_brightness: e.backlight_brightness === void 0 || e.backlight_brightness === null ? 100 : Math.max(0, Math.min(100, Math.round(Number(e.backlight_brightness)))),
    child_lock: !!(e.child_lock ?? !1),
    selected_button: e.selected_button === null || e.selected_button === void 0 ? null : Number(e.selected_button),
    gang_count: n,
    buttons: o,
    radio_groups: Zr(e.radio_groups),
    covers: Array.isArray(e.covers) ? e.covers : void 0,
    cover: $(e.cover) ? e.cover : void 0
  }, c = Lt(s);
  return c.covers = E(c), { ok: !0, profile: c };
}
function ti(e) {
  if (!$(e))
    return { ok: !1, error: "Root must be a JSON object" };
  const t = e.schema_version ?? ae, r = Number(t);
  if (!Number.isInteger(r) || r < 1)
    return { ok: !1, error: "schema_version must be a positive integer" };
  if (!Qr(r))
    return {
      ok: !1,
      error: `Unsupported schema_version ${r}; current is ${ae}`
    };
  const i = ei(e.profiles);
  if (!i.ok)
    return i;
  let a = null;
  return typeof e.active_profile_id == "string" && e.active_profile_id && (a = e.active_profile_id, !(a in i.profiles)) ? {
    ok: !1,
    error: `active_profile_id "${a}" is not present in profiles`
  } : {
    ok: !0,
    payload: {
      schema_version: ae,
      active_profile_id: a,
      profiles: i.profiles
    }
  };
}
function ri(e, t) {
  return {
    schema_version: ae,
    active_profile_id: t,
    profiles: structuredClone(e)
  };
}
function ii(e, t, r = "YOUR_CONFIG_ENTRY_ID") {
  const i = JSON.stringify(e, null, 2).split(`
`).map((a, o) => o === 0 ? a : `    ${a}`).join(`
`);
  return [
    "service: conx_dynamic_panel.import_profiles",
    "data:",
    `  entry_id: ${r}`,
    `  mode: ${t}`,
    `  payload: ${i}`
  ].join(`
`);
}
const he = 1, ue = "scheduler";
function ft(e, t) {
  if (e == null)
    return { ok: !0, tasks: {} };
  if ($(e)) {
    const r = {};
    for (const [i, a] of Object.entries(e)) {
      if (!$(a))
        return { ok: !1, error: `${t}.${i} must be an object` };
      const o = String(a.id || i).trim();
      if (!o)
        return { ok: !1, error: `${t} entry is missing id` };
      r[o] = { ...a, id: o };
    }
    return { ok: !0, tasks: r };
  }
  if (Array.isArray(e)) {
    const r = {};
    for (let i = 0; i < e.length; i += 1) {
      const a = e[i];
      if (!$(a))
        return { ok: !1, error: `${t}[${i}] must be an object` };
      const o = String(a.id || "").trim();
      if (!o)
        return { ok: !1, error: `${t}[${i}] is missing id` };
      r[o] = { ...a, id: o };
    }
    return { ok: !0, tasks: r };
  }
  return { ok: !1, error: `${t} must be an object or array` };
}
function ai(e) {
  if (!$(e))
    return { ok: !1, error: "Root must be a JSON object" };
  const t = String(e.scope || ue).trim().toLowerCase();
  if (t !== ue)
    return {
      ok: !1,
      error: `Unsupported scope "${t}"; expected "${ue}"`
    };
  const r = e.schema_version ?? he, i = Number(r);
  if (!Number.isInteger(i) || i < 1)
    return { ok: !1, error: "schema_version must be a positive integer" };
  if (i > he)
    return {
      ok: !1,
      error: `Unsupported schema_version ${i}; current is ${he}`
    };
  const a = ft(e.scheduler_tasks, "scheduler_tasks");
  if (!a.ok)
    return a;
  const o = ft(
    e.master_scheduler_tasks,
    "master_scheduler_tasks"
  );
  if (!o.ok)
    return o;
  let n;
  return e.default_profile_id === null || e.default_profile_id === void 0 ? n = e.default_profile_id : n = String(e.default_profile_id).trim() || null, {
    ok: !0,
    payload: {
      schema_version: he,
      scope: ue,
      entry_id: typeof e.entry_id == "string" ? e.entry_id : void 0,
      default_profile_id: n,
      scheduler_tasks: a.tasks,
      master_scheduler_tasks: o.tasks,
      notes: typeof e.notes == "string" ? e.notes : void 0
    }
  };
}
const oi = /^([A-Za-z_][\w.-]*)\s*:\s*(.*?)\s*$/;
function ni(e) {
  return !e || /^[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/.test(e) || /^(true|false|null|yes|no|on|off)$/i.test(e) ? !0 : /[:#{}[\],&*!|>'"%@`]|\s/.test(e) || e !== e.trim();
}
function si(e) {
  return e == null ? "null" : typeof e == "boolean" || typeof e == "number" ? String(e) : typeof e == "string" ? ni(e) ? JSON.stringify(e) : e : JSON.stringify(e);
}
function Ft(e) {
  if (!e || typeof e != "object" || Array.isArray(e))
    return "";
  const t = Object.keys(e);
  return t.length ? t.map((r) => `${r}: ${si(e[r])}`).join(`
`) : "";
}
function ci(e) {
  const t = e.trim();
  if (!t)
    return "";
  if (t.startsWith('"') && t.endsWith('"') || t.startsWith("'") && t.endsWith("'"))
    try {
      return t.startsWith('"') ? JSON.parse(t) : t.slice(1, -1).replace(/\\'/g, "'");
    } catch {
      return t.slice(1, -1);
    }
  if (t === "null" || t === "~")
    return null;
  if (t === "true" || t === "yes" || t === "on")
    return !0;
  if (t === "false" || t === "no" || t === "off")
    return !1;
  if (/^[-+]?\d+$/.test(t)) {
    const r = Number(t);
    if (Number.isSafeInteger(r))
      return r;
  }
  if (/^[-+]?(\d+\.\d*|\.\d+)([eE][-+]?\d+)?$/.test(t)) {
    const r = Number(t);
    if (!Number.isNaN(r))
      return r;
  }
  if (t.startsWith("{") && t.endsWith("}") || t.startsWith("[") && t.endsWith("]"))
    try {
      return JSON.parse(t);
    } catch {
    }
  return t;
}
function be(e) {
  const t = e.replace(/^\uFEFF/, "").trim();
  if (!t)
    return { ok: !0, data: {} };
  if (t.startsWith("{"))
    try {
      const a = JSON.parse(t);
      return !a || typeof a != "object" || Array.isArray(a) ? { ok: !1, error: "JSON data must be an object" } : { ok: !0, data: { ...a } };
    } catch (a) {
      return { ok: !1, error: a instanceof Error ? a.message : "Invalid JSON" };
    }
  const r = {}, i = t.split(/\r?\n/);
  for (let a = 0; a < i.length; a += 1) {
    const o = i[a].trim();
    if (!o || o.startsWith("#"))
      continue;
    const n = oi.exec(o);
    if (!n)
      return {
        ok: !1,
        error: `Invalid line ${a + 1}: expected key: value`
      };
    const s = n[1];
    r[s] = ci(n[2]);
  }
  return { ok: !0, data: r };
}
function li(e, t) {
  const r = (i) => {
    const a = i && typeof i == "object" && !Array.isArray(i) ? i : {}, o = {};
    for (const n of Object.keys(a).sort())
      o[n] = a[n];
    return JSON.stringify(o);
  };
  return r(e) === r(t);
}
function di(e) {
  if (!e)
    return [];
  const t = [];
  for (const r of Object.keys(e).sort()) {
    const i = e[r];
    if (!(!i || typeof i != "object"))
      for (const a of Object.keys(i).sort())
        t.push(`${r}.${a}`);
  }
  return t;
}
function Le(e) {
  if (!e)
    return null;
  const t = e.trim(), r = t.indexOf(".");
  return r <= 0 || r === t.length - 1 ? null : t.slice(0, r);
}
function gt(e, t) {
  if (!e)
    return [];
  const r = (t == null ? void 0 : t.trim()) || null;
  return Object.keys(e).filter((i) => r ? i.startsWith(`${r}.`) : !0).sort();
}
function Ht() {
  return typeof customElements < "u" && typeof customElements.get == "function" && !!customElements.get("ha-entity-picker");
}
function jt() {
  return typeof customElements < "u" && typeof customElements.get == "function" && !!customElements.get("ha-service-picker");
}
async function pi() {
  var i, a, o;
  const e = () => ({
    entity: Ht(),
    service: jt()
  }), t = e();
  if (t.entity && t.service)
    return t;
  const r = globalThis.loadCardHelpers;
  if (typeof r != "function")
    return t;
  try {
    const n = await r(), s = await ((i = n.createCardElement) == null ? void 0 : i.call(n, {
      type: "entities",
      entities: []
    }));
    await ((o = s == null ? void 0 : (a = s.constructor).getConfigElement) == null ? void 0 : o.call(a));
  } catch {
  }
  return e();
}
function Pe(e, t) {
  const r = (t == null ? void 0 : t.trim()) || "";
  return !r || e.includes(r) ? e : [r, ...e];
}
const bt = {
  "light.turn_on": `brightness_pct: 70
rgb_color: [255, 200, 120]`,
  "light.turn_off": "transition: 1",
  "light.toggle": "",
  "switch.turn_on": "",
  "switch.turn_off": "",
  "switch.toggle": "",
  "cover.open_cover": "",
  "cover.close_cover": "",
  "cover.stop_cover": "",
  "cover.set_cover_position": "position: 50",
  "cover.set_cover_tilt_position": "tilt_position: 50",
  "climate.set_temperature": `temperature: 22
hvac_mode: heat`,
  "climate.set_hvac_mode": "hvac_mode: heat",
  "climate.set_preset_mode": "preset_mode: home",
  "climate.set_fan_mode": "fan_mode: auto",
  "media_player.volume_set": "volume_level: 0.5",
  "media_player.play_media": `media_content_id: "https://example.com/media.mp3"
media_content_type: music`,
  "media_player.media_play": "",
  "media_player.media_pause": "",
  "media_player.media_stop": "",
  "media_player.media_next_track": "",
  "media_player.media_previous_track": "",
  "fan.turn_on": "percentage: 50",
  "fan.turn_off": "",
  "fan.toggle": "",
  "fan.set_percentage": "percentage: 50",
  "fan.set_preset_mode": "preset_mode: auto",
  "lock.lock": "",
  "lock.unlock": "",
  "lock.open": "",
  "vacuum.start": "",
  "vacuum.pause": "",
  "vacuum.stop": "",
  "vacuum.return_to_base": "",
  "vacuum.set_fan_speed": "fan_speed: medium",
  "script.turn_on": 'variables: {"name": "day", "run": true}',
  "script.turn_off": "",
  "script.toggle": "",
  "scene.turn_on": "transition: 2",
  "input_boolean.turn_on": "",
  "input_boolean.turn_off": "",
  "input_boolean.toggle": "",
  "input_select.select_option": "option: Morning",
  "input_number.set_value": "value: 21",
  "input_text.set_value": 'value: "Hello"',
  "input_datetime.set_datetime": 'datetime: "2026-01-01 08:00:00"',
  "number.set_value": "value: 50",
  "select.select_option": "option: option_1",
  "text.set_value": 'value: "Hello"',
  "button.press": "",
  "automation.trigger": "",
  "automation.turn_on": "",
  "automation.turn_off": "",
  "automation.toggle": "",
  "notify.notify": `message: "Hello from ConX"
title: ConX`,
  "persistent_notification.create": `message: "Hello from ConX"
title: ConX
notification_id: conx`,
  "remote.send_command": "command: Power",
  "alarm_control_panel.alarm_arm_home": 'code: "1234"',
  "alarm_control_panel.alarm_arm_away": 'code: "1234"',
  "alarm_control_panel.alarm_disarm": 'code: "1234"',
  "humidifier.set_humidity": "humidity: 45",
  "humidifier.set_mode": "mode: normal",
  "water_heater.set_temperature": "temperature: 45",
  "water_heater.set_operation_mode": "operation_mode: eco",
  "timer.start": 'duration: "00:05:00"',
  "timer.cancel": "",
  "timer.finish": "",
  "counter.increment": "",
  "counter.decrement": "",
  "counter.reset": "",
  "counter.set_value": "value: 0",
  "siren.turn_on": "",
  "siren.turn_off": "",
  "siren.toggle": "",
  "homeassistant.turn_on": "",
  "homeassistant.turn_off": "",
  "homeassistant.toggle": ""
}, De = {
  light: "brightness_pct: 70",
  switch: "",
  cover: "position: 50",
  climate: "temperature: 22",
  media_player: "volume_level: 0.5",
  fan: "percentage: 50",
  lock: "",
  vacuum: "",
  script: 'variables: {"name": "day", "run": true}',
  scene: "transition: 2",
  input_boolean: "",
  input_select: "option: Morning",
  input_number: "value: 21",
  input_text: 'value: "Hello"',
  number: "value: 50",
  select: "option: option_1",
  text: 'value: "Hello"',
  button: "",
  automation: "",
  notify: `message: "Hello from ConX"
title: ConX`,
  remote: "command: Power",
  alarm_control_panel: 'code: "1234"',
  humidifier: "humidity: 45",
  water_heater: "temperature: 45",
  timer: 'duration: "00:05:00"',
  counter: "value: 0",
  siren: ""
}, hi = /* @__PURE__ */ new Set([
  "toggle",
  "turn_off",
  "stop",
  "stop_cover",
  "open_cover",
  "close_cover",
  "media_play",
  "media_pause",
  "media_stop",
  "media_next_track",
  "media_previous_track",
  "lock",
  "unlock",
  "open",
  "start",
  "pause",
  "return_to_base",
  "press",
  "trigger",
  "cancel",
  "finish",
  "increment",
  "decrement",
  "reset"
]);
function Ue(e) {
  const t = (e || "").trim();
  if (!t)
    return "";
  if (Object.prototype.hasOwnProperty.call(bt, t))
    return bt[t];
  const r = Le(t), i = t.indexOf("."), a = i > 0 ? t.slice(i + 1) : "";
  return hi.has(a) ? "" : r && Object.prototype.hasOwnProperty.call(De, r) ? De[r] : r === "notify" || t.startsWith("notify.") ? De.notify : "";
}
function ui(e) {
  const t = Ue(e);
  if (!t.trim())
    return {};
  const r = be(t);
  return r.ok ? r.data : {};
}
function _i(e, t) {
  const r = (e || "").trim();
  if (!r)
    return !0;
  if (t === void 0)
    return !1;
  const i = t.trim();
  if (r === i)
    return !0;
  const a = be(r), o = be(i);
  return !!(a.ok && o.ok && li(a.data, o.data));
}
function mi(e, t, r) {
  const i = (e || "").trim();
  if (!i)
    return { yaml: "", data: {} };
  if (!_i(t, r))
    return null;
  const a = Ue(i), o = ui(i);
  return { yaml: Ft(o) || a, data: o };
}
function fi(e, t, r) {
  const i = (e || "").trim();
  if (!i)
    return r;
  const a = (t || "").trim();
  return a ? `${i} · ${a}` : i;
}
const It = "conx-dynamic-panel-lang", Ut = {}, Wt = {
  "card.title": "ConX Dynamic Panel",
  "card.sync": "Sync to Panel",
  "card.pull": "Pull from Panel",
  "card.save": "Save Draft",
  "card.discard": "Discard Changes",
  "card.create": "Create",
  "card.duplicate": "Duplicate",
  "card.rename": "Rename",
  "card.delete": "Delete",
  "card.duplicate_name": "Name for the duplicated profile",
  "card.duplicate_ok": "Profile duplicated.",
  "card.delete_ok": "Profile deleted.",
  "card.keep_one_profile": "At least one profile must remain.",
  "card.delete_blocked_scheduler": "Cannot delete this profile — used by scheduler task(s): {tasks}. Remove or retarget those tasks first.",
  "card.profiles": "Profiles",
  "card.editor": "Appearance",
  "card.buttons": "Buttons",
  "card.preview": "Panel preview",
  "card.panel_unavailable": "Panel unavailable",
  "card.actions": "Actions",
  "card.status": "Status",
  "card.error": "Error",
  "card.mode": "Mode",
  "card.color_on": "Color ON",
  "card.color_off": "Color OFF",
  "card.radar": "Radar",
  "color.red": "Red",
  "color.blue": "Blue (looks cyan on panel)",
  "color.green": "Green",
  "color.white": "White",
  "color.yellow": "Yellow",
  "color.magenta": "Magenta",
  "color.cyan": "Cyan",
  "color.warm_white": "Warm white",
  "color.warm_yellow": "Warm yellow",
  "radar.none": "None (off)",
  "card.backlight": "Backlight",
  "card.backlight_brightness": "Backlight brightness",
  "card.child_lock": "Child lock",
  "card.theme": "Interface theme",
  "card.button": "Button",
  "card.button_expand": "Expand button settings",
  "card.button_collapse": "Collapse button settings",
  "card.label": "Label",
  "card.action": "Action",
  "card.action_double": "Double-click action",
  "card.action_not_set": "Not set",
  "card.action_expand": "Expand action settings",
  "card.action_collapse": "Collapse action settings",
  "card.multi_click_hint": "Optional. When double-click is set, presses are classified after a short pause — only one of single / double runs (not the single action twice). A double-click restores the button relay to its state before the two taps (suppressed), then runs the double action. Single-click keeps the normal toggle. Momentary and cover buttons do not restore.",
  "card.entity_id": "Entity ID",
  "card.action_none": "No Home Assistant action",
  "card.entity_none": "No entity (optional)",
  "card.action_picker_hint": "Searchable Home Assistant service (domain.service).",
  "card.entity_picker_hint": "Searchable entity list, filtered by the action domain when set.",
  "card.action_data": "Action data (YAML)",
  "card.action_data_hint": "A live example is filled for the selected domain/service — edit the fields you need. Optional service data (like Developer Tools → Actions → data:). One key: value per line, or a JSON object. Entity picker still sets target.",
  "card.action_data_placeholder": "brightness_pct: 70",
  "card.action_data_invalid": "Invalid action data",
  "card.picker_search": "Search…",
  "card.radio_participation": "Button behavior",
  "card.radio_member": "Radio group",
  "card.radio_toggle": "Independent toggle",
  "card.radio_groups": "Radio groups",
  "card.radio_groups_hint": "Tap L1–L4 to add or remove a button. Buttons in a group act as classic radio: exactly one stays on. Ungrouped buttons stay independent toggles.",
  "card.radio_groups_toggle": "Show radio groups",
  "card.radio_group": "Group",
  "card.radio_groups_overlap": "Each button can belong to only one radio group.",
  "card.cover": "Cover / shutter",
  "card.cover_hint": "Pick which panel buttons drive the motor. Pressing a direction starts a timed travel; pressing again stops it. The integration never energizes both directions at once.",
  "card.cover_open_button": "Open button",
  "card.cover_close_button": "Close button",
  "card.cover_open_time": "Open travel time",
  "card.cover_close_time": "Close travel time",
  "card.cover_settle": "Direction change delay",
  "card.cover_times": "Travel times",
  "card.mixed_cover_times_hint": "Open/close come from the roles above. Travel times sit inside the cover-role card.",
  "card.mixed_cover_times_on": "Travel times for this motor are set on L{n}.",
  "card.cover_id_hint": "Internal motor slot for open/close pairing — not a Home Assistant cover.* entity.",
  "card.cover_ha_entity": "HA cover entity (optional)",
  "card.cover_ha_entity_hint": "Panel L1/L2 still drive the physical motor relays. Link a cover.* entity to mirror open/close/stop for HA status and automations.",
  "card.cover_ha_entity_none": "No HA cover (optional)",
  "card.cover_settle_hint": "Brief pause before reversing direction (motor relay safety).",
  "card.cover_opposite": "Opposite press",
  "card.cover_same_button": "Open and close must use different buttons.",
  "card.cover_live": "Cover control",
  "card.cover_open": "Open",
  "card.cover_close": "Close",
  "card.cover_stop": "Stop",
  "card.cover_state_idle": "Stopped",
  "card.cover_state_open": "Opening",
  "card.cover_state_close": "Closing",
  "card.cover_seconds": "s",
  "card.cover_safety": "Safety: presses run through the integration. Both direction relays are forced off on stop, timer expiry, profile change, sync, and reload.",
  "card.cover_add": "Add cover",
  "card.cover_remove": "Remove",
  "card.cover_slot_empty": "Not configured",
  "card.cover_slot_hint": "Assign the remaining buttons to a second shutter. Each cover needs two different buttons (open + close).",
  "card.gang_count": "Panel gangs",
  "card.gang_count_hint": "How many physical buttons (L1…Ln) this profile uses. Cover count is limited to floor(n/2). Choose 4 to use two covers.",
  "cover.stop_only": "Stop only",
  "cover.stop_then_reverse": "Stop, then reverse",
  "theme.noir": "Noir gray",
  "theme.ivory": "Ivory cool",
  "card.unsaved": "Unsaved draft — physical presses still use the last saved profile. Save Draft to apply roles/actions; Sync updates panel labels and colors.",
  "card.sync_needed": "Draft saved. Press behavior already uses this draft. Sync to Panel to push labels, colors, and on-panel settings.",
  "card.missing_action": "No Home Assistant action — only the panel relay will change.",
  "card.loading": "Loading panel…",
  "card.missing_entry": "Configure an entry_id for this card.",
  "card.compact": "Compact mode",
  "card.operate": "Operate",
  "card.operate_exit": "Settings",
  "card.operate_hint": "Show only the panel faceplate and live controls",
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
  "card.panel_name": "Panel name",
  "card.panel_name_ok": "Panel name updated.",
  "card.menu": "Settings",
  "card.tabs_hint": "Setup steps under the panel preview",
  "card.step_1": "Step 1",
  "card.step_2": "Step 2",
  "card.step_3": "Step 3",
  "card.step_4": "Step 4",
  "card.wizard": "Setup wizard",
  "card.wizard_next": "Next",
  "card.wizard_back": "Back",
  "card.step_language": "Language",
  "card.step_profiles": "Panel / profile",
  "card.step_edit": "Edit settings",
  "card.step_preview": "Faceplate preview",
  "card.step_review": "Review & sync",
  "card.step_transfer": "Export / Import",
  "card.step_language_hint": "Choose the card language. Hebrew uses right-to-left layout.",
  "card.step_profiles_hint": "Select the active profile and how many physical buttons (gangs) it uses.",
  "card.step_edit_hint": "Edit appearance and button labels. Draft changes stay local until you save or sync.",
  "card.step_preview_hint": "Live Zemismart faceplate: labels on top, LED rings bottom left→right.",
  "card.step_review_hint": "Review the draft, save it, then Sync to push settings to the physical panel.",
  "card.step_transfer_hint": "Download or upload the portable JSON file used by Home Assistant.",
  "card.import_mode": "Import mode",
  "card.schema_title": "Supported JSON schema",
  "card.schema_body": "File must match export_profiles: schema_version, active_profile_id, profiles.",
  "card.service_yaml": "Service call YAML",
  "card.copy_yaml": "Copy YAML",
  "card.copied": "Copied",
  "card.close": "Close",
  "card.choose_file": "Choose JSON file",
  "card.download_export": "Download .json",
  "card.more": "More",
  "card.info": "Info",
  "info.title": "Card guide",
  "info.intro": "Short reference for the main controls on this card. Open anytime from the menu.",
  "info.profiles_title": "Profiles",
  "info.profiles_body": "Create, rename, duplicate, delete, and activate profiles. Panel gangs (1–4) sets how many physical buttons (L1…Ln) this profile uses.",
  "info.appearance_title": "Appearance",
  "info.appearance_body": "LED colors ON/OFF, radar, backlight, brightness, and child lock. These update on the hardware when you Sync to Panel.",
  "info.buttons_title": "Buttons",
  "info.buttons_body": "Choose a mode, then edit labels and behavior. In Free mix, set a role per L#. Expand a button row for Action, Entity, and optional Action data (YAML).",
  "info.modes_title": "Modes",
  "info.modes_body": "Toggle: each button latches independently. Radio mandatory / optional / split: exclusive groups. Cover: dedicated shutter mapping. Free mix: each button picks its own role.",
  "info.roles_title": "Free-mix roles",
  "info.roles_body": "Toggle = latched relay. Momentary = ON then OFF after the pulse time (re-press cancels). Radio = classic radio group. Cover open / close = shutter directions for a motor slot.",
  "info.sync_title": "Save Draft vs Sync",
  "info.sync_body": "Save Draft stores roles and actions so presses follow the draft. Sync pushes labels, colors, and on-panel settings to the hardware. While a draft is unsaved, physical presses still use the last saved profile.",
  "info.operate_title": "Operate mode",
  "info.operate_body": "Shows only the faceplate for day-to-day use. Open the title-row menu and choose Settings to return to the full editor.",
  "info.cover_title": "Cover motor vs HA entity",
  "info.cover_body": "Motor / Cover slot pairs open and close internally — it is not a Home Assistant cover.* entity. Travel times and opposite-press sit on the first cover-role card for that motor. Optionally link a cover.* entity to mirror open/close/stop for HA status and automations; panel relays still drive the physical motor.",
  "info.actions_title": "Actions & YAML data",
  "info.actions_body": "Action is a Home Assistant service (domain.service). Entity sets the target. Action data (YAML) is prefilled with a live example for the selected domain/service — edit it as needed. Extra data fields never replace the entity target.",
  "info.menu_title": "Settings menu",
  "info.menu_body": "Language, theme, export/import, automation example YAML, and this Info guide.",
  "card.automation_example": "Automation example",
  "card.automation_example_hint": "Switch profiles by time of day. Activating a profile only updates the stored draft — the physical panel changes only when the call also syncs, so every action below uses sync: true.",
  "card.automation_yaml_alias": "ConX Dynamic Panel - profile by time of day",
  "card.automation_yaml_header": "ConX Dynamic Panel: switch the active profile by time of day.",
  "card.automation_yaml_sync": "sync: true pushes the profile to the physical panel. Without it only the draft changes.",
  "card.automation_yaml_ids": "Replace entry_id and profile_id with the values of your panel.",
  "card.automation_yaml_morning": "Morning",
  "card.automation_yaml_evening": "Evening",
  "card.automation_yaml_night": "Night",
  "editor.entry_id": "Config entry ID",
  "mode.toggle": "Toggle",
  "mode.radio_mandatory": "Radio mandatory",
  "mode.radio_optional": "Radio optional",
  "mode.radio_split": "Radio split",
  "mode.mixed": "Free mix",
  "mode.cover": "Cover / shutter",
  "card.mixed_hint": "Configure each button freely: toggle (latched relay), momentary pulse, radio group, or cover open/close. Momentary turns ON then OFF after the pulse time; a re-press cancels and turns OFF. There is no separate “relay” role — use Toggle for a latched relay, and set an Action if Home Assistant should also run.",
  "card.mixed_roles": "Per-button roles",
  "card.button_role": "Button role",
  "card.pulse_time": "Pulse time",
  "card.cover_id": "Motor / Cover slot",
  "card.mixed_radio_hint": "Assign this button to a radio group below. Classic radio keeps exactly one member ON (turning it off snaps it back). Only role=Radio buttons stay in groups.",
  "card.mixed_cover_hint": "Shutter motor: Open/Close roles + travel times here. Motor slot is internal (not an HA entity). Optionally link a cover.* entity below to mirror open/close/stop for HA status and automations. Panel relays still drive the physical motor.",
  "role.toggle": "Toggle",
  "role.momentary": "Momentary",
  "role.radio": "Radio group",
  "role.cover_open": "Cover open",
  "role.cover_close": "Cover close",
  "card.scheduler": "Scheduler",
  "scheduler.hint": "Timeline ranges activate profiles automatically. The end time is exclusive — that minute starts the next range (e.g. 08:00–12:00 ends just before 12:00). Outside all ranges the default profile is used. Panel holiday pauses this panel’s schedulers; master holiday pauses every panel.",
  "scheduler.holiday": "Holiday mode (this panel)",
  "scheduler.holiday_on": "Schedulers paused on this panel",
  "scheduler.holiday_badge": "Holiday mode on — schedulers paused",
  "scheduler.master_holiday": "Master holiday (all panels)",
  "scheduler.master_holiday_on": "Master holiday pauses schedulers on every panel",
  "scheduler.default_profile": "Default profile",
  "scheduler.default_hint": "Used when no enabled timeline range covers the current time.",
  "scheduler.tasks": "Scheduled tasks",
  "scheduler.add_task": "Add task",
  "scheduler.task_name": "Task name",
  "scheduler.enabled": "Enabled",
  "scheduler.notes": "Notes",
  "scheduler.weekdays": "Days",
  "scheduler.months": "Months",
  "scheduler.ranges": "Timeline ranges",
  "scheduler.add_range": "Add range",
  "scheduler.range_from": "From",
  "scheduler.range_to": "To",
  "scheduler.range_profile": "Profile",
  "scheduler.save_task": "Save task",
  "scheduler.delete_task": "Delete",
  "scheduler.delete_range": "Delete range",
  "scheduler.delete_condition": "Delete",
  "scheduler.conflict_title": "Schedule conflict",
  "scheduler.conflict_body": "Two enabled ranges would activate different profiles at the same time. Change the times, days, months, or profiles, then save again.",
  "scheduler.conflict_ok": "OK",
  "scheduler.overnight_hint": "If From is later than To (e.g. 22:00–06:00), the range crosses midnight and stays active until To (exclusive).",
  "scheduler.day_mon": "Mon",
  "scheduler.day_tue": "Tue",
  "scheduler.day_wed": "Wed",
  "scheduler.day_thu": "Thu",
  "scheduler.day_fri": "Fri",
  "scheduler.day_sat": "Sat",
  "scheduler.day_sun": "Sun",
  "scheduler.month_1": "Jan",
  "scheduler.month_2": "Feb",
  "scheduler.month_3": "Mar",
  "scheduler.month_4": "Apr",
  "scheduler.month_5": "May",
  "scheduler.month_6": "Jun",
  "scheduler.month_7": "Jul",
  "scheduler.month_8": "Aug",
  "scheduler.month_9": "Sep",
  "scheduler.month_10": "Oct",
  "scheduler.month_11": "Nov",
  "scheduler.month_12": "Dec",
  "scheduler.saved": "Task saved.",
  "scheduler.deleted": "Task deleted.",
  "scheduler.conditions": "Conditions",
  "scheduler.conditions_hint": "Optional. When any condition fails the task is inactive for that moment (time conflicts still apply regardless of conditions).",
  "scheduler.add_condition": "Add condition",
  "scheduler.condition_entity": "Entity",
  "scheduler.condition_operator": "Operator",
  "scheduler.condition_value": "Value",
  "scheduler.op_eq": "equals",
  "scheduler.op_neq": "not equals",
  "scheduler.op_gt": "greater than",
  "scheduler.op_lt": "less than",
  "scheduler.op_gte": "≥",
  "scheduler.op_lte": "≤",
  "scheduler.conflict_conditions_note": "Entity conditions do not override time conflicts — overlapping ranges with different profiles are still blocked.",
  "scheduler.master_tasks": "Master tasks (multi-panel)",
  "scheduler.add_master": "Add master task",
  "scheduler.master_badge": "Master",
  "scheduler.master_panels": "Panels",
  "scheduler.master_hint": "A master task uses the same days, ranges, and conditions on every selected panel. Each panel still needs matching profile IDs.",
  "scheduler.local_tasks": "This panel’s tasks",
  "scheduler.next_profile": "Next",
  "scheduler.next_at": "at",
  "scheduler.active_compact": "Scheduler on",
  "scheduler.transfer": "Scheduler export / import",
  "scheduler.export": "Export",
  "scheduler.import_merge": "Import (merge)",
  "scheduler.import_replace": "Import (replace)",
  "scheduler.export_ok": "Scheduler exported.",
  "scheduler.import_ok": "Scheduler imported.",
  "scheduler.import_invalid": "Invalid scheduler JSON file.",
  "scheduler.import_hint": "Export includes local tasks, default profile id, and master tasks that target this panel. Holiday mode (panel and master) is not exported. Merge updates by id; replace replaces local tasks only (masters in the file are merged).",
  "scheduler.import_warnings": "Import warnings"
}, gi = {
  "card.title": "ConX Dynamic Panel",
  "card.sync": "סנכרון לפאנל",
  "card.pull": "משיכה מהפאנל",
  "card.save": "שמור טיוטה",
  "card.discard": "בטל שינויים",
  "card.create": "צור",
  "card.duplicate": "שכפל",
  "card.rename": "שנה שם",
  "card.delete": "מחק",
  "card.duplicate_name": "שם לפרופיל המשוכפל",
  "card.duplicate_ok": "הפרופיל שוכפל.",
  "card.delete_ok": "הפרופיל נמחק.",
  "card.keep_one_profile": "חייבים להשאיר לפחות פרופיל אחד.",
  "card.delete_blocked_scheduler": "לא ניתן למחוק את הפרופיל — בשימוש במשימות תזמון: {tasks}. הסירו או שנו את המשימות קודם.",
  "card.profiles": "פרופילים",
  "card.editor": "מראה",
  "card.buttons": "כפתורים",
  "card.preview": "תצוגת פאנל",
  "card.panel_unavailable": "הפאנל לא זמין",
  "card.actions": "פעולות",
  "card.status": "סטטוס",
  "card.error": "שגיאה",
  "card.mode": "מצב",
  "card.color_on": "צבע דלוק",
  "card.color_off": "צבע כבוי",
  "card.radar": "רדאר",
  "color.red": "אדום",
  "color.blue": "כחול (נראה כסיאן על הפאנל)",
  "color.green": "ירוק",
  "color.white": "לבן",
  "color.yellow": "צהוב",
  "color.magenta": "מג׳נטה",
  "color.cyan": "סיאן",
  "color.warm_white": "לבן חם",
  "color.warm_yellow": "צהוב חם",
  "radar.none": "ללא (כבוי)",
  "card.backlight": "תאורת רקע",
  "card.backlight_brightness": "עוצמת תאורת רקע",
  "card.child_lock": "נעילת ילדים",
  "card.theme": "ערכת נושא",
  "card.button": "כפתור",
  "card.button_expand": "הרחב הגדרות כפתור",
  "card.button_collapse": "כווץ הגדרות כפתור",
  "card.label": "תווית",
  "card.action": "פעולה",
  "card.action_double": "פעולת לחיצה כפולה",
  "card.action_not_set": "לא הוגדר",
  "card.action_expand": "הרחב הגדרות פעולה",
  "card.action_collapse": "כווץ הגדרות פעולה",
  "card.multi_click_hint": "אופציונלי. כשמגדירים לחיצה כפולה, הלחיצות מסווגות אחרי הפסקה קצרה — רצה רק אחת מבין יחידה / כפולה (לא הפעולה היחידה פעמיים). לחיצה כפולה מחזירה את ממסר הכפתור למצב שלפני שתי הלחיצות (עם דיכוי מעבר) ואז מריצה את פעולת הכפולה. לחיצה יחידה נשארת טוגל רגיל. כפתורי רגעי ותריס לא משחזרים.",
  "card.entity_id": "מזהה ישות",
  "card.action_none": "ללא פעולת Home Assistant",
  "card.entity_none": "ללא ישות (אופציונלי)",
  "card.action_picker_hint": "שירות Home Assistant עם חיפוש (דומיין.שירות).",
  "card.entity_picker_hint": "רשימת ישויות עם חיפוש, מסוננת לפי דומיין הפעולה כשנבחרה.",
  "card.action_data": "נתוני פעולה (YAML)",
  "card.action_data_hint": "דוגמה חיה מתמלאת לפי הדומיין/השירות שנבחרו — ערכו רק את מה שצריך. שדות data אופציונליים (כמו כלי המפתחים → פעולות → data:). שורה לכל מפתח: ערך, או אובייקט JSON. בחירת הישות עדיין מגדירה את target.",
  "card.action_data_placeholder": "brightness_pct: 70",
  "card.action_data_invalid": "נתוני פעולה לא תקינים",
  "card.picker_search": "חיפוש…",
  "card.radio_participation": "התנהגות כפתור",
  "card.radio_member": "משתתף ברדיו",
  "card.radio_toggle": "טוגל עצמאי",
  "card.radio_groups": "קבוצות רדיו",
  "card.radio_groups_hint": "הקישו על L1–L4 כדי לצרף או להסיר כפתור. כפתורים בקבוצה מתנהגים כרדיו קלאסי: תמיד אחד דלוק. כפתורים מחוץ לקבוצה נשארים טוגלים עצמאיים.",
  "card.radio_groups_toggle": "הצג קבוצות רדיו",
  "card.radio_group": "קבוצה",
  "card.radio_groups_overlap": "כל כפתור יכול להשתייך לקבוצת רדיו אחת בלבד.",
  "card.cover": "תריס",
  "card.cover_hint": "בחרו אילו כפתורים בפאנל מפעילים את המנוע. לחיצה על כיוון מתחילה תנועה מתוזמנת, ולחיצה נוספת עוצרת אותה. האינטגרציה לעולם לא מפעילה את שני הכיוונים יחד.",
  "card.cover_open_button": "כפתור פתיחה",
  "card.cover_close_button": "כפתור סגירה",
  "card.cover_open_time": "זמן פתיחה",
  "card.cover_close_time": "זמן סגירה",
  "card.cover_settle": "השהיה בהחלפת כיוון",
  "card.cover_times": "זמני נסיעה",
  "card.mixed_cover_times_hint": "פתיחה/סגירה נקבעים בתפקידים למעלה. זמני הנסיעה מופיעים בכרטיס תפקיד התריס.",
  "card.mixed_cover_times_on": "זמני הנסיעה למנוע זה מוגדרים ב־L{n}.",
  "card.cover_id_hint": "מזהה מנוע פנימי לזיווג פתיחה/סגירה — לא ישות cover של Home Assistant.",
  "card.cover_ha_entity": "ישות תריס ב-HA (אופציונלי)",
  "card.cover_ha_entity_hint": "כפתורי הפאנל עדיין מפעילים את ממסרי המנוע. קשרו ישות cover.* כדי לשקף פתיחה/סגירה/עצירה לסטטוס ואוטומציות ב-HA.",
  "card.cover_ha_entity_none": "ללא ישות תריס ב-HA (אופציונלי)",
  "card.cover_settle_hint": "השהיה קצרה לפני היפוך כיוון (בטיחות ממסרי מנוע).",
  "card.cover_opposite": "לחיצה הפוכה",
  "card.cover_same_button": "פתיחה וסגירה חייבות להשתמש בכפתורים שונים.",
  "card.cover_live": "שליטה בתריס",
  "card.cover_open": "פתיחה",
  "card.cover_close": "סגירה",
  "card.cover_stop": "עצירה",
  "card.cover_state_idle": "עצור",
  "card.cover_state_open": "נפתח",
  "card.cover_state_close": "נסגר",
  "card.cover_seconds": "שנ׳",
  "card.cover_safety": "בטיחות: הלחיצות עוברות דרך האינטגרציה. שני ממסרי הכיוון מכובים בעצירה, בתום הזמן, בהחלפת פרופיל, בסנכרון ובטעינה מחדש.",
  "card.cover_add": "הוסף תריס",
  "card.cover_remove": "הסר",
  "card.cover_slot_empty": "לא מוגדר",
  "card.cover_slot_hint": "שייכו את הכפתורים הנותרים לתריס שני. לכל תריס נדרשים שני כפתורים שונים (פתיחה + סגירה).",
  "card.gang_count": "מספר גאנגים",
  "card.gang_count_hint": "כמה כפתורים פיזיים (L1…Ln) הפרופיל משתמש. מספר התריסים מוגבל ל־floor(n/2). בחרו 4 כדי להשתמש בשני תריסים.",
  "cover.stop_only": "עצירה בלבד",
  "cover.stop_then_reverse": "עצירה ואז כיוון הפוך",
  "theme.noir": "נואר אפור",
  "theme.ivory": "שנהב קר",
  "card.unsaved": "יש שינויי טיוטה שלא נשמרו — לחיצות על הפאנל עדיין לפי הפרופיל השמור האחרון. שמרו טיוטה כדי להחיל תפקידים/פעולות; סנכרון מעדכן תוויות וצבעים בפאנל.",
  "card.sync_needed": "הטיוטה נשמרה. התנהגות הלחיצות כבר לפי הטיוטה. סנכרנו לפאנל כדי לדחוף תוויות, צבעים והגדרות על החומרה.",
  "card.missing_action": "אין פעולת Home Assistant — ישתנה רק ממסר הפאנל.",
  "card.loading": "טוען פאנל…",
  "card.missing_entry": "יש להגדיר entry_id לכרטיס.",
  "card.compact": "מצב קומפקטי",
  "card.operate": "תפעול",
  "card.operate_exit": "הגדרות",
  "card.operate_hint": "הצג רק את תצוגת הפאנל ופקדי התריס החיים",
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
  "card.panel_name": "שם פאנל",
  "card.panel_name_ok": "שם הפאנל עודכן.",
  "card.menu": "הגדרות",
  "card.tabs_hint": "שלושה שלבי הגדרה מתחת לתצוגת הפאנל",
  "card.step_1": "שלב 1",
  "card.step_2": "שלב 2",
  "card.step_3": "שלב 3",
  "card.step_4": "שלב 4",
  "card.wizard": "אשף הגדרה",
  "card.wizard_next": "הבא",
  "card.wizard_back": "חזרה",
  "card.step_language": "שפה",
  "card.step_profiles": "פאנל / פרופיל",
  "card.step_edit": "עריכת הגדרות",
  "card.step_preview": "תצוגת פאנל",
  "card.step_review": "סקירה וסנכרון",
  "card.step_transfer": "ייצוא / ייבוא",
  "card.step_language_hint": "בחרו שפת ממשק. בעברית הפריסה מימין לשמאל.",
  "card.step_profiles_hint": "בחרו פרופיל פעיל ומספר גאנגים (מפסק) לפרופיל.",
  "card.step_edit_hint": "ערכו מראה ותוויות. שינויי טיוטה נשארים מקומיים עד שמירה או סנכרון.",
  "card.step_preview_hint": "תצוגה חיה בסגנון Zemismart: תוויות למעלה, טבעות LED משמאל לימין.",
  "card.step_review_hint": "סקרו את הטיוטה, שמרו, ואז סנכרנו לפאנל הפיזי.",
  "card.step_transfer_hint": "הורידו או העלו קובץ JSON נייד שנתמך ב־Home Assistant.",
  "card.import_mode": "מצב ייבוא",
  "card.schema_title": "סכמת JSON נתמכת",
  "card.schema_body": "הקובץ חייב להתאים ל־export_profiles: schema_version, active_profile_id, profiles.",
  "card.service_yaml": "קריאת שירות YAML",
  "card.copy_yaml": "העתק YAML",
  "card.copied": "הועתק",
  "card.close": "סגירה",
  "card.choose_file": "בחרו קובץ JSON",
  "card.download_export": "הורדת .json",
  "card.more": "עוד",
  "card.info": "מידע",
  "info.title": "מדריך לכרטיס",
  "info.intro": "הסבר קצר על הפקדים העיקריים בכרטיס. אפשר לפתוח בכל עת מתפריט ההגדרות.",
  "info.profiles_title": "פרופילים",
  "info.profiles_body": "יצירה, שינוי שם, שכפול, מחיקה והפעלה של פרופילים. מספר גאנגים (1–4) קובע כמה כפתורים פיזיים (L1…Ln) הפרופיל משתמש.",
  "info.appearance_title": "מראה",
  "info.appearance_body": "צבעי LED דלוק/כבוי, רדאר, תאורת רקע, עוצמה ונעילת ילדים. אלה מתעדכנים בחומרה בסנכרון לפאנל.",
  "info.buttons_title": "כפתורים",
  "info.buttons_body": "בחרו מצב ואז ערכו תוויות והתנהגות. במיקס חופשי מגדירים תפקיד לכל L#. הרחבת שורת כפתור מאפשרת פעולה, ישות ונתוני פעולה (YAML) אופציונליים.",
  "info.modes_title": "מצבים",
  "info.modes_body": "טוגל: כל כפתור ננעל בנפרד. רדיו חובה / אופציונלי / ספליט: קבוצות בלעדיות. תריס: מיפוי ייעודי. מיקס חופשי: כל כפתור בוחר תפקיד משלו.",
  "info.roles_title": "תפקידים במיקס חופשי",
  "info.roles_body": "טוגל = ממסר נעול. רגעי = הדלקה ואז כיבוי אחרי זמן הפולס (לחיצה חוזרת מבטלת). רדיו = קבוצת רדיו קלאסית. פתיחה/סגירת תריס = כיווני מנוע לפי מזהה מנוע.",
  "info.sync_title": "שמירת טיוטה מול סנכרון",
  "info.sync_body": "שמור טיוטה שומר תפקידים ופעולות כדי שלחיצות יעבדו לפי הטיוטה. סנכרון דוחף תוויות, צבעים והגדרות על הפאנל. בזמן שיש טיוטה לא שמורה, לחיצות פיזיות עדיין לפי הפרופיל השמור האחרון.",
  "info.operate_title": "מצב תפעול",
  "info.operate_body": "מציג רק את תצוגת הפאנל לשימוש יומיומי. בתפריט בשורת הכותרת בחרו «הגדרות» כדי לחזור לעורך המלא.",
  "info.cover_title": "מנוע תריס מול ישות HA",
  "info.cover_body": "מנוע / מזהה תריס מזווג פתיחה וסגירה פנימית — זו לא ישות cover.* של Home Assistant. זמני נסיעה ולחיצה הפוכה מופיעים בכרטיס תפקיד התריס הראשון של אותו מנוע. אפשר לקשר ישות cover.* כדי לשקף פתיחה/סגירה/עצירה לסטטוס ואוטומציות; ממסרי הפאנל עדיין מפעילים את המנוע.",
  "info.actions_title": "פעולות ונתוני YAML",
  "info.actions_body": "פעולה היא שירות Home Assistant (דומיין.שירות). הישות מגדירה את היעד. נתוני פעולה (YAML) מתמלאים בדוגמה חיה לפי הדומיין/השירות שנבחרו — ערכו לפי הצורך. שדות data נוספים לא מחליפים את יעד הישות.",
  "info.menu_title": "תפריט הגדרות",
  "info.menu_body": "שפה, ערכת נושא, ייצוא/ייבוא, דוגמת אוטומציה YAML, ומדריך המידע הזה.",
  "card.automation_example": "דוגמה לאוטומציה",
  "card.automation_example_hint": "החלפת פרופילים לפי שעות היום. הפעלת פרופיל מעדכנת רק את הטיוטה השמורה — הפאנל הפיזי משתנה רק כשהקריאה גם מסנכרנת, ולכן בכל פעולה כאן מופיע sync: true.",
  "card.automation_yaml_alias": "ConX Dynamic Panel - פרופיל לפי שעות היום",
  "card.automation_yaml_header": "ConX Dynamic Panel: החלפת הפרופיל הפעיל לפי שעות היום.",
  "card.automation_yaml_sync": "sync: true שולח את הפרופיל לפאנל הפיזי. בלעדיו משתנה רק הטיוטה.",
  "card.automation_yaml_ids": "החליפו את entry_id ואת profile_id בערכים של הפאנל שלכם.",
  "card.automation_yaml_morning": "בוקר",
  "card.automation_yaml_evening": "ערב",
  "card.automation_yaml_night": "לילה",
  "editor.entry_id": "מזהה רשומת הגדרה",
  "mode.toggle": "החלפה",
  "mode.radio_mandatory": "רדיו חובה",
  "mode.radio_optional": "רדיו אופציונלי",
  "mode.radio_split": "רדיו ספליט",
  "mode.mixed": "מיקס חופשי",
  "mode.cover": "תריס",
  "card.mixed_hint": "הגדירו כל כפתור בנפרד: טוגל (ממסר נעול), רגעי, קבוצת רדיו או פתיחה/סגירה של תריס. רגעי מדליק ואז מכבה אחרי זמן הפולס; לחיצה חוזרת מבטלת ומכבה. אין תפקיד נפרד בשם «רליי» — לטוגל של הממסר בחרו טוגל, ולהפעלת Home Assistant הגדירו גם פעולה.",
  "card.mixed_roles": "תפקיד לכל כפתור",
  "card.button_role": "תפקיד כפתור",
  "card.pulse_time": "זמן פולס",
  "card.cover_id": "מנוע / מזהה תריס",
  "card.mixed_radio_hint": "שייכו את הכפתור לקבוצת רדיו למטה. רדיו קלאסי משאיר תמיד חבר אחד דלוק (כיבוי מחזיר להדלקה). רק כפתורים בתפקיד «קבוצת רדיו» נשארים בקבוצה.",
  "card.mixed_cover_hint": "מנוע תריס: תפקידי פתיחה/סגירה וזמני נסיעה כאן. מזהה המנוע פנימי (לא ישות HA). אפשר לקשר ישות cover.* למטה כדי לשקף פתיחה/סגירה/עצירה לסטטוס ואוטומציות — ממסרי הפאנל עדיין מפעילים את המנוע.",
  "role.toggle": "טוגל",
  "role.momentary": "רגעי",
  "role.radio": "קבוצת רדיו",
  "role.cover_open": "פתיחת תריס",
  "role.cover_close": "סגירת תריס",
  "card.scheduler": "תזמון",
  "scheduler.hint": "טווחי זמן מפעילים פרופילים אוטומטית. שעת הסיום אינה כלולה — הדקה הזו מתחילה את הטווח הבא (למשל 08:00–12:00 מסתיים ממש לפני 12:00). מחוץ לכל הטווחים נבחר פרופיל ברירת המחדל. מצב חג בפאנל עוצר את התזמון כאן; מצב חג ראשי עוצר בכל הפאנלים.",
  "scheduler.holiday": "מצב חג (פאנל זה)",
  "scheduler.holiday_on": "התזמונים מושהים בפאנל זה",
  "scheduler.holiday_badge": "מצב חג פעיל — התזמונים מושהים",
  "scheduler.master_holiday": "מצב חג ראשי (כל הפאנלים)",
  "scheduler.master_holiday_on": "מצב חג ראשי עוצר את התזמון בכל הפאנלים",
  "scheduler.default_profile": "פרופיל ברירת מחדל",
  "scheduler.default_hint": "בשימוש כשאף טווח זמן פעיל לא מכסה את השעה הנוכחית.",
  "scheduler.tasks": "משימות מתוזמנות",
  "scheduler.add_task": "הוסף משימה",
  "scheduler.task_name": "שם משימה",
  "scheduler.enabled": "פעיל",
  "scheduler.notes": "הערות",
  "scheduler.weekdays": "ימים",
  "scheduler.months": "חודשים",
  "scheduler.ranges": "טווחי זמן",
  "scheduler.add_range": "הוסף טווח",
  "scheduler.range_from": "מ־",
  "scheduler.range_to": "עד",
  "scheduler.range_profile": "פרופיל",
  "scheduler.save_task": "שמור משימה",
  "scheduler.delete_task": "מחק",
  "scheduler.delete_range": "מחק טווח",
  "scheduler.delete_condition": "מחק",
  "scheduler.conflict_title": "התנגשות בתזמון",
  "scheduler.conflict_body": "שני טווחים פעילים יפעילו פרופילים שונים באותו זמן. שנו שעות, ימים, חודשים או פרופילים ושמרו שוב.",
  "scheduler.conflict_ok": "אישור",
  "scheduler.overnight_hint": "אם «מ־» מאוחר מ־«עד» (למשל 22:00–06:00), הטווח חוצה חצות ונשאר פעיל עד «עד» (לא כולל).",
  "scheduler.day_mon": "ב׳",
  "scheduler.day_tue": "ג׳",
  "scheduler.day_wed": "ד׳",
  "scheduler.day_thu": "ה׳",
  "scheduler.day_fri": "ו׳",
  "scheduler.day_sat": "ש׳",
  "scheduler.day_sun": "א׳",
  "scheduler.month_1": "ינו׳",
  "scheduler.month_2": "פבר׳",
  "scheduler.month_3": "מרץ",
  "scheduler.month_4": "אפר׳",
  "scheduler.month_5": "מאי",
  "scheduler.month_6": "יונ׳",
  "scheduler.month_7": "יול׳",
  "scheduler.month_8": "אוג׳",
  "scheduler.month_9": "ספט׳",
  "scheduler.month_10": "אוק׳",
  "scheduler.month_11": "נוב׳",
  "scheduler.month_12": "דצמ׳",
  "scheduler.saved": "המשימה נשמרה.",
  "scheduler.deleted": "המשימה נמחקה.",
  "scheduler.conditions": "תנאים",
  "scheduler.conditions_hint": "אופציונלי. כשתנאי נכשל המשימה אינה פעילה באותו רגע (התנגשויות זמן עדיין חלות גם עם תנאים).",
  "scheduler.add_condition": "הוסף תנאי",
  "scheduler.condition_entity": "ישות",
  "scheduler.condition_operator": "אופרטור",
  "scheduler.condition_value": "ערך",
  "scheduler.op_eq": "שווה",
  "scheduler.op_neq": "לא שווה",
  "scheduler.op_gt": "גדול מ־",
  "scheduler.op_lt": "קטן מ־",
  "scheduler.op_gte": "≥",
  "scheduler.op_lte": "≤",
  "scheduler.conflict_conditions_note": "תנאי ישויות אינם מבטלים התנגשויות זמן — טווחים חופפים עם פרופילים שונים עדיין נחסמים.",
  "scheduler.master_tasks": "משימות ראשיות (רב־פאנל)",
  "scheduler.add_master": "הוסף משימה ראשית",
  "scheduler.master_badge": "ראשית",
  "scheduler.master_panels": "פאנלים",
  "scheduler.master_hint": "משימה ראשית משתמשת באותם ימים, טווחים ותנאים בכל הפאנלים שנבחרו. בכל פאנל חייבים להיות מזהי פרופיל תואמים.",
  "scheduler.local_tasks": "משימות הפאנל הזה",
  "scheduler.next_profile": "הבא",
  "scheduler.next_at": "ב־",
  "scheduler.active_compact": "תזמון פעיל",
  "scheduler.transfer": "ייצוא / ייבוא תזמון",
  "scheduler.export": "ייצוא",
  "scheduler.import_merge": "ייבוא (מיזוג)",
  "scheduler.import_replace": "ייבוא (החלפה)",
  "scheduler.export_ok": "התזמון יוצא.",
  "scheduler.import_ok": "התזמון יובא.",
  "scheduler.import_invalid": "קובץ JSON של תזמון לא תקין.",
  "scheduler.import_hint": "הייצוא כולל משימות מקומיות, מזהה פרופיל ברירת מחדל, ומשימות ראשיות שמכוונות לפאנל זה. מצב חג (פאנל וראשי) אינו מיוצא. מיזוג מעדכן לפי מזהה; החלפה מחליפה רק משימות מקומיות (משימות ראשיות בקובץ ממוזגות).",
  "scheduler.import_warnings": "אזהרות ייבוא"
}, bi = {
  "card.title": "ConX Dynamic Panel",
  "card.sync": "Синхронизация",
  "card.pull": "Считать с панели",
  "card.save": "Сохранить черновик",
  "card.discard": "Отменить изменения",
  "card.create": "Создать",
  "card.duplicate": "Дублировать",
  "card.rename": "Переименовать",
  "card.delete": "Удалить",
  "card.duplicate_name": "Имя для дублированного профиля",
  "card.duplicate_ok": "Профиль дублирован.",
  "card.delete_ok": "Профиль удалён.",
  "card.keep_one_profile": "Должен остаться хотя бы один профиль.",
  "card.delete_blocked_scheduler": "Нельзя удалить профиль — он используется в задачах планировщика: {tasks}. Сначала удалите или измените эти задачи.",
  "card.profiles": "Профили",
  "card.editor": "Внешний вид",
  "card.buttons": "Кнопки",
  "card.preview": "Превью панели",
  "card.panel_unavailable": "Панель недоступна",
  "card.actions": "Действия",
  "card.status": "Статус",
  "card.error": "Ошибка",
  "card.mode": "Режим",
  "card.color_on": "Цвет ВКЛ",
  "card.color_off": "Цвет ВЫКЛ",
  "card.radar": "Радар",
  "color.red": "Красный",
  "color.blue": "Синий (на панели выглядит как циан)",
  "color.green": "Зелёный",
  "color.white": "Белый",
  "color.yellow": "Жёлтый",
  "color.magenta": "Пурпурный",
  "color.cyan": "Циан",
  "color.warm_white": "Тёплый белый",
  "color.warm_yellow": "Тёплый жёлтый",
  "radar.none": "Нет (выкл.)",
  "card.backlight": "Подсветка",
  "card.backlight_brightness": "Яркость подсветки",
  "card.child_lock": "Блокировка",
  "card.theme": "Тема интерфейса",
  "card.button": "Кнопка",
  "card.button_expand": "Развернуть настройки кнопки",
  "card.button_collapse": "Свернуть настройки кнопки",
  "card.label": "Название",
  "card.action": "Действие",
  "card.action_double": "Действие двойного нажатия",
  "card.action_not_set": "Не задано",
  "card.action_expand": "Развернуть настройки действия",
  "card.action_collapse": "Свернуть настройки действия",
  "card.multi_click_hint": "Необязательно. Если задано двойное нажатие, нажатия классифицируются после короткой паузы — выполняется только одно из: одиночное / двойное (не одиночное дважды). Двойное нажатие возвращает реле кнопки в состояние до двух нажатий (с подавлением перехода), затем выполняет действие двойного нажатия. Одиночное нажатие остаётся обычным переключением. Импульсные и рольставни не восстанавливают реле.",
  "card.entity_id": "Entity ID",
  "card.action_none": "Без действия Home Assistant",
  "card.entity_none": "Без сущности (необязательно)",
  "card.action_picker_hint": "Поиск службы Home Assistant (домен.служба).",
  "card.entity_picker_hint": "Поиск сущностей; фильтр по домену действия, если он выбран.",
  "card.action_data": "Данные действия (YAML)",
  "card.action_data_hint": "Живой пример заполняется для выбранного домена/службы — правьте только нужные поля. Необязательные поля data (как Инструменты разработчика → Действия → data:). Одна строка key: value или JSON-объект. Выбор сущности по-прежнему задаёт target.",
  "card.action_data_placeholder": "brightness_pct: 70",
  "card.action_data_invalid": "Некорректные данные действия",
  "card.picker_search": "Поиск…",
  "card.radio_participation": "Поведение кнопки",
  "card.radio_member": "В радиогруппе",
  "card.radio_toggle": "Независимый тоггл",
  "card.radio_groups": "Радиогруппы",
  "card.radio_groups_hint": "Нажмите L1–L4, чтобы добавить или убрать кнопку. Кнопки в группе работают как классическое радио: ровно одна включена. Кнопки вне групп остаются независимыми тогглами.",
  "card.radio_groups_toggle": "Показать радиогруппы",
  "card.radio_group": "Группа",
  "card.radio_groups_overlap": "Каждая кнопка может входить только в одну радиогруппу.",
  "card.cover": "Ролета / жалюзи",
  "card.cover_hint": "Выберите кнопки панели, управляющие мотором. Нажатие направления запускает движение по таймеру, повторное нажатие останавливает его. Интеграция никогда не включает оба направления одновременно.",
  "card.cover_open_button": "Кнопка открытия",
  "card.cover_close_button": "Кнопка закрытия",
  "card.cover_open_time": "Время открытия",
  "card.cover_close_time": "Время закрытия",
  "card.cover_settle": "Задержка смены направления",
  "card.cover_times": "Время хода",
  "card.mixed_cover_times_hint": "Открыть/закрыть задаются ролями выше. Время хода — в карточке роли ролеты.",
  "card.mixed_cover_times_on": "Время хода для этого мотора задано на L{n}.",
  "card.cover_id_hint": "Внутренний слот мотора для пары открыть/закрыть — не сущность cover.* Home Assistant.",
  "card.cover_ha_entity": "Сущность cover в HA (необязательно)",
  "card.cover_ha_entity_hint": "Кнопки панели по-прежнему управляют реле мотора. Свяжите cover.*, чтобы зеркалировать открытие/закрытие/стоп для статуса и автоматизаций HA.",
  "card.cover_ha_entity_none": "Без cover в HA (необязательно)",
  "card.cover_settle_hint": "Короткая пауза перед сменой направления (безопасность реле мотора).",
  "card.cover_opposite": "Противоположное нажатие",
  "card.cover_same_button": "Открытие и закрытие должны использовать разные кнопки.",
  "card.cover_live": "Управление ролетой",
  "card.cover_open": "Открыть",
  "card.cover_close": "Закрыть",
  "card.cover_stop": "Стоп",
  "card.cover_state_idle": "Остановлено",
  "card.cover_state_open": "Открывается",
  "card.cover_state_close": "Закрывается",
  "card.cover_seconds": "с",
  "card.cover_safety": "Безопасность: нажатия обрабатываются интеграцией. Оба реле направлений принудительно выключаются при остановке, истечении таймера, смене профиля, синхронизации и перезагрузке.",
  "card.cover_add": "Добавить ролету",
  "card.cover_remove": "Удалить",
  "card.cover_slot_empty": "Не настроено",
  "card.cover_slot_hint": "Назначьте оставшиеся кнопки второй ролете. Каждой ролете нужны две разные кнопки (открыть + закрыть).",
  "card.gang_count": "Число кнопок",
  "card.gang_count_hint": "Сколько физических кнопок (L1…Ln) использует профиль. Число ролет ограничено floor(n/2). Выберите 4, чтобы использовать две ролеты.",
  "cover.stop_only": "Только стоп",
  "cover.stop_then_reverse": "Стоп, затем реверс",
  "theme.noir": "Нуар серый",
  "theme.ivory": "Слоновая кость холодная",
  "card.unsaved": "Несохранённый черновик — нажатия на панели всё ещё по последнему сохранённому профилю. Сохраните черновик для ролей/действий; синхронизация обновляет подписи и цвета на панели.",
  "card.sync_needed": "Черновик сохранён. Поведение кнопок уже по этому черновику. Синхронизируйте панель, чтобы отправить подписи, цвета и настройки на железо.",
  "card.missing_action": "Нет действия Home Assistant — изменится только реле панели.",
  "card.loading": "Загрузка панели…",
  "card.missing_entry": "Укажите entry_id для карточки.",
  "card.compact": "Компактный режим",
  "card.operate": "Управление",
  "card.operate_exit": "Настройки",
  "card.operate_hint": "Показать только панель и живые элементы управления",
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
  "card.panel_name": "Имя панели",
  "card.panel_name_ok": "Имя панели обновлено.",
  "card.menu": "Настройки",
  "card.tabs_hint": "Три шага настройки под превью панели",
  "card.step_1": "Шаг 1",
  "card.step_2": "Шаг 2",
  "card.step_3": "Шаг 3",
  "card.step_4": "Шаг 4",
  "card.wizard": "Мастер настройки",
  "card.wizard_next": "Далее",
  "card.wizard_back": "Назад",
  "card.step_language": "Язык",
  "card.step_profiles": "Панель / профиль",
  "card.step_edit": "Настройки",
  "card.step_preview": "Превью панели",
  "card.step_review": "Обзор и синхронизация",
  "card.step_transfer": "Экспорт / импорт",
  "card.step_language_hint": "Выберите язык карточки. Иврит использует RTL.",
  "card.step_profiles_hint": "Выберите активный профиль и число физических кнопок.",
  "card.step_edit_hint": "Редактируйте внешний вид и подписи. Черновик локальный до сохранения/синхронизации.",
  "card.step_preview_hint": "Живое превью Zemismart: подписи сверху, LED-кольца слева направо.",
  "card.step_review_hint": "Проверьте черновик, сохраните, затем синхронизируйте на панель.",
  "card.step_transfer_hint": "Скачайте или загрузите JSON-файл, поддерживаемый Home Assistant.",
  "card.import_mode": "Режим импорта",
  "card.schema_title": "Поддерживаемая схема JSON",
  "card.schema_body": "Файл должен соответствовать export_profiles: schema_version, active_profile_id, profiles.",
  "card.service_yaml": "YAML вызова сервиса",
  "card.copy_yaml": "Копировать YAML",
  "card.copied": "Скопировано",
  "card.close": "Закрыть",
  "card.more": "Ещё",
  "card.info": "Справка",
  "info.title": "Справочник по карточке",
  "info.intro": "Краткий обзор основных элементов карточки. Открывается из меню в любой момент.",
  "info.profiles_title": "Профили",
  "info.profiles_body": "Создание, переименование, дублирование, удаление и активация профилей. Число кнопок (1–4) задаёт, сколько физических кнопок (L1…Ln) использует профиль.",
  "info.appearance_title": "Внешний вид",
  "info.appearance_body": "Цвета LED ВКЛ/ВЫКЛ, радар, подсветка, яркость и блокировка. Обновляются на железе при синхронизации.",
  "info.buttons_title": "Кнопки",
  "info.buttons_body": "Выберите режим, затем правьте подписи и поведение. В свободном миксе задайте роль для каждого L#. Раскройте строку кнопки для Action, Entity и необязательных данных действия (YAML).",
  "info.modes_title": "Режимы",
  "info.modes_body": "Toggle: каждая кнопка фиксируется отдельно. Radio mandatory / optional / split: взаимоисключающие группы. Cover: отдельная схема ролеты. Free mix: у каждой кнопки своя роль.",
  "info.roles_title": "Роли свободного микса",
  "info.roles_body": "Toggle = зафиксированное реле. Momentary = ВКЛ, затем ВЫКЛ после времени импульса (повторное нажатие отменяет). Radio = классическая радиогруппа. Cover open/close = направления мотора по слоту.",
  "info.sync_title": "Черновик и синхронизация",
  "info.sync_body": "Сохранить черновик записывает роли и действия, чтобы нажатия шли по черновику. Синхронизация отправляет подписи, цвета и настройки на панель. Пока черновик не сохранён, физические нажатия идут по последнему сохранённому профилю.",
  "info.operate_title": "Режим управления",
  "info.operate_body": "Показывает только лицевую панель для повседневного использования. В меню строки заголовка выберите «Настройки», чтобы вернуться к полному редактору.",
  "info.cover_title": "Мотор ролеты и сущность HA",
  "info.cover_body": "Мотор / слот ролеты связывает открытие и закрытие внутри — это не сущность cover.* Home Assistant. Время хода и противоположное нажатие задаются на первой карточке роли cover для этого мотора. Можно связать cover.*, чтобы зеркалировать open/close/stop для статуса и автоматизаций; реле панели по-прежнему управляют мотором.",
  "info.actions_title": "Действия и YAML",
  "info.actions_body": "Action — служба Home Assistant (домен.служба). Entity задаёт цель. Данные действия (YAML) заполняются живым примером для выбранного домена/службы — правьте по необходимости. Доп. поля data не заменяют цель сущности.",
  "info.menu_title": "Меню настроек",
  "info.menu_body": "Язык, тема, экспорт/импорт, пример автоматизации YAML и эта справка.",
  "card.automation_example": "Пример автоматизации",
  "card.automation_example_hint": "Переключение профилей по времени суток. Активация профиля меняет только сохранённый черновик — физическая панель меняется, только если вызов также синхронизирует, поэтому во всех действиях указано sync: true.",
  "card.automation_yaml_alias": "ConX Dynamic Panel - профиль по времени суток",
  "card.automation_yaml_header": "ConX Dynamic Panel: переключение активного профиля по времени суток.",
  "card.automation_yaml_sync": "sync: true отправляет профиль на физическую панель. Без него меняется только черновик.",
  "card.automation_yaml_ids": "Замените entry_id и profile_id на значения вашей панели.",
  "card.automation_yaml_morning": "Утро",
  "card.automation_yaml_evening": "Вечер",
  "card.automation_yaml_night": "Ночь",
  "card.choose_file": "Выбрать JSON",
  "card.download_export": "Скачать .json",
  "editor.entry_id": "ID записи конфигурации",
  "mode.toggle": "Переключатель",
  "mode.radio_mandatory": "Радио (обязательно)",
  "mode.radio_optional": "Радио (опционально)",
  "mode.radio_split": "Радио сплит",
  "mode.mixed": "Свободный микс",
  "mode.cover": "Ролета / жалюзи",
  "card.mixed_hint": "Настройте каждую кнопку отдельно: тоггл (защёлка реле), импульс, радиогруппа или открытие/закрытие ролеты. Импульс включает, затем выключает по таймеру; повторное нажатие отменяет и выключает. Отдельной роли «реле» нет — для защёлки реле выберите Тоггл и при необходимости задайте действие Home Assistant.",
  "card.mixed_roles": "Роль каждой кнопки",
  "card.button_role": "Роль кнопки",
  "card.pulse_time": "Время импульса",
  "card.cover_id": "Мотор / слот ролеты",
  "card.mixed_radio_hint": "Назначьте кнопку в радиогруппу ниже. Классическое радио держит ровно одного участника включённым (выключение возвращает включение). В группах остаются только кнопки с ролью «Радиогруппа».",
  "card.mixed_cover_hint": "Мотор ролеты: роли Открыть/Закрыть и время хода здесь. Слот мотора внутренний (не сущность HA). Ниже можно связать cover.* для зеркалирования открытия/закрытия/стопа в HA — реле панели по-прежнему управляют мотором.",
  "role.toggle": "Тоггл",
  "role.momentary": "Импульс",
  "role.radio": "Радиогруппа",
  "role.cover_open": "Открыть ролету",
  "role.cover_close": "Закрыть ролету",
  "card.scheduler": "Расписание",
  "scheduler.hint": "Временные диапазоны автоматически активируют профили. Конец диапазона не включается — эта минута начинает следующий диапазон (например 08:00–12:00 действует до 12:00). Вне диапазонов используется профиль по умолчанию. Праздник панели останавливает планировщик здесь; мастер-праздник — на всех панелях.",
  "scheduler.holiday": "Режим праздника (эта панель)",
  "scheduler.holiday_on": "Планировщики на паузе на этой панели",
  "scheduler.holiday_badge": "Режим праздника включён — планировщики на паузе",
  "scheduler.master_holiday": "Мастер-праздник (все панели)",
  "scheduler.master_holiday_on": "Мастер-праздник останавливает планировщики на всех панелях",
  "scheduler.default_profile": "Профиль по умолчанию",
  "scheduler.default_hint": "Используется, когда ни один активный диапазон не покрывает текущее время.",
  "scheduler.tasks": "Задачи расписания",
  "scheduler.add_task": "Добавить задачу",
  "scheduler.task_name": "Имя задачи",
  "scheduler.enabled": "Включено",
  "scheduler.notes": "Заметки",
  "scheduler.weekdays": "Дни",
  "scheduler.months": "Месяцы",
  "scheduler.ranges": "Временные диапазоны",
  "scheduler.add_range": "Добавить диапазон",
  "scheduler.range_from": "С",
  "scheduler.range_to": "До",
  "scheduler.range_profile": "Профиль",
  "scheduler.save_task": "Сохранить задачу",
  "scheduler.delete_task": "Удалить",
  "scheduler.delete_range": "Удалить диапазон",
  "scheduler.delete_condition": "Удалить",
  "scheduler.conflict_title": "Конфликт расписания",
  "scheduler.conflict_body": "Два включённых диапазона активировали бы разные профили одновременно. Измените время, дни, месяцы или профили и сохраните снова.",
  "scheduler.conflict_ok": "OK",
  "scheduler.overnight_hint": "Если «С» позже «До» (например 22:00–06:00), диапазон переходит через полночь и действует до «До» (не включая эту минуту).",
  "scheduler.day_mon": "Пн",
  "scheduler.day_tue": "Вт",
  "scheduler.day_wed": "Ср",
  "scheduler.day_thu": "Чт",
  "scheduler.day_fri": "Пт",
  "scheduler.day_sat": "Сб",
  "scheduler.day_sun": "Вс",
  "scheduler.month_1": "Янв",
  "scheduler.month_2": "Фев",
  "scheduler.month_3": "Мар",
  "scheduler.month_4": "Апр",
  "scheduler.month_5": "Май",
  "scheduler.month_6": "Июн",
  "scheduler.month_7": "Июл",
  "scheduler.month_8": "Авг",
  "scheduler.month_9": "Сен",
  "scheduler.month_10": "Окт",
  "scheduler.month_11": "Ноя",
  "scheduler.month_12": "Дек",
  "scheduler.saved": "Задача сохранена.",
  "scheduler.deleted": "Задача удалена.",
  "scheduler.conditions": "Условия",
  "scheduler.conditions_hint": "Необязательно. Если условие не выполняется, задача неактивна в этот момент (конфликты времени всё равно учитываются).",
  "scheduler.add_condition": "Добавить условие",
  "scheduler.condition_entity": "Сущность",
  "scheduler.condition_operator": "Оператор",
  "scheduler.condition_value": "Значение",
  "scheduler.op_eq": "равно",
  "scheduler.op_neq": "не равно",
  "scheduler.op_gt": "больше",
  "scheduler.op_lt": "меньше",
  "scheduler.op_gte": "≥",
  "scheduler.op_lte": "≤",
  "scheduler.conflict_conditions_note": "Условия сущностей не отменяют конфликты времени — пересекающиеся диапазоны с разными профилями по-прежнему блокируются.",
  "scheduler.master_tasks": "Мастер-задачи (несколько панелей)",
  "scheduler.add_master": "Добавить мастер-задачу",
  "scheduler.master_badge": "Мастер",
  "scheduler.master_panels": "Панели",
  "scheduler.master_hint": "Мастер-задача использует те же дни, диапазоны и условия на всех выбранных панелях. На каждой панели должны быть совпадающие ID профилей.",
  "scheduler.local_tasks": "Задачи этой панели",
  "scheduler.next_profile": "Далее",
  "scheduler.next_at": "в",
  "scheduler.active_compact": "Планировщик включён",
  "scheduler.transfer": "Экспорт / импорт планировщика",
  "scheduler.export": "Экспорт",
  "scheduler.import_merge": "Импорт (слияние)",
  "scheduler.import_replace": "Импорт (замена)",
  "scheduler.export_ok": "Планировщик экспортирован.",
  "scheduler.import_ok": "Планировщик импортирован.",
  "scheduler.import_invalid": "Неверный JSON файл планировщика.",
  "scheduler.import_hint": "Экспорт включает локальные задачи, id профиля по умолчанию и мастер-задачи для этой панели. Режим праздника (панель и мастер) не экспортируется. Слияние обновляет по id; замена заменяет только локальные задачи (мастер-задачи из файла сливаются).",
  "scheduler.import_warnings": "Предупреждения импорта"
}, vi = {
  en: Wt,
  he: gi,
  ru: bi
}, Ne = [
  { id: "he", label: "עברית", flag: "IL" },
  { id: "en", label: "English", flag: "GB" },
  { id: "ru", label: "Русский", flag: "RU" }
];
function ce(e) {
  const t = (e || "en").toLowerCase();
  return t.startsWith("he") || t.startsWith("iw") ? "he" : t.startsWith("ru") ? "ru" : "en";
}
function yi() {
  var e, t;
  try {
    const r = (t = (e = globalThis.localStorage) == null ? void 0 : e.getItem) == null ? void 0 : t.call(e, It);
    if (r === "en" || r === "he" || r === "ru")
      return r;
  } catch {
  }
  return Ut.language || null;
}
function xi(e) {
  var t, r;
  Ut.language = e;
  try {
    (r = (t = globalThis.localStorage) == null ? void 0 : t.setItem) == null || r.call(t, It, e);
  } catch {
  }
}
function P(e, t) {
  const r = ce(e);
  return vi[r][t] || Wt[t] || t;
}
function Yt(e) {
  return ce(e) === "he";
}
const Gt = "conx-dynamic-panel-operate", Jt = {};
function $i() {
  var e, t;
  try {
    const r = (t = (e = globalThis.localStorage) == null ? void 0 : e.getItem) == null ? void 0 : t.call(e, Gt);
    if (r === "1")
      return !0;
    if (r === "0")
      return !1;
  } catch {
  }
  return Jt.operate === !0;
}
function wi(e) {
  var t, r;
  Jt.operate = e;
  try {
    (r = (t = globalThis.localStorage) == null ? void 0 : t.setItem) == null || r.call(
      t,
      Gt,
      e ? "1" : "0"
    );
  } catch {
  }
}
const qt = "conx-dynamic-panel-theme", ki = {
  industrial: "ivory",
  glass: "ivory",
  glass_light: "ivory",
  light_soft: "ivory",
  light: "ivory",
  black_orange: "noir",
  obsidian: "noir",
  obsidian_orange: "noir",
  graphite: "noir",
  midnight_teal: "noir",
  dark: "noir"
}, We = [
  {
    id: "noir",
    swatch: "linear-gradient(145deg, #2e3440 0%, #1a1d22 38%, #242830 68%, #d4af61 100%)",
    accent: "#d4af61"
  },
  {
    id: "ivory",
    swatch: "linear-gradient(145deg, #ffffff 0%, #f5f7fa 48%, #e8ecf1 72%, #8a7348 100%)",
    accent: "#8a7348"
  }
], Si = new Set(We.map((e) => e.id));
function xe(e) {
  return e ? Si.has(e) ? e : ki[e] || "noir" : "noir";
}
function vt() {
  var e, t;
  try {
    const r = (t = (e = globalThis.localStorage) == null ? void 0 : e.getItem) == null ? void 0 : t.call(e, qt);
    return r ? xe(r) : null;
  } catch {
  }
  return null;
}
function Ai(e) {
  var t, r;
  try {
    (r = (t = globalThis.localStorage) == null ? void 0 : t.setItem) == null || r.call(t, qt, e);
  } catch {
  }
}
function yt(e, t) {
  return e ? xe(e) : t || "noir";
}
var Oi = Object.defineProperty, Ei = Object.getOwnPropertyDescriptor, f = (e, t, r, i) => {
  for (var a = i > 1 ? void 0 : i ? Ei(t, r) : t, o = e.length - 1, n; o >= 0; o--)
    (n = e[o]) && (a = (i ? n(t, r, a) : n(a)) || a);
  return i && a && Oi(t, r, a), a;
};
const H = [
  "language",
  "profiles",
  "edit",
  "preview",
  "review",
  "transfer"
], xt = {
  red: "#ff1744",
  blue: "#00c8de",
  green: "#00e676",
  white: "#f5f7fa",
  yellow: "#ffea00",
  magenta: "#f50057",
  cyan: "#00e5ff",
  warm_white: "#ffe0b2",
  warm_yellow: "#ffc400"
}, $t = /* @__PURE__ */ new Set([
  "warm_white",
  "warm_yellow",
  "warmwhite",
  "warmyellow"
]), Kt = "#00e5ff", Ci = "#00c8de", Xt = "conx-dynamic-panel-radio-groups-open";
function Pi() {
  var e, t;
  try {
    const r = (t = (e = globalThis.localStorage) == null ? void 0 : e.getItem) == null ? void 0 : t.call(e, Xt);
    if (r === "0")
      return !1;
    if (r === "1")
      return !0;
  } catch {
  }
  return null;
}
function Di(e) {
  var t, r;
  try {
    (r = (t = globalThis.localStorage) == null ? void 0 : t.setItem) == null || r.call(t, Xt, e ? "1" : "0");
  } catch {
  }
}
function ve(e) {
  return e.trim().toLowerCase().replace(/[\s-./]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}
function U(e) {
  if (!e)
    return !1;
  const t = ve(e);
  return $t.has(t) ? !0 : $t.has(t.replace(/_/g, ""));
}
function W(e) {
  const t = ve(e);
  return t === "warm_white" || t === "warmwhite" ? "white" : t === "warm_yellow" || t === "warmyellow" ? "yellow" : e.trim();
}
function Ti(e) {
  return (e || []).filter((t) => !U(t));
}
function _e(e, t = Kt) {
  if (!e)
    return t;
  const i = W(e).trim().toLowerCase().replace(/[\s-]+/g, "_");
  return xt[i] || xt[i.replace(/_/g, "")] || t;
}
function Ri(e, ...t) {
  const r = Ti(e), i = new Set(r.map((a) => ve(a)));
  for (const a of t) {
    const o = String(a || "").trim();
    if (!o)
      continue;
    const n = U(o) ? W(o) : o, s = ve(n);
    !s || i.has(s) || (r.push(n), i.add(s));
  }
  return r;
}
function Mi(e, ...t) {
  const r = [...e || []], i = new Set(r);
  for (const a of t) {
    const o = String(a || "").trim();
    !o || i.has(o) || (r.push(o), i.add(o));
  }
  return r;
}
function wt(e, t) {
  const r = e.trim().toLowerCase().replace(/[\s-]+/g, "_"), i = P(t, `color.${r}`);
  return i !== `color.${r}` ? i : e;
}
function zi(e, t) {
  const r = e.trim().toLowerCase().replace(/[\s-]+/g, "_"), i = P(t, `radar.${r}`);
  return i !== `radar.${r}` ? i : e;
}
let m = class extends Y {
  constructor() {
    super(...arguments), this._loading = !1, this._busy = !1, this._syncPulse = !1, this._pressedRing = null, this._splitPreviewOn = {}, this._runtimeRelayStates = [], this._momentaryPreviewTimers = {}, this._radioPreviewSelected = null, this._theme = "noir", this._operateMode = !1, this._wizardStep = "transfer", this._importMode = "merge", this._schedulerImportMode = "merge", this._schedulerImportWarnings = [], this._serviceYaml = "", this._sections = {
      profiles: !0,
      appearance: !0,
      buttons: !0,
      theme: !1,
      preview: !0,
      actions: !0,
      transfer: !0
    }, this._expandedButtons = {}, this._activeTab = "profiles", this._schedulerDraft = null, this._schedulerConflict = null, this._menuOpen = !1, this._automationOpen = !1, this._infoOpen = !1, this._previewOpen = !0, this._panelNameDraft = "", this._radioGroupsOpen = !0, this._haEntityPickerReady = !1, this._haServicePickerReady = !1, this._pickerFilter = {}, this._actionDataOpen = {}, this._actionDataText = {}, this._actionDataError = {}, this._actionDataAutoDefault = {}, this._actionSlotOpen = {}, this._haPickerLoadStarted = !1, this._lastLiveRelays = {};
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
  setConfig(e) {
    if (!e.entry_id)
      throw new Error("entry_id is required");
    this._config = e, e.language && (this._uiLang = ce(e.language)), this._theme = yt(e.theme, vt());
  }
  connectedCallback() {
    var e;
    super.connectedCallback(), this._uiLang || (this._uiLang = yi() || void 0), this._theme = yt((e = this._config) == null ? void 0 : e.theme, vt()), this._operateMode = $i(), this._operateMode && (this._previewOpen = !0), this._ensureFonts(), this._ensureRuntimeSubscription(), this._ensureHaEntityPicker();
  }
  _toggleOperateMode() {
    this._setOperateMode(!this._operateMode);
  }
  _setOperateMode(e) {
    this._operateMode = e, wi(this._operateMode), this._operateMode && (this._previewOpen = !0, this._menuOpen = !1, this._automationOpen = !1, this._infoOpen = !1);
  }
  _exitOperateMode() {
    this._setOperateMode(!1), this._menuOpen = !1;
  }
  disconnectedCallback() {
    this._teardownRuntimeSubscription(), this._clearFaceplatePreview(), super.disconnectedCallback();
  }
  _stepLabel(e) {
    return this.t(`card.step_${e}`);
  }
  _goToStep(e) {
    this._wizardStep = e, this._notice = void 0;
  }
  _wizardIndex() {
    return H.indexOf(this._wizardStep);
  }
  _wizardNext() {
    const e = this._wizardIndex();
    e < H.length - 1 && this._goToStep(H[e + 1]);
  }
  _wizardBack() {
    const e = this._wizardIndex();
    e > 0 && this._goToStep(H[e - 1]);
  }
  _buildServiceYaml(e) {
    if (!this._panel || !this._config)
      return "";
    const t = e || ri(this._panel.profiles, this._panel.active_profile_id);
    return ii(
      t,
      this._importMode,
      this._config.entry_id
    );
  }
  _refreshServiceYaml(e) {
    this._serviceYaml = this._buildServiceYaml(e);
  }
  async _copyServiceYaml() {
    const e = this._buildServiceYaml();
    this._serviceYaml = e, await this._copyToClipboard(e);
  }
  async _copyToClipboard(e) {
    try {
      await navigator.clipboard.writeText(e), this._notice = this.t("card.copied") + " ✓";
    } catch {
      this._error = "Clipboard unavailable";
    }
  }
  _buildAutomationYaml() {
    var t;
    const e = this._panel ? Object.keys(this._panel.profiles) : [];
    return Kr({
      entryId: (t = this._config) == null ? void 0 : t.entry_id,
      profileIds: e,
      comments: {
        alias: this.t("card.automation_yaml_alias"),
        header: this.t("card.automation_yaml_header"),
        sync: this.t("card.automation_yaml_sync"),
        ids: this.t("card.automation_yaml_ids"),
        morning: this.t("card.automation_yaml_morning"),
        evening: this.t("card.automation_yaml_evening"),
        night: this.t("card.automation_yaml_night")
      }
    });
  }
  async _copyAutomationYaml() {
    await this._copyToClipboard(this._buildAutomationYaml());
  }
  _ensureFonts() {
    const e = "conx-dynamic-panel-fonts";
    if (document.getElementById(e))
      return;
    const t = document.createElement("link");
    t.id = e, t.rel = "stylesheet", t.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap", document.head.appendChild(t);
  }
  updated(e) {
    var t;
    (e.has("hass") || e.has("_config")) && this.hass && ((t = this._config) != null && t.entry_id) && !this._panel && !this._loading && this._load(), (e.has("hass") || e.has("_config") || e.has("_panel")) && this._ensureRuntimeSubscription();
  }
  willUpdate(e) {
    var t, r;
    if ((e.has("hass") || e.has("_panel") || e.has("_runtimeRelayStates") || e.has("_draft")) && ((r = (t = this._panel) == null ? void 0 : t.relay_entities) != null && r.length)) {
      const i = this._previewAfterLiveReconcile();
      i && (this._splitPreviewOn = i);
    }
  }
  get _language() {
    var e, t, r;
    return this._uiLang ? this._uiLang : ce(
      ((t = (e = this.hass) == null ? void 0 : e.locale) == null ? void 0 : t.language) || ((r = this.hass) == null ? void 0 : r.language) || "en"
    );
  }
  t(e) {
    return P(this._language, e);
  }
  get _dirty() {
    return !Ir(this._draft || null, this._saved || null);
  }
  _setLanguage(e) {
    this._uiLang = e, xi(e);
  }
  _setTheme(e) {
    this._theme = xe(e), Ai(this._theme), this._config && (this._config = { ...this._config, theme: this._theme }, this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: !0,
        composed: !0
      })
    ));
  }
  _isRadioMember(e) {
    var r;
    const t = (r = this._draft) == null ? void 0 : r.buttons.find((i) => i.index === e);
    return (t == null ? void 0 : t.radio_member) !== !1;
  }
  _ensureRadioGroups(e) {
    const t = Array.isArray(e.radio_groups) ? e.radio_groups : [], r = k(e.gang_count ?? 4), i = e.mode === "mixed" ? new Set(
      (e.buttons || []).filter(
        (o) => o.role === "radio" && o.index <= r
      ).map((o) => o.index)
    ) : null, a = t.map((o, n) => ({
      id: String((o == null ? void 0 : o.id) || `g${n + 1}`),
      buttons: Array.isArray(o == null ? void 0 : o.buttons) ? o.buttons.map((s) => Number(s)).filter(
        (s, c, l) => s >= 1 && s <= r && l.indexOf(s) === c && (i == null || i.has(s))
      ) : []
    }));
    for (; a.length < 2; )
      a.push({ id: `g${a.length + 1}`, buttons: [] });
    e.radio_groups = a;
  }
  _radioGroupFor(e) {
    var t, r;
    return ((r = (t = this._draft) == null ? void 0 : t.radio_groups) == null ? void 0 : r.find(
      (i) => i.buttons.includes(e)
    )) ?? null;
  }
  _radioGroupsOverlap() {
    var t;
    const e = /* @__PURE__ */ new Map();
    for (const r of ((t = this._draft) == null ? void 0 : t.radio_groups) || [])
      for (const i of r.buttons) {
        if (e.has(i)) return !0;
        e.set(i, r.id);
      }
    return !1;
  }
  _toggleSplitGroupButton(e, t, r) {
    this._patchDraft((i) => {
      if (r && i.mode === "mixed") {
        const o = i.buttons.find((n) => n.index === t);
        o && o.role !== "radio" && (o.role = "radio", o.cover_id = null);
      }
      this._ensureRadioGroups(i), (i.radio_groups || []).forEach((o, n) => {
        n === e ? r && !o.buttons.includes(t) ? o.buttons = [...o.buttons, t] : r || (o.buttons = o.buttons.filter((s) => s !== t)) : r && (o.buttons = o.buttons.filter((s) => s !== t));
      });
    });
  }
  _ungroupedButtons() {
    var t;
    const e = /* @__PURE__ */ new Set();
    for (const r of ((t = this._draft) == null ? void 0 : t.radio_groups) || [])
      for (const i of r.buttons)
        e.add(i);
    return new Set(this._gangIndexes().filter((r) => !e.has(r)));
  }
  _makeButtonIndependent(e) {
    this._patchDraft((t) => {
      this._ensureRadioGroups(t);
      for (const r of t.radio_groups || [])
        r.buttons = r.buttons.filter((i) => i !== e);
    });
  }
  _renderRadioMemberCell(e, t, r = {}) {
    const i = !!r.independent, a = [
      "radio-member",
      t ? "on" : "",
      i ? "is-independent" : ""
    ].filter(Boolean).join(" "), o = () => {
      if (!this._busy) {
        if (i) {
          t || this._makeButtonIndependent(e);
          return;
        }
        this._toggleSplitGroupButton(
          r.groupIndex ?? 0,
          e,
          !t
        );
      }
    };
    return d`
      <button
        type="button"
        class=${a}
        role="switch"
        aria-checked=${t ? "true" : "false"}
        ?disabled=${this._busy || i && t}
        @click=${o}
      >
        <span class="radio-member-label">L${e}</span>
      </button>
    `;
  }
  _renderRadioGroupsEditor() {
    if (!this._draft)
      return u;
    if (this._draft.mode === "mixed") {
      if (!this._draft.buttons.some(
        (i) => i.index <= this._gangCount() && i.role === "radio"
      ))
        return u;
    } else if (this._draft.mode !== "radio_split")
      return u;
    const e = this._ungroupedButtons(), t = this._radioGroupsOpen;
    return d`
      <div class="radio-groups-section ${t ? "open" : ""}">
        <div class="radio-groups-head">
          <div class="radio-groups-head-main">
            <span class="menu-label">${this.t("card.radio_groups")}</span>
            ${t ? u : d`<div class="radio-groups-summary">
                  ${this._radioGroupsSummary()}
                </div>`}
          </div>
          <label class="switch" title=${this.t("card.radio_groups_toggle")}>
            <input
              type="checkbox"
              data-radio-groups-open
              .checked=${t}
              ?disabled=${this._busy}
              @change=${(r) => this._setRadioGroupsOpen(
      r.target.checked
    )}
            />
            <span class="slider"></span>
          </label>
        </div>
        ${t ? d`
              <p class="radio-groups-hint">
                ${this.t("card.radio_groups_hint")}
              </p>
              ${(this._draft.radio_groups || []).map(
      (r, i) => d`
                  <div class="radio-group-card">
                    <div class="radio-group-title">
                      ${this.t("card.radio_group")} ${i + 1}
                    </div>
                    <div
                      class="radio-group-members"
                      dir="ltr"
                      style="--conx-gang-count:${this._gangCount()}"
                    >
                      ${this._gangIndexes().map(
        (a) => this._renderRadioMemberCell(
          a,
          r.buttons.includes(a),
          { groupIndex: i }
        )
      )}
                    </div>
                  </div>
                `
    )}
              <div class="radio-group-card is-summary">
                <div class="radio-group-title">
                  ${this.t("card.radio_toggle")}
                </div>
                <div
                  class="radio-group-members"
                  dir="ltr"
                  style="--conx-gang-count:${this._gangCount()}"
                >
                  ${this._gangIndexes().map(
      (r) => this._renderRadioMemberCell(
        r,
        e.has(r),
        { independent: !0 }
      )
    )}
                </div>
              </div>
            ` : u}
        ${this._radioGroupsOverlap() ? d`<div class="radio-groups-error">
              ${this.t("card.radio_groups_overlap")}
            </div>` : u}
      </div>
    `;
  }
  _toggleSection(e) {
    this._sections = { ...this._sections, [e]: !this._sections[e] };
  }
  _toggleButtonEditor(e) {
    this._expandedButtons = {
      ...this._expandedButtons,
      [e]: !this._expandedButtons[e]
    };
  }
  async _load() {
    var e;
    if (!(!this.hass || !((e = this._config) != null && e.entry_id))) {
      this._loading = !0, this._error = void 0;
      try {
        const t = await at(this.hass, this._config.entry_id);
        this._applyPanel(t), this._ensureRuntimeSubscription();
      } catch (t) {
        this._error = t instanceof Error ? t.message : String(t);
      } finally {
        this._loading = !1;
      }
    }
  }
  _applyPanel(e) {
    var i;
    this._panel = {
      ...e,
      scheduler_tasks: e.scheduler_tasks || {},
      master_scheduler_tasks: e.master_scheduler_tasks || {},
      panels: e.panels || [],
      default_profile_id: e.default_profile_id ?? e.active_profile_id,
      holiday_mode: !!e.holiday_mode,
      panel_holiday_mode: !!(e.panel_holiday_mode ?? e.holiday_mode),
      master_holiday_mode: !!e.master_holiday_mode,
      scheduler_active: !!e.scheduler_active,
      scheduler_next: e.scheduler_next ?? null,
      panel_available: e.panel_available === void 0 ? !0 : !!e.panel_available
    }, this._panelNameDraft = e.panel_name, this._runtimeRelayStates = e.relay_states ? [...e.relay_states] : [];
    const t = e.active_profile_id, r = t ? e.profiles[t] : void 0;
    this._saved = r ? X(r) : void 0, this._draft = r ? X(r) : void 0, this._migrateBrokenWarmLedDraftColors(), this._clearFaceplatePreview(), ((i = this._draft) == null ? void 0 : i.mode) === "radio_split" && (this._radioGroupsOpen = Pi() ?? !0), this._syncMomentaryFromRuntime(e.momentary_active);
  }
  /** Remap draft warm_white/warm_yellow → white/yellow (Z2M hang workaround). */
  _migrateBrokenWarmLedDraftColors() {
    if (!this._draft)
      return;
    let e = !1;
    U(this._draft.color_on) && (this._draft.color_on = W(this._draft.color_on), e = !0), U(this._draft.color_off) && (this._draft.color_off = W(this._draft.color_off), e = !0), e && this.requestUpdate();
  }
  /** Merge coordinator runtime push — never overwrites draft / saved profiles. */
  _applyRuntime(e) {
    this._panel && (e.entry_id && e.entry_id !== this._panel.entry_id || (this._panel = {
      ...this._panel,
      sync_status: e.sync_status ?? this._panel.sync_status,
      last_sync: e.last_sync !== void 0 ? e.last_sync : this._panel.last_sync,
      last_error: e.last_error !== void 0 ? e.last_error : this._panel.last_error,
      auto_sync: e.auto_sync ?? this._panel.auto_sync,
      holiday_mode: e.holiday_mode !== void 0 ? !!e.holiday_mode : this._panel.holiday_mode,
      panel_holiday_mode: e.panel_holiday_mode !== void 0 ? !!e.panel_holiday_mode : this._panel.panel_holiday_mode,
      master_holiday_mode: e.master_holiday_mode !== void 0 ? !!e.master_holiday_mode : this._panel.master_holiday_mode,
      relay_entities: e.relay_entities ?? this._panel.relay_entities,
      relay_states: e.relay_states ?? this._panel.relay_states,
      momentary_active: e.momentary_active ?? this._panel.momentary_active,
      cover_state: e.cover_state ?? this._panel.cover_state,
      scheduler_active: e.scheduler_active !== void 0 ? !!e.scheduler_active : this._panel.scheduler_active,
      scheduler_next: e.scheduler_next !== void 0 ? e.scheduler_next : this._panel.scheduler_next,
      panel_available: e.panel_available !== void 0 ? !!e.panel_available : this._panel.panel_available
    }, e.relay_states && (this._runtimeRelayStates = [...e.relay_states]), this._syncMomentaryFromRuntime(e.momentary_active), this._reconcilePreviewWithLiveRelays()));
  }
  _teardownRuntimeSubscription() {
    this._unsubRuntime && (this._unsubRuntime(), this._unsubRuntime = void 0), this._runtimeEntryId = void 0;
  }
  async _ensureRuntimeSubscription() {
    var t;
    const e = (t = this._config) == null ? void 0 : t.entry_id;
    if (!(!this.hass || !e || !this._panel) && !(this._unsubRuntime && this._runtimeEntryId === e)) {
      this._teardownRuntimeSubscription(), this._runtimeEntryId = e;
      try {
        this._unsubRuntime = await Br(this.hass, e, (r) => {
          this._applyRuntime(r);
        });
      } catch {
        this._runtimeEntryId = void 0, this._unsubRuntime = void 0;
      }
    }
  }
  _isMomentaryButton(e) {
    var t;
    return ((t = this._draft) == null ? void 0 : t.mode) === "mixed" && this._buttonRole(e) === "momentary";
  }
  /**
   * When a mapped relay flips, keep faceplate preview aligned:
   * - Momentary ON (physical/engine): arm a matching UI pulse timer so the ring
   *   auto-clears even when entity OFF updates are slow or hass binding lags.
   * - Momentary OFF: clear timer + optimistic ON.
   * - Other roles: drop stale optimistic bits so live relay wins.
   * Stable unchanged OFF must not wipe an in-progress card-press preview.
   */
  _previewAfterLiveReconcile() {
    var i;
    const e = (i = this._panel) == null ? void 0 : i.relay_entities;
    if (!(e != null && e.length))
      return null;
    let t = !1;
    const r = { ...this._splitPreviewOn };
    for (let a = 1; a <= e.length; a++) {
      const o = this._liveRelayOn(a), n = Object.prototype.hasOwnProperty.call(this._lastLiveRelays, a) ? this._lastLiveRelays[a] : null;
      if (this._lastLiveRelays[a] = o, !(o === null || o === n)) {
        if (this._isMomentaryButton(a)) {
          o ? this._momentaryPreviewTimers[a] == null ? (r[a] = !0, this._armMomentaryUiPulse(a, r), t = !0) : r[a] || (r[a] = !0, t = !0) : (this._clearMomentaryPreviewTimer(a), r[a] && (r[a] = !1, t = !0));
          continue;
        }
        Object.prototype.hasOwnProperty.call(r, a) && (delete r[a], t = !0);
      }
    }
    return t ? r : null;
  }
  _reconcilePreviewWithLiveRelays() {
    const e = this._previewAfterLiveReconcile();
    e && (this._splitPreviewOn = e);
  }
  /** Backend armed a pulse — mirror with a UI timer if the ring is not pulsing yet. */
  _syncMomentaryFromRuntime(e) {
    if (!e || !this._draft)
      return;
    const t = new Set(e);
    for (const r of t)
      this._isMomentaryButton(r) && this._momentaryPreviewTimers[r] == null && (this._splitPreviewOn = {
        ...this._splitPreviewOn,
        [r]: !0
      }, this._armMomentaryUiPulse(r));
    for (const r of Object.keys(this._momentaryPreviewTimers).map(Number))
      t.has(r) || this._liveRelayOn(r) === !1 && (this._clearMomentaryPreviewTimer(r), this._splitPreviewOn[r] && (this._splitPreviewOn = {
        ...this._splitPreviewOn,
        [r]: !1
      }));
  }
  /** Reset local LED preview so presses never leak into draft dirty state. */
  _clearFaceplatePreview() {
    for (const e of Object.values(this._momentaryPreviewTimers))
      window.clearTimeout(e);
    this._momentaryPreviewTimers = {}, this._splitPreviewOn = {}, this._radioPreviewSelected = null, this._pressedRing = null, this._lastLiveRelays = {};
  }
  _clearMomentaryPreviewTimer(e) {
    const t = this._momentaryPreviewTimers[e];
    t != null && (window.clearTimeout(t), delete this._momentaryPreviewTimers[e]);
  }
  /**
   * Arm UI auto-OFF after pulse_time_s. Does not toggle-cancel.
   * Optional `preview` mutates an in-progress reconcile map instead of state.
   */
  _armMomentaryUiPulse(e, t) {
    var a;
    this._clearMomentaryPreviewTimer(e);
    const r = (a = this._draft) == null ? void 0 : a.buttons.find((o) => o.index === e), i = ie(r == null ? void 0 : r.pulse_time_s, D) * 1e3;
    t ? t[e] = !0 : this._splitPreviewOn = {
      ...this._splitPreviewOn,
      [e]: !0
    }, this._momentaryPreviewTimers[e] = window.setTimeout(() => {
      delete this._momentaryPreviewTimers[e], this._liveRelayOn(e) !== !0 && (this._splitPreviewOn = {
        ...this._splitPreviewOn,
        [e]: !1
      });
    }, i);
  }
  /** Local faceplate pulse: ON now, auto-OFF after pulse_time_s; re-press cancels. */
  _pulseMomentaryPreview(e) {
    if (this._clearMomentaryPreviewTimer(e), this._splitPreviewOn[e]) {
      this._splitPreviewOn = {
        ...this._splitPreviewOn,
        [e]: !1
      };
      return;
    }
    this._armMomentaryUiPulse(e);
  }
  _setRadioGroupsOpen(e) {
    this._radioGroupsOpen = e, Di(e);
  }
  _groupSummary(e) {
    const t = [...e].sort((r, i) => r - i).map((r) => `L${r}`);
    return t.length ? t.join(", ") : "—";
  }
  /** One-line assignment recap shown while the radio groups block is collapsed. */
  _radioGroupsSummary() {
    var r;
    const e = this._ungroupedButtons(), t = (((r = this._draft) == null ? void 0 : r.radio_groups) || []).map(
      (i, a) => `${this.t("card.radio_group")} ${a + 1}: ${this._groupSummary(
        i.buttons
      )}`
    );
    return t.push(
      `${this.t("card.radio_toggle")}: ${this._groupSummary(
        [1, 2, 3, 4].filter((i) => i <= this._gangCount() && e.has(i))
      )}`
    ), t.join(" · ");
  }
  _gangCount(e) {
    var t;
    return k(((t = e || this._draft) == null ? void 0 : t.gang_count) ?? 4);
  }
  _gangIndexes(e) {
    const t = this._gangCount(e);
    return Array.from({ length: t }, (r, i) => i + 1);
  }
  _covers(e) {
    return E(e || this._draft || void 0);
  }
  _coverConfig(e, t) {
    const r = this._covers(e);
    return t ? r.find((i) => i.id === t) || r[0] || G(void 0) : r[0] || G(void 0);
  }
  _buttonRole(e) {
    var r;
    const t = (r = this._draft) == null ? void 0 : r.buttons.find((i) => i.index === e);
    return (t == null ? void 0 : t.role) || "toggle";
  }
  _isCoverButton(e) {
    return this._coverDirectionFor(e) != null;
  }
  _coverDirectionFor(e) {
    if (!this._draft)
      return null;
    if (this._draft.mode === "mixed") {
      const t = this._buttonRole(e);
      return t === "cover_open" ? "open" : t === "cover_close" ? "close" : null;
    }
    if (this._draft.mode !== "cover")
      return null;
    for (const t of this._covers()) {
      if (t.open_button === e) return "open";
      if (t.close_button === e) return "close";
    }
    return null;
  }
  _coverForButton(e) {
    var t;
    if (!this._draft)
      return null;
    if (this._draft.mode === "mixed") {
      const r = this._draft.buttons.find((o) => o.index === e), i = (r == null ? void 0 : r.role) || "toggle";
      if (i !== "cover_open" && i !== "cover_close")
        return null;
      const a = String((r == null ? void 0 : r.cover_id) || ((t = this._covers()[0]) == null ? void 0 : t.id) || "cover_1").trim() || "cover_1";
      return this._covers().find((o) => o.id === a) || this._covers().find(
        (o) => o.open_button === e || o.close_button === e
      ) || null;
    }
    return this._covers().find(
      (r) => r.open_button === e || r.close_button === e
    ) || null;
  }
  _patchCovers(e) {
    this._patchDraft((t) => {
      const r = E(t);
      e(r, t), t.covers = E({ ...t, covers: r }), delete t.cover;
    });
  }
  _setGangCount(e) {
    this._patchDraft((t) => {
      t.gang_count = k(e), t.mode = Me(t.mode, t.gang_count), t.covers = E(t), delete t.cover, t.radio_groups && (t.radio_groups = t.radio_groups.map((r) => ({
        ...r,
        buttons: r.buttons.filter((i) => i <= t.gang_count)
      }))), t.selected_button != null && (t.selected_button < 1 || t.selected_button > t.gang_count) && (t.selected_button = null);
    });
  }
  _setMode(e) {
    var t;
    !this._draft || !nt(
      ((t = this._panel) == null ? void 0 : t.capabilities.modes) || [e],
      this._gangCount()
    ).includes(e) || (this._clearFaceplatePreview(), this._patchDraft((r) => {
      var i;
      if (r.mode = e, r.mode === "cover") {
        const a = k(r.gang_count ?? 4);
        r.gang_count = a < 4 ? 4 : a, r.covers = E(r), delete r.cover;
      } else if (r.mode === "radio_split" || r.mode === "mixed")
        this._ensureRadioGroups(r), r.mode === "radio_split" && this._setRadioGroupsOpen(!0);
      else if (r.mode !== "toggle" && (r.selected_button == null || !r.buttons.some(
        (a) => a.index === r.selected_button && a.radio_member !== !1
      ))) {
        const a = ((i = r.buttons.find((o) => o.radio_member !== !1)) == null ? void 0 : i.index) ?? 1;
        r.selected_button = a;
      }
    }));
  }
  _setButtonRole(e, t) {
    this._patchDraft((r) => {
      const i = r.buttons.find((o) => o.index === e);
      if (!(!i || !Re(r.gang_count).includes(t))) {
        if (i.role = t, t === "momentary")
          i.pulse_time_s = ie(
            i.pulse_time_s,
            D
          ), i.cover_id = null;
        else if (t === "cover_open" || t === "cover_close") {
          i.cover_id = String(i.cover_id || "cover_1").trim() || "cover_1", r.covers = E(r);
          const o = r.covers.find((n) => n.id === i.cover_id);
          o && (t === "cover_open" ? o.open_button = e : o.close_button = e);
        } else
          i.cover_id = null;
        t === "radio" ? (this._ensureRadioGroups(r), this._setRadioGroupsOpen(!0)) : r.radio_groups && (r.radio_groups = r.radio_groups.map((o) => ({
          ...o,
          buttons: o.buttons.filter((n) => n !== e)
        })));
      }
    });
  }
  _setButtonCoverId(e, t) {
    this._patchDraft((r) => {
      var s;
      const i = r.buttons.find((c) => c.index === e);
      if (!i)
        return;
      const a = i.role || "toggle";
      if (a !== "cover_open" && a !== "cover_close")
        return;
      r.covers = E(r);
      const o = String(t || "").trim() || ((s = r.covers[0]) == null ? void 0 : s.id) || "cover_1";
      i.cover_id = o;
      let n = r.covers.find((c) => c.id === o);
      n || (r.covers = E({
        ...r,
        covers: [
          ...r.covers,
          {
            id: o,
            open_button: a === "cover_open" ? e : 1,
            close_button: a === "cover_close" ? e : 2,
            open_time_s: 20,
            close_time_s: 20,
            direction_settle_s: 0.5,
            opposite_press: "stop_only"
          }
        ]
      }), n = r.covers.find((c) => c.id === o)), n && (a === "cover_open" ? n.open_button = e : n.close_button = e);
    });
  }
  /**
   * Assign a panel button to a direction. Choosing the button already used by
   * the other direction swaps them, so the pair can never collapse onto one
   * button and leave the motor without a stop path. Buttons owned by another
   * cover are refused.
   */
  _setCoverButton(e, t, r) {
    this._patchCovers((i) => {
      const a = i.find((s) => s.id === e);
      if (!a || i.some(
        (s) => s.id !== e && (s.open_button === r || s.close_button === r)
      ))
        return;
      const n = t === "open" ? a.open_button : a.close_button;
      t === "open" ? (a.close_button === r && (a.close_button = n), a.open_button = r) : (a.open_button === r && (a.open_button = n), a.close_button = r);
    });
  }
  _setCoverTime(e, t, r) {
    const i = Math.max(
      I,
      Math.min(te, Number.isFinite(r) ? r : I)
    );
    this._patchCovers((a) => {
      const o = a.find((n) => n.id === e);
      o && (t === "open" ? o.open_time_s = i : o.close_time_s = i);
    });
  }
  _setCoverHaEntity(e, t) {
    const r = t.trim(), i = r && r.startsWith("cover.") ? r : null;
    this._patchCovers((a) => {
      const o = a.find((n) => n.id === e);
      o && (o.ha_entity_id = i);
    });
  }
  _getCoverEntityFilter(e) {
    return this._pickerFilter[`cover:${e}`] || "";
  }
  _setCoverEntityFilter(e, t) {
    const r = `cover:${e}`, i = t.trim().toLowerCase();
    (this._pickerFilter[r] || "") !== i && (this._pickerFilter = { ...this._pickerFilter, [r]: i });
  }
  _onCoverHaEntityPickerChanged(e, t) {
    t.stopPropagation();
    const r = t.detail;
    this._setCoverHaEntity(e, (r == null ? void 0 : r.value) ?? "");
  }
  _renderCoverHaEntityPicker(e) {
    var n;
    const t = (e.ha_entity_id || "").trim(), r = this._haEntityPickerReady && !!this.hass, i = Pe(
      gt((n = this.hass) == null ? void 0 : n.states, "cover"),
      t
    ), a = this._getCoverEntityFilter(e.id), o = this._filterOptions(i, a);
    return d`
      <label class="field mixed-cover-ha-entity" data-cover-ha-entity=${e.id}>
        <span>${this.t("card.cover_ha_entity")}</span>
        ${r ? d`
              <ha-entity-picker
                data-cover-ha-entity-picker
                data-cover-id=${e.id}
                .hass=${this.hass}
                .value=${t || void 0}
                .includeDomains=${["cover"]}
                allow-custom-entity
                ?disabled=${this._busy}
                @value-changed=${(s) => this._onCoverHaEntityPickerChanged(e.id, s)}
              ></ha-entity-picker>
            ` : d`
              <input
                type="search"
                class="picker-filter"
                data-cover-ha-entity-filter
                data-cover-id=${e.id}
                placeholder=${this.t("card.picker_search")}
                .value=${a}
                ?disabled=${this._busy}
                @input=${(s) => this._setCoverEntityFilter(
      e.id,
      s.target.value
    )}
              />
              <div class="select-wrap select-wrap-wide">
                <select
                  data-cover-ha-entity-picker
                  data-cover-id=${e.id}
                  .value=${t}
                  ?disabled=${this._busy}
                  @change=${(s) => this._setCoverHaEntity(
      e.id,
      s.target.value
    )}
                >
                  <option value="">${this.t("card.cover_ha_entity_none")}</option>
                  ${o.map(
      (s) => d`<option value=${s}>${s}</option>`
    )}
                </select>
              </div>
            `}
      </label>
    `;
  }
  _addCover() {
    this._patchCovers((e, t) => {
      const r = ze(t.gang_count);
      if (e.length >= r)
        return;
      const i = new Set(
        e.flatMap((s) => [s.open_button, s.close_button])
      ), a = this._gangIndexes(t).filter((s) => !i.has(s)), o = a[0] ?? 1, n = a[1] ?? Math.min(o + 1, t.gang_count);
      e.push(
        G(
          { open_button: o, close_button: n },
          {
            gangCount: t.gang_count,
            defaultId: `cover_${e.length + 1}`,
            slot: e.length
          }
        )
      );
    });
  }
  _removeCover(e) {
    this._patchCovers((t) => {
      if (t.length <= 1)
        return;
      const r = t.filter((i) => i.id !== e);
      t.splice(0, t.length, ...r);
    });
  }
  async _coverCommand(e, t) {
    if (!(!this.hass || !this._config)) {
      this._busy = !0, this._error = void 0;
      try {
        const r = await Dr(
          this.hass,
          this._config.entry_id,
          e,
          t
        );
        this._panel && (this._panel = { ...this._panel, cover_state: r });
      } catch (r) {
        this._error = r instanceof Error ? r.message : String(r);
      } finally {
        this._busy = !1;
      }
    }
  }
  _coverStateLabel(e) {
    var r, i;
    const t = (r = this._panel) == null ? void 0 : r.cover_state;
    if (e && ((i = t == null ? void 0 : t.covers) != null && i.length)) {
      const a = t.covers.find((o) => o.id === e);
      return this.t(`card.cover_state_${(a == null ? void 0 : a.state) || "idle"}`);
    }
    return this.t(`card.cover_state_${(t == null ? void 0 : t.state) || "idle"}`);
  }
  _renderGangPicker() {
    if (!this._draft)
      return u;
    const e = this._gangCount();
    return d`
      <label class="field">
        <span>${this.t("card.gang_count")}</span>
        <div class="gang-picker" role="radiogroup" dir="ltr" data-gang-picker>
          ${[1, 2, 3, 4].map(
      (t) => d`
              <button
                type="button"
                class="radio-member ${e === t ? "on" : ""}"
                role="radio"
                aria-checked=${e === t ? "true" : "false"}
                ?disabled=${this._busy}
                @click=${() => this._setGangCount(t)}
              >
                <span class="radio-member-label">${t}</span>
              </button>
            `
    )}
        </div>
        <p class="radio-groups-hint">${this.t("card.gang_count_hint")}</p>
      </label>
    `;
  }
  _renderCoverButtonPicker(e, t) {
    const r = t === "open" ? e.open_button : e.close_button, i = new Set(
      this._covers().filter((a) => a.id !== e.id).flatMap((a) => [a.open_button, a.close_button])
    );
    return d`
      <div
        class="cover-buttons"
        role="radiogroup"
        dir="ltr"
        style="--conx-gang-count:${this._gangCount()}"
      >
        ${this._gangIndexes().map(
      (a) => d`
            <button
              type="button"
              class="radio-member ${r === a ? "on" : ""}"
              role="radio"
              aria-checked=${r === a ? "true" : "false"}
              ?disabled=${this._busy || i.has(a)}
              @click=${() => this._setCoverButton(e.id, t, a)}
            >
              <span class="radio-member-label">L${a}</span>
            </button>
          `
    )}
      </div>
    `;
  }
  /** First cover-role button index that owns timing for a given motor slot. */
  _firstCoverRoleIndex(e) {
    if (!this._draft)
      return null;
    const t = String(e || "cover_1").trim() || "cover_1", r = this._draft.buttons.find(
      (i) => i.index <= this._gangCount() && (i.role === "cover_open" || i.role === "cover_close") && (String(i.cover_id || "cover_1").trim() || "cover_1") === t
    );
    return (r == null ? void 0 : r.index) ?? null;
  }
  _renderInlineCoverTimeFields(e) {
    var o;
    const t = (o = this._panel) == null ? void 0 : o.capabilities.cover, r = (t == null ? void 0 : t.min_time_s) ?? I, i = (t == null ? void 0 : t.max_time_s) ?? te, a = this.t("card.cover_seconds");
    return d`
      <label class="field">
        <span>${this.t("card.cover_open_time")} (${a})</span>
        <input
          type="number"
          data-cover-open-time
          min=${r}
          max=${i}
          step="0.5"
          .value=${String(e.open_time_s)}
          ?disabled=${this._busy}
          @change=${(n) => this._setCoverTime(
      e.id,
      "open",
      Number(n.target.value)
    )}
        />
      </label>
      <label class="field">
        <span>${this.t("card.cover_close_time")} (${a})</span>
        <input
          type="number"
          data-cover-close-time
          min=${r}
          max=${i}
          step="0.5"
          .value=${String(e.close_time_s)}
          ?disabled=${this._busy}
          @change=${(n) => this._setCoverTime(
      e.id,
      "close",
      Number(n.target.value)
    )}
        />
      </label>
      <label class="field">
        <span>${this.t("card.cover_settle")} (${a})</span>
        <input
          type="number"
          data-cover-settle
          min=${(t == null ? void 0 : t.min_settle_s) ?? V}
          max=${(t == null ? void 0 : t.max_settle_s) ?? Z}
          step="0.1"
          .value=${String(e.direction_settle_s)}
          ?disabled=${this._busy}
          @change=${(n) => {
      const s = Number(n.target.value);
      this._patchCovers((c) => {
        const l = c.find((p) => p.id === e.id);
        l && (l.direction_settle_s = Math.max(
          V,
          Math.min(
            Z,
            Number.isFinite(s) ? s : 0
          )
        ));
      });
    }}
        />
      </label>
      <label class="field field-compact-select">
        <span>${this.t("card.cover_opposite")}</span>
        <div class="select-wrap">
          <select
            data-cover-opposite
            .value=${e.opposite_press}
            ?disabled=${this._busy}
            @change=${(n) => {
      const s = n.target.value;
      this._patchCovers((c) => {
        const l = c.find((p) => p.id === e.id);
        l && (l.opposite_press = s === "stop_then_reverse" ? "stop_then_reverse" : "stop_only");
      });
    }}
          >
            <option value="stop_only">${this.t("cover.stop_only")}</option>
            <option value="stop_then_reverse">
              ${this.t("cover.stop_then_reverse")}
            </option>
          </select>
        </div>
      </label>
    `;
  }
  _renderMixedCoverExtras(e) {
    const {
      buttonIndex: t,
      cover: r,
      coverId: i,
      covers: a,
      multiCover: o,
      showTimes: n,
      showTimesPointer: s,
      timesOwner: c
    } = e;
    return d`
      <div class="mixed-cover-extras" data-mixed-cover-extras>
        <div
          class="mixed-cover-grid"
          data-mixed-cover-grid
          data-inline-cover-times=${n ? r.id : u}
        >
          ${o ? d`
                <label class="field mixed-cover-id">
                  <span>${this.t("card.cover_id")}</span>
                  <div class="select-wrap">
                    <select
                      data-cover-id
                      .value=${i}
                      ?disabled=${this._busy || a.length === 0}
                      @change=${(l) => this._setButtonCoverId(
      t,
      l.target.value
    )}
                    >
                      ${a.map(
      (l) => d`
                          <option value=${l.id}>${l.id}</option>
                        `
    )}
                    </select>
                  </div>
                </label>
              ` : d`
                <div class="field mixed-cover-slot-field">
                  <span>${this.t("card.cover_id")}</span>
                  <span
                    class="mixed-cover-slot"
                    data-cover-id
                    data-cover-slot=${i}
                    >${i}</span
                  >
                </div>
              `}
          ${this._renderCoverHaEntityPicker(r)}
          ${n ? this._renderInlineCoverTimeFields(r) : u}
        </div>
        ${s && c != null ? d`<p
              class="radio-groups-hint mixed-cover-times-on"
              data-mixed-cover-times-on
            >
              ${this.t("card.mixed_cover_times_on").replace(
      "{n}",
      String(c)
    )}
            </p>` : u}
      </div>
    `;
  }
  _renderOneCoverEditor(e, t) {
    var s;
    const r = (s = this._panel) == null ? void 0 : s.capabilities.cover, i = (r == null ? void 0 : r.min_time_s) ?? I, a = (r == null ? void 0 : r.max_time_s) ?? te, o = this.t("card.cover_seconds"), n = this._covers().length > 1;
    return d`
      <div class="cover-block" data-cover-id=${e.id}>
        <div class="cover-head">
          <span class="menu-label"
            >${this.t("card.cover")} ${t + 1}</span
          >
          ${n ? d`<button
                type="button"
                class="btn danger"
                ?disabled=${this._busy}
                @click=${() => this._removeCover(e.id)}
              >
                ${this.t("card.cover_remove")}
              </button>` : u}
        </div>
        <div class="cover-grid">
          <div class="cover-field">
            <span class="cover-label">${this.t("card.cover_open_button")}</span>
            ${this._renderCoverButtonPicker(e, "open")}
          </div>
          <div class="cover-field">
            <span class="cover-label">${this.t("card.cover_close_button")}</span>
            ${this._renderCoverButtonPicker(e, "close")}
          </div>
        </div>
        ${this._renderCoverHaEntityPicker(e)}
        <div class="cover-times cover-times-compact">
          <label class="field">
            <span>${this.t("card.cover_open_time")} (${o})</span>
            <input
              type="number"
              data-cover-open-time
              min=${i}
              max=${a}
              step="0.5"
              .value=${String(e.open_time_s)}
              ?disabled=${this._busy}
              @change=${(c) => this._setCoverTime(
      e.id,
      "open",
      Number(c.target.value)
    )}
            />
          </label>
          <label class="field">
            <span>${this.t("card.cover_close_time")} (${o})</span>
            <input
              type="number"
              data-cover-close-time
              min=${i}
              max=${a}
              step="0.5"
              .value=${String(e.close_time_s)}
              ?disabled=${this._busy}
              @change=${(c) => this._setCoverTime(
      e.id,
      "close",
      Number(c.target.value)
    )}
            />
          </label>
          <label class="field">
            <span>${this.t("card.cover_settle")} (${o})</span>
            <input
              type="number"
              data-cover-settle
              min=${(r == null ? void 0 : r.min_settle_s) ?? V}
              max=${(r == null ? void 0 : r.max_settle_s) ?? Z}
              step="0.1"
              .value=${String(e.direction_settle_s)}
              ?disabled=${this._busy}
              @change=${(c) => {
      const l = Number(c.target.value);
      this._patchCovers((p) => {
        const h = p.find((_) => _.id === e.id);
        h && (h.direction_settle_s = Math.max(
          V,
          Math.min(
            Z,
            Number.isFinite(l) ? l : 0
          )
        ));
      });
    }}
            />
          </label>
        </div>
        <p class="radio-groups-hint">${this.t("card.cover_settle_hint")}</p>
        <label class="field field-compact-select">
          <span>${this.t("card.cover_opposite")}</span>
          <div class="select-wrap">
            <select
              data-cover-opposite
              .value=${e.opposite_press}
              ?disabled=${this._busy}
              @change=${(c) => {
      const l = c.target.value;
      this._patchCovers((p) => {
        const h = p.find((_) => _.id === e.id);
        h && (h.opposite_press = l === "stop_then_reverse" ? "stop_then_reverse" : "stop_only");
      });
    }}
            >
              <option value="stop_only">${this.t("cover.stop_only")}</option>
              <option value="stop_then_reverse">
                ${this.t("cover.stop_then_reverse")}
              </option>
            </select>
          </div>
        </label>
        ${e.open_button === e.close_button ? d`<div class="radio-groups-error">
              ${this.t("card.cover_same_button")}
            </div>` : u}
      </div>
    `;
  }
  _renderEmptyCoverSlot(e) {
    return d`
      <div class="cover-block cover-block-empty" data-cover-slot=${e}>
        <div class="cover-head">
          <span class="menu-label"
            >${this.t("card.cover")} ${e + 1}</span
          >
          <span class="cover-slot-status">${this.t("card.cover_slot_empty")}</span>
        </div>
        <p class="radio-groups-hint">${this.t("card.cover_slot_hint")}</p>
        <button
          type="button"
          class="btn primary cover-add-slot"
          data-cover-add
          ?disabled=${this._busy}
          @click=${() => this._addCover()}
        >
          ${this.t("card.cover_add")}
        </button>
      </div>
    `;
  }
  _renderCoverEditor() {
    if (!this._draft || this._draft.mode !== "cover")
      return u;
    const e = this._covers(), t = ze(this._gangCount()), r = Array.from(
      { length: Math.max(t, e.length) },
      (i, a) => e[a] ?? null
    );
    return d`
      <div class="cover-section" data-cover-editor>
        <div class="cover-head">
          <span class="menu-label">${this.t("card.cover")}</span>
        </div>
        <p class="radio-groups-hint">${this.t("card.cover_hint")}</p>
        ${this._renderGangPicker()}
        ${r.map(
      (i, a) => i ? this._renderOneCoverEditor(i, a) : this._renderEmptyCoverSlot(a)
    )}
        <p class="cover-safety">${this.t("card.cover_safety")}</p>
      </div>
    `;
  }
  /** Live open/close/stop, routed through the backend engine (never direct relays). */
  _renderCoverControl() {
    var r, i, a;
    if (this._operateMode)
      return u;
    const e = (r = this._saved) == null ? void 0 : r.mode;
    if (e !== "cover" && e !== "mixed" || e === "mixed" && !((a = (i = this._saved) == null ? void 0 : i.buttons) != null && a.some(
      (o) => o.role === "cover_open" || o.role === "cover_close"
    )))
      return u;
    const t = this._covers(this._saved);
    return d`
      <div class="cover-control" data-cover-control>
        ${t.map((o) => {
      var c, l, p, h, _;
      const n = (p = (l = (c = this._panel) == null ? void 0 : c.cover_state) == null ? void 0 : l.covers) == null ? void 0 : p.find(
        (b) => b.id === o.id
      ), s = (n == null ? void 0 : n.state) || t.length === 1 && ((_ = (h = this._panel) == null ? void 0 : h.cover_state) == null ? void 0 : _.state) || "idle";
      return d`
            <div class="cover-control-block" data-cover-id=${o.id}>
              <div class="cover-control-head">
                <span class="menu-label"
                  >${this.t("card.cover_live")}${t.length > 1 ? ` · ${o.id}` : ""}</span
                >
                <span class="cover-state cover-state-${s}"
                  >${this._coverStateLabel(o.id)}</span
                >
              </div>
              <div class="cover-control-row">
                <button
                  type="button"
                  class="btn"
                  data-cover-open
                  ?disabled=${this._busy}
                  @click=${() => this._coverCommand("open", o.id)}
                >
                  ${this.t("card.cover_open")}
                </button>
                <button
                  type="button"
                  class="btn danger"
                  data-cover-stop
                  ?disabled=${this._busy}
                  @click=${() => this._coverCommand("stop", o.id)}
                >
                  ${this.t("card.cover_stop")}
                </button>
                <button
                  type="button"
                  class="btn"
                  data-cover-close
                  ?disabled=${this._busy}
                  @click=${() => this._coverCommand("close", o.id)}
                >
                  ${this.t("card.cover_close")}
                </button>
              </div>
            </div>
          `;
    })}
      </div>
    `;
  }
  async _guardDirty() {
    return this._dirty ? window.confirm(this.t("card.unsaved")) : !0;
  }
  async _selectProfile(e) {
    if (!(!await this._guardDirty() || !this.hass || !this._config)) {
      this._busy = !0;
      try {
        const t = await Oe(
          this.hass,
          this._config.entry_id,
          e,
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
        const e = await vr(
          this.hass,
          this._config.entry_id,
          this._draft.id,
          this._draft
        ), t = await at(this.hass, this._config.entry_id);
        this._applyPanel(t), this._saved = X(e), this._draft = X(e), this._migrateBrokenWarmLedDraftColors();
      } catch (e) {
        this._error = e instanceof Error ? e.message : String(e);
      } finally {
        this._busy = !1;
      }
    }
  }
  _discard() {
    this._saved && (this._draft = X(this._saved), this._migrateBrokenWarmLedDraftColors(), this._clearFaceplatePreview());
  }
  async _sync() {
    if (!(!this.hass || !this._config)) {
      this._dirty && await this._saveDraft(), this._busy = !0, this._error = void 0, this._syncPulse = !0;
      try {
        const e = await kr(this.hass, this._config.entry_id);
        this._applyPanel(e);
      } catch (e) {
        this._error = e instanceof Error ? e.message : String(e), this._config && await this._load();
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
        const e = await Sr(this.hass, this._config.entry_id);
        this._applyPanel(e);
      } catch (e) {
        this._error = e instanceof Error ? e.message : String(e);
      } finally {
        this._busy = !1;
      }
    }
  }
  async _createProfile() {
    if (!this.hass || !this._config || !this._panel || !await this._guardDirty())
      return;
    const e = `profile_${Date.now()}`, t = {
      id: e,
      name: `Profile ${Object.keys(this._panel.profiles).length + 1}`,
      mode: "toggle",
      color_on: "cyan",
      color_off: "blue",
      radar: "30s",
      backlight: !0,
      backlight_brightness: 100,
      child_lock: !1,
      selected_button: null,
      gang_count: this._gangCount(this._draft || void 0),
      buttons: [1, 2, 3, 4].map((r) => ({
        index: r,
        name: `Button ${r}`,
        action: null,
        radio_member: !0
      }))
    };
    this._busy = !0;
    try {
      await yr(this.hass, this._config.entry_id, t);
      const r = await Oe(
        this.hass,
        this._config.entry_id,
        e,
        !1
      );
      this._applyPanel(r);
    } catch (r) {
      this._error = r instanceof Error ? r.message : String(r);
    } finally {
      this._busy = !1;
    }
  }
  async _duplicateProfile() {
    if (!this.hass || !this._config || !this._draft || !await this._guardDirty())
      return;
    const e = this._draft.name || "", t = ot("", e), r = window.prompt(this.t("card.duplicate_name"), t), i = ot(r, e);
    if (i === null)
      return;
    const a = wr(this._draft.id);
    this._busy = !0, this._error = void 0, this._notice = void 0;
    try {
      await $r(
        this.hass,
        this._config.entry_id,
        this._draft.id,
        a,
        i
      );
      const o = await Oe(
        this.hass,
        this._config.entry_id,
        a,
        !1
      );
      this._applyPanel(o), this._notice = this.t("card.duplicate_ok");
    } catch (o) {
      this._error = o instanceof Error ? o.message : String(o);
    } finally {
      this._busy = !1;
    }
  }
  _renameProfile() {
    if (!this._draft)
      return;
    const e = window.prompt(this.t("card.rename"), this._draft.name);
    e && (this._draft.name = e, this.requestUpdate());
  }
  _schedulerTasksReferencingProfile(e) {
    var a, o, n;
    const t = [], r = /* @__PURE__ */ new Set(), i = [
      (a = this._panel) == null ? void 0 : a.scheduler_tasks,
      (o = this._panel) == null ? void 0 : o.master_scheduler_tasks
    ];
    for (const s of i)
      if (s)
        for (const c of Object.values(s)) {
          if (!((n = c.ranges) != null && n.some((p) => p.profile_id === e)))
            continue;
          const l = (c.name || "").trim() || c.id;
          r.has(l) || (r.add(l), t.push(l));
        }
    return t;
  }
  async _deleteProfile() {
    if (!this.hass || !this._config || !this._draft || !this._panel)
      return;
    if (this._error = void 0, this._notice = void 0, Object.keys(this._panel.profiles).length <= 1) {
      this._error = this.t("card.keep_one_profile");
      return;
    }
    const e = this._schedulerTasksReferencingProfile(this._draft.id);
    if (e.length) {
      this._error = this.t("card.delete_blocked_scheduler").replace(
        "{tasks}",
        e.join(", ")
      );
      return;
    }
    if (window.confirm(`${this.t("card.delete")} ${this._draft.name}?`)) {
      this._busy = !0;
      try {
        const t = await xr(
          this.hass,
          this._config.entry_id,
          this._draft.id
        );
        this._applyPanel(t), this._notice = this.t("card.delete_ok");
      } catch (t) {
        this._error = t instanceof Error ? t.message : String(t);
      } finally {
        this._busy = !1;
      }
    }
  }
  async _export() {
    if (!(!this.hass || !this._config || !this._panel)) {
      this._busy = !0, this._error = void 0;
      try {
        const e = await Ar(this.hass, this._config.entry_id), t = this._panel.panel_name.replace(/[^\w.-]+/g, "_");
        ct(`conx-profiles-${t}.json`, e), this._refreshServiceYaml(e), this._notice = this.t("card.export_ok");
      } catch (e) {
        this._error = e instanceof Error ? e.message : String(e);
      } finally {
        this._busy = !1;
      }
    }
  }
  _openImport() {
    this._importInput || (this._importInput = document.createElement("input"), this._importInput.type = "file", this._importInput.accept = "application/json,.json", this._importInput.hidden = !0, this.renderRoot.appendChild(this._importInput)), this._importInput.onchange = () => {
      var t, r;
      const e = (r = (t = this._importInput) == null ? void 0 : t.files) == null ? void 0 : r[0];
      this._importInput.value = "", e && this._importFile(e, this._importMode);
    }, this._importInput.click();
  }
  async _importFile(e, t) {
    if (!(!this.hass || !this._config) && await this._guardDirty()) {
      this._busy = !0, this._error = void 0;
      try {
        const r = await e.text(), i = ti(JSON.parse(r));
        if (!i.ok)
          throw new Error(i.error || this.t("card.import_invalid"));
        const a = await Or(
          this.hass,
          this._config.entry_id,
          i.payload,
          t
        );
        this._applyPanel(a), this._refreshServiceYaml(i.payload), this._notice = this.t("card.import_ok");
      } catch (r) {
        this._error = r instanceof Error ? r.message : String(r);
      } finally {
        this._busy = !1;
      }
    }
  }
  async _exportScheduler() {
    if (!(!this.hass || !this._config || !this._panel)) {
      this._busy = !0, this._error = void 0;
      try {
        const e = await Er(this.hass, this._config.entry_id), t = this._panel.panel_name.replace(/[^\w.-]+/g, "_");
        ct(`conx-scheduler-${t}.json`, e), this._schedulerImportWarnings = [], this._notice = this.t("scheduler.export_ok");
      } catch (e) {
        this._error = e instanceof Error ? e.message : String(e);
      } finally {
        this._busy = !1;
      }
    }
  }
  _openSchedulerImport(e) {
    this._schedulerImportMode = e, this._schedulerImportInput || (this._schedulerImportInput = document.createElement("input"), this._schedulerImportInput.type = "file", this._schedulerImportInput.accept = "application/json,.json", this._schedulerImportInput.hidden = !0, this.renderRoot.appendChild(this._schedulerImportInput)), this._schedulerImportInput.onchange = () => {
      var r, i;
      const t = (i = (r = this._schedulerImportInput) == null ? void 0 : r.files) == null ? void 0 : i[0];
      this._schedulerImportInput.value = "", t && this._importSchedulerFile(t, this._schedulerImportMode);
    }, this._schedulerImportInput.click();
  }
  async _importSchedulerFile(e, t) {
    if (!(!this.hass || !this._config)) {
      this._busy = !0, this._error = void 0, this._schedulerImportWarnings = [];
      try {
        const r = await e.text(), i = ai(JSON.parse(r));
        if (!i.ok)
          throw new Error(i.error || this.t("scheduler.import_invalid"));
        const a = await Cr(
          this.hass,
          this._config.entry_id,
          i.payload,
          t
        ), o = Array.isArray(a.scheduler_import_warnings) ? a.scheduler_import_warnings : [];
        this._schedulerImportWarnings = o, this._applyPanel(a), this._schedulerDraft = null, this._notice = o.length > 0 ? `${this.t("scheduler.import_ok")} (${o.length})` : this.t("scheduler.import_ok");
      } catch (r) {
        const i = r instanceof Error ? r.message : String(r);
        (i.toLowerCase().includes("conflict") || i.includes("overlaps")) && (this._schedulerConflict = i), this._error = i;
      } finally {
        this._busy = !1;
      }
    }
  }
  /** In-place draft mutation keeps text inputs focused while typing. */
  _patchDraft(e) {
    this._draft && (e(this._draft), this.requestUpdate());
  }
  _onProfileNameInput(e) {
    const t = e.target.value;
    this._patchDraft((r) => {
      r.name = t;
    });
  }
  _onButtonNameInput(e, t) {
    const r = t.target.value;
    this._patchDraft((i) => {
      const a = i.buttons.find((o) => o.index === e);
      a && (a.name = r);
    });
  }
  async _ensureHaEntityPicker() {
    if (this._haPickerLoadStarted || (this._haPickerLoadStarted = !0, Ht() && (this._haEntityPickerReady = !0), jt() && (this._haServicePickerReady = !0), this._haEntityPickerReady && this._haServicePickerReady))
      return;
    const e = await pi();
    this._haEntityPickerReady = e.entity, this._haServicePickerReady = e.service;
  }
  _actionEditorKey(e, t = "single") {
    return t === "single" ? String(e) : `${e}:${t}`;
  }
  _actionFieldName(e) {
    return e === "double" ? "action_double" : "action";
  }
  _buttonSlotAction(e, t) {
    return e ? t === "double" ? e.action_double ?? null : e.action : null;
  }
  _pickerFilterKey(e, t, r = "single") {
    return `${e}:${this._actionEditorKey(t, r)}`;
  }
  _getPickerFilter(e, t, r = "single") {
    return this._pickerFilter[this._pickerFilterKey(e, t, r)] || "";
  }
  _setPickerFilter(e, t, r, i = "single") {
    const a = this._pickerFilterKey(e, t, i), o = r.trim().toLowerCase();
    (this._pickerFilter[a] || "") !== o && (this._pickerFilter = { ...this._pickerFilter, [a]: o });
  }
  _filterOptions(e, t) {
    return t ? e.filter((r) => r.toLowerCase().includes(t)) : e;
  }
  _onHaServicePickerChanged(e, t, r = "single") {
    t.stopPropagation();
    const i = t.detail, a = ((i == null ? void 0 : i.value) ?? "").trim();
    this._setButtonAction(e, a, void 0, r);
  }
  _setButtonAction(e, t, r, i = "single") {
    const a = t.trim(), o = this._actionEditorKey(e, i), n = this._actionFieldName(i), s = this._actionDataDisplay(e, i), c = Object.prototype.hasOwnProperty.call(
      this._actionDataAutoDefault,
      o
    ) ? this._actionDataAutoDefault[o] : void 0, l = mi(
      a,
      s,
      c
    );
    if (this._patchDraft((p) => {
      var A;
      const h = p.buttons.find((O) => O.index === e);
      if (!h)
        return;
      if (!a) {
        h[n] = null;
        return;
      }
      const _ = this._buttonSlotAction(h, i), b = (A = _ == null ? void 0 : _.target) == null ? void 0 : A.entity_id, y = Le(a);
      let w = r === void 0 ? (b == null ? void 0 : b.trim()) || "" : (r ?? "").trim();
      y && w && !w.startsWith(`${y}.`) && (w = "");
      const S = l !== null ? l.data : (_ == null ? void 0 : _.data) || {};
      h[n] = {
        action: a,
        target: w ? { entity_id: w } : {},
        data: S
      };
    }), !a) {
      this._clearActionDataEditor(e, i);
      return;
    }
    l !== null && this._applyActionDataPrefill(e, l.yaml, i);
  }
  _applyActionDataPrefill(e, t, r = "single") {
    const i = this._actionEditorKey(e, r);
    this._actionDataAutoDefault = {
      ...this._actionDataAutoDefault,
      [i]: t
    }, this._actionDataText = { ...this._actionDataText, [i]: t };
    const a = { ...this._actionDataError };
    delete a[i], this._actionDataError = a, t.trim() && (this._actionDataOpen = { ...this._actionDataOpen, [i]: !0 });
  }
  _onButtonActionSelect(e, t, r = "single") {
    const i = t.target.value.trim();
    this._setButtonAction(e, i, void 0, r);
  }
  _onButtonEntitySelect(e, t, r = "single") {
    const i = t.target.value.trim(), a = this._actionFieldName(r);
    this._patchDraft((o) => {
      const n = o.buttons.find((l) => l.index === e);
      if (!n)
        return;
      const s = this._buttonSlotAction(n, r), c = (s == null ? void 0 : s.action) || "";
      if (!c) {
        n[a] = null;
        return;
      }
      n[a] = {
        action: c,
        target: i ? { entity_id: i } : {},
        data: (s == null ? void 0 : s.data) || {}
      };
    });
  }
  _onHaEntityPickerChanged(e, t, r = "single") {
    t.stopPropagation();
    const i = t.detail, a = ((i == null ? void 0 : i.value) ?? "").trim();
    this._onButtonEntitySelect(
      e,
      {
        target: { value: a }
      },
      r
    );
  }
  _actionDataDisplay(e, t = "single") {
    var a, o;
    const r = this._actionEditorKey(e, t);
    if (Object.prototype.hasOwnProperty.call(this._actionDataText, r))
      return this._actionDataText[r];
    const i = (a = this._draft) == null ? void 0 : a.buttons.find((n) => n.index === e);
    return Ft(((o = this._buttonSlotAction(i, t)) == null ? void 0 : o.data) || {});
  }
  _toggleActionDataOpen(e, t = "single") {
    const r = this._actionEditorKey(e, t);
    this._actionDataOpen = {
      ...this._actionDataOpen,
      [r]: !this._actionDataOpen[r]
    };
  }
  _toggleActionSlotOpen(e, t = "single") {
    const r = this._actionEditorKey(e, t);
    this._actionSlotOpen = {
      ...this._actionSlotOpen,
      [r]: !this._actionSlotOpen[r]
    };
  }
  _isActionSlotOpen(e, t = "single") {
    return !!this._actionSlotOpen[this._actionEditorKey(e, t)];
  }
  _clearActionDataEditor(e, t = "single") {
    const r = this._actionEditorKey(e, t), i = Object.prototype.hasOwnProperty.call(
      this._actionDataText,
      r
    ), a = !!this._actionDataError[r], o = Object.prototype.hasOwnProperty.call(
      this._actionDataAutoDefault,
      r
    );
    if (!i && !a && !o)
      return;
    const n = { ...this._actionDataText }, s = { ...this._actionDataError }, c = { ...this._actionDataAutoDefault };
    delete n[r], delete s[r], delete c[r], this._actionDataText = n, this._actionDataError = s, this._actionDataAutoDefault = c;
  }
  _onActionDataInput(e, t, r = "single") {
    const i = this._actionEditorKey(e, r), a = this._actionFieldName(r), o = t.target.value;
    this._actionDataText = { ...this._actionDataText, [i]: o };
    const n = be(o);
    if (!n.ok) {
      this._actionDataError = {
        ...this._actionDataError,
        [i]: n.error
      };
      return;
    }
    const s = { ...this._actionDataError };
    delete s[i], this._actionDataError = s, this._patchDraft((c) => {
      const l = c.buttons.find((h) => h.index === e), p = this._buttonSlotAction(l, r);
      p != null && p.action && (l[a] = {
        ...p,
        data: n.data
      });
    });
  }
  _renderButtonActionSlots(e) {
    return d`
      <div class="action-slots-accordion" data-action-slots=${e}>
        ${this._renderActionSlotAccordion(e, "single")}
        <p class="field-hint multi-click-hint">${this.t("card.multi_click_hint")}</p>
        ${this._renderActionSlotAccordion(e, "double")}
      </div>
    `;
  }
  _renderActionSlotAccordion(e, t) {
    var l, p;
    const r = (l = this._draft) == null ? void 0 : l.buttons.find((h) => h.index === e), i = this._buttonSlotAction(r, t), a = this._isActionSlotOpen(e, t), o = (i == null ? void 0 : i.action) || "", n = String(
      ((p = i == null ? void 0 : i.target) == null ? void 0 : p.entity_id) || ""
    ), s = t === "double" ? "card.action_double" : "card.action", c = fi(
      o,
      n,
      this.t("card.action_not_set")
    );
    return d`
      <div
        class="action-edit ${a ? "open" : ""}"
        data-action-edit-slot=${t}
        data-button=${e}
      >
        <button
          type="button"
          class="action-edit-toggle"
          data-action-slot-toggle
          aria-expanded=${a ? "true" : "false"}
          title=${a ? this.t("card.action_collapse") : this.t("card.action_expand")}
          ?disabled=${this._busy}
          @click=${() => this._toggleActionSlotOpen(e, t)}
        >
          <span class="button-edit-chevron" aria-hidden="true"></span>
          <span class="button-edit-summary">
            <span class="button-edit-title">${this.t(s)}</span>
            <span class="button-edit-meta" dir="ltr">${c}</span>
          </span>
        </button>
        <div class="action-edit-body">
          <div class="action-edit-fields">
            ${a ? this._renderActionEntityPickers(
      e,
      o,
      n,
      t
    ) : u}
          </div>
        </div>
      </div>
    `;
  }
  _renderActionEntityPickers(e, t, r, i = "single") {
    var x, M;
    const a = Pe(
      di((x = this.hass) == null ? void 0 : x.services),
      t
    ), o = Le(t), n = Pe(
      gt((M = this.hass) == null ? void 0 : M.states, o),
      r
    ), s = this._haEntityPickerReady && !!this.hass, c = this._haServicePickerReady && !!this.hass, l = this._getPickerFilter("action", e, i), p = this._getPickerFilter("entity", e, i), h = this._filterOptions(a, l), _ = this._filterOptions(n, p), b = this._actionEditorKey(e, i), y = !!this._actionDataOpen[b], w = this._actionDataDisplay(e, i), S = this._actionDataError[b] || "", A = Ue(t) || this.t("card.action_data_placeholder"), O = !!t;
    return d`
      <div class="action-slot" data-action-slot=${i} data-button=${e}>
      <label class="field">
        <span>${this.t("card.action")}</span>
        ${c ? d`
              <ha-service-picker
                data-action-picker
                data-button=${e}
                data-action-slot=${i}
                .hass=${this.hass}
                .value=${t || ""}
                ?disabled=${this._busy}
                @value-changed=${(v) => this._onHaServicePickerChanged(e, v, i)}
              ></ha-service-picker>
            ` : d`
              <input
                type="search"
                class="picker-filter"
                data-action-filter
                data-button=${e}
                data-action-slot=${i}
                placeholder=${this.t("card.picker_search")}
                .value=${l}
                ?disabled=${this._busy}
                @input=${(v) => this._setPickerFilter(
      "action",
      e,
      v.target.value,
      i
    )}
              />
              <div class="select-wrap select-wrap-wide">
                <select
                  data-action-picker
                  data-button=${e}
                  data-action-slot=${i}
                  .value=${t}
                  ?disabled=${this._busy}
                  @change=${(v) => this._onButtonActionSelect(e, v, i)}
                >
                  <option value="">${this.t("card.action_none")}</option>
                  ${h.map(
      (v) => d`<option value=${v}>${v}</option>`
    )}
                </select>
              </div>
            `}
        <span class="field-hint">${this.t("card.action_picker_hint")}</span>
      </label>
      <label class="field">
        <span>${this.t("card.entity_id")}</span>
        ${s ? d`
              <ha-entity-picker
                data-entity-picker
                data-button=${e}
                data-action-slot=${i}
                .hass=${this.hass}
                .value=${r || void 0}
                .includeDomains=${o ? [o] : void 0}
                allow-custom-entity
                ?disabled=${this._busy || !t}
                @value-changed=${(v) => this._onHaEntityPickerChanged(e, v, i)}
              ></ha-entity-picker>
            ` : d`
              <input
                type="search"
                class="picker-filter"
                data-entity-filter
                data-button=${e}
                data-action-slot=${i}
                placeholder=${this.t("card.picker_search")}
                .value=${p}
                ?disabled=${this._busy || !t}
                @input=${(v) => this._setPickerFilter(
      "entity",
      e,
      v.target.value,
      i
    )}
              />
              <div class="select-wrap select-wrap-wide">
                <select
                  data-entity-picker
                  data-button=${e}
                  data-action-slot=${i}
                  .value=${r}
                  ?disabled=${this._busy || !t}
                  @change=${(v) => this._onButtonEntitySelect(e, v, i)}
                >
                  <option value="">${this.t("card.entity_none")}</option>
                  ${_.map(
      (v) => d`<option value=${v}>${v}</option>`
    )}
                </select>
              </div>
            `}
        <span class="field-hint">${this.t("card.entity_picker_hint")}</span>
      </label>
      <div
        class="action-data-field"
        data-action-data-field
        data-button=${e}
        data-action-slot=${i}
      >
        <button
          type="button"
          class="action-data-toggle"
          data-action-data-toggle
          aria-expanded=${y ? "true" : "false"}
          ?disabled=${this._busy || !O}
          @click=${() => this._toggleActionDataOpen(e, i)}
        >
          <span class="action-data-chevron" aria-hidden="true"></span>
          <span>${this.t("card.action_data")}</span>
        </button>
        ${y ? d`
              <label class="field action-data-editor">
                <textarea
                  class="action-data-box"
                  data-action-data
                  data-button=${e}
                  data-action-slot=${i}
                  rows="5"
                  dir="ltr"
                  lang="en"
                  spellcheck="false"
                  placeholder=${A}
                  .value=${w}
                  ?disabled=${this._busy || !O}
                  @input=${(v) => this._onActionDataInput(e, v, i)}
                ></textarea>
                <span class="field-hint">${this.t("card.action_data_hint")}</span>
                ${S ? d`<span class="field-error" data-action-data-error
                      >${this.t("card.action_data_invalid")}: ${S}</span
                    >` : u}
              </label>
            ` : u}
      </div>
      </div>
    `;
  }
  _buttonEntityId(e) {
    var i, a, o;
    const t = (i = this._draft) == null ? void 0 : i.buttons.find((n) => n.index === e), r = (o = (a = t == null ? void 0 : t.action) == null ? void 0 : a.target) == null ? void 0 : o.entity_id;
    return (r == null ? void 0 : r.trim()) || null;
  }
  _relayEntityId(e) {
    var i;
    const t = (i = this._panel) == null ? void 0 : i.relay_entities;
    if (!t || e < 1 || e > t.length)
      return null;
    const r = t[e - 1];
    return (r == null ? void 0 : r.trim()) || null;
  }
  _entityIsOn(e) {
    var i, a, o;
    const t = (o = (a = (i = this.hass) == null ? void 0 : i.states) == null ? void 0 : a[e]) == null ? void 0 : o.state;
    if (t == null)
      return null;
    const r = String(t).toLowerCase();
    return ["unavailable", "unknown"].includes(r) ? null : ["on", "open", "home", "playing", "active"].includes(r);
  }
  /** Live mapped relay state for a 1-based button index, or null if unknown. */
  _liveRelayOn(e) {
    var i, a;
    const t = this._relayEntityId(e);
    if (t) {
      const o = this._entityIsOn(t);
      if (o !== null)
        return o;
    }
    const r = this._runtimeRelayStates[e - 1] ?? ((a = (i = this._panel) == null ? void 0 : i.relay_states) == null ? void 0 : a[e - 1]);
    return r === void 0 ? null : r;
  }
  _hasOptimisticRing(e) {
    return Object.prototype.hasOwnProperty.call(this._splitPreviewOn, e);
  }
  _toggleLocalRing(e) {
    this._splitPreviewOn = {
      ...this._splitPreviewOn,
      [e]: !this._splitPreviewOn[e]
    };
  }
  _isRingOn(e) {
    var s, c, l;
    if (!this._draft)
      return !1;
    const t = this._liveRelayOn(e), r = this._hasOptimisticRing(e), i = !!this._splitPreviewOn[e], a = this._momentaryPreviewTimers[e] != null, o = this._coverDirectionFor(e);
    if (o) {
      if (t !== null)
        return t;
      const p = this._coverForButton(e), h = (s = this._panel) == null ? void 0 : s.cover_state;
      if (h != null && h.active && p) {
        const _ = (c = h.covers) == null ? void 0 : c.find((b) => b.id === p.id);
        return _ ? _.direction === o : h.cover_id === p.id || !((l = h.covers) != null && l.length) ? h.direction === o : !1;
      }
      return r ? i : !1;
    }
    if (this._isMomentaryButton(e))
      return t === !0 || a || r && i ? !0 : t === !1 ? !1 : r ? i : !1;
    if (t !== null && !r)
      return t;
    if (r)
      return i;
    if (t !== null)
      return t;
    if (this._draft.mode === "radio_split" || this._draft.mode === "mixed" && this._buttonRole(e) === "radio") {
      const p = this._buttonEntityId(e);
      if (p) {
        const h = this._entityIsOn(p);
        if (h !== null)
          return h;
      }
      return !1;
    }
    if ((this._draft.mode === "radio_mandatory" || this._draft.mode === "radio_optional") && this._isRadioMember(e))
      return (this._radioPreviewSelected ?? this._draft.selected_button) === e;
    const n = this._buttonEntityId(e);
    if (n) {
      const p = this._entityIsOn(n);
      if (p !== null)
        return p;
    }
    return e % 2 === 1;
  }
  _onRingPress(e) {
    if (this._pressedRing = e, window.setTimeout(() => {
      this._pressedRing === e && (this._pressedRing = null);
    }, 180), !this._draft)
      return;
    const t = this._coverDirectionFor(e);
    if (t) {
      const i = this._coverForButton(e);
      if (!i)
        return;
      const a = t === "open" ? i.close_button : i.open_button;
      this._splitPreviewOn = {
        ...this._splitPreviewOn,
        [e]: !this._splitPreviewOn[e],
        [a]: !1
      }, this._dispatchButtonPress(e);
      return;
    }
    if (this._draft.mode === "radio_split") {
      const i = this._radioGroupFor(e), a = { ...this._splitPreviewOn };
      if (!i)
        a[e] = !a[e];
      else {
        if (a[e])
          return;
        for (const o of i.buttons)
          a[o] = o === e;
      }
      this._splitPreviewOn = a, this._dispatchButtonPress(e);
      return;
    }
    if (this._draft.mode === "mixed") {
      const i = this._buttonRole(e);
      if (i === "radio") {
        const a = this._radioGroupFor(e), o = { ...this._splitPreviewOn };
        if (!a)
          o[e] = !o[e];
        else {
          if (o[e])
            return;
          for (const n of a.buttons)
            o[n] = n === e;
        }
        this._splitPreviewOn = o, this._dispatchButtonPress(e);
        return;
      }
      if (i === "momentary") {
        this._pulseMomentaryPreview(e), this._dispatchButtonPress(e);
        return;
      }
      this._toggleLocalRing(e), this._dispatchButtonPress(e);
      return;
    }
    if (this._draft.mode === "toggle") {
      this._toggleLocalRing(e), this._dispatchButtonPress(e);
      return;
    }
    if (!this._isRadioMember(e)) {
      this._toggleLocalRing(e), this._dispatchButtonPress(e);
      return;
    }
    (this._radioPreviewSelected ?? this._draft.selected_button) !== e && (this._radioPreviewSelected = e, this._dispatchButtonPress(e));
  }
  /**
   * Drive physical relays + HA actions through the integration.
   * Uses the saved active profile on the backend; never marks the draft dirty.
   */
  async _dispatchButtonPress(e) {
    var r;
    const t = (r = this._config) == null ? void 0 : r.entry_id;
    if (!(!this.hass || !t || this._busy))
      try {
        const i = await Tr(this.hass, t, e);
        this._applyRuntime(i);
      } catch (i) {
        this._error = i instanceof Error ? i.message : this.t("card.error"), this.requestUpdate();
      }
  }
  _ringOnColor() {
    var e;
    return _e((e = this._draft) == null ? void 0 : e.color_on, Kt);
  }
  _ringOffColor() {
    var e;
    return _e((e = this._draft) == null ? void 0 : e.color_off, Ci);
  }
  _renderFlag(e) {
    return e === "IL" ? d`
        <span class="flag flag-il" aria-hidden="true">
          <span class="flag-il-bar"></span>
          <span class="flag-il-star">✦</span>
          <span class="flag-il-bar"></span>
        </span>
      ` : e === "GB" ? d`<span class="flag flag-gb" aria-hidden="true"></span>` : d`<span class="flag flag-ru" aria-hidden="true"></span>`;
  }
  _renderSection(e, t, r) {
    const i = this._sections[e];
    return d`
      <section class="panel-section ${i ? "open" : "closed"}">
        <header class="section-head">
          <div class="section-title">${t}</div>
          <label class="switch" title=${this.t("card.section_toggle")}>
            <input
              type="checkbox"
              .checked=${i}
              @change=${() => this._toggleSection(e)}
            />
            <span class="slider"></span>
          </label>
        </header>
        <div class="section-body">
          <div class="section-body-inner">${i ? r : u}</div>
        </div>
      </section>
    `;
  }
  _formatSchedulerNextAt(e) {
    const t = e.at;
    if (!t)
      return e.at_time;
    const r = new Date(t);
    if (Number.isNaN(r.getTime()))
      return e.at_time;
    const i = /* @__PURE__ */ new Date();
    if (r.getFullYear() === i.getFullYear() && r.getMonth() === i.getMonth() && r.getDate() === i.getDate())
      return e.at_time;
    const o = (r.getDay() + 6) % 7;
    return `${this.t(lt[o])} ${e.at_time}`;
  }
  _renderHolidayBadge() {
    var t;
    if (!((t = this._panel) != null && t.holiday_mode))
      return u;
    const e = this.t("scheduler.holiday_badge");
    return d`
      <span
        class="faceplate-holiday-badge"
        data-holiday-badge
        title=${e}
        aria-label=${e}
        role="img"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            fill="currentColor"
            d="M12 2a1 1 0 0 1 1 1v1.06A7.002 7.002 0 0 1 19 11v1.17l1.55 1.55a1 1 0 0 1-1.41 1.41L18 13.59V11a5 5 0 0 0-4-4.9V17a3 3 0 1 1-2 0V6.1A5 5 0 0 0 8 11v2.59l-1.14 1.14a1 1 0 1 1-1.41-1.41L7 12.17V11a7.002 7.002 0 0 1 6-6.94V3a1 1 0 0 1 1-1Zm-1 17a1 1 0 1 0 2 0 1 1 0 0 0-2 0Z"
          />
        </svg>
      </span>
    `;
  }
  /**
   * Panel online when any mapped relay reports a usable HA state.
   * Prefers live hass.states (same path Z2M uses for MQTT availability),
   * then falls back to backend panel_available / relay_states.
   */
  _isPanelAvailable() {
    var r, i, a, o, n;
    const e = (r = this._panel) == null ? void 0 : r.relay_entities;
    if (e && e.length > 0 && ((i = this.hass) != null && i.states)) {
      let s = !1;
      for (const c of e) {
        const l = (a = this.hass.states[c]) == null ? void 0 : a.state;
        if (l == null)
          continue;
        s = !0;
        const p = String(l).toLowerCase();
        if (p !== "unavailable" && p !== "unknown")
          return !0;
      }
      if (s)
        return !1;
    }
    if (((o = this._panel) == null ? void 0 : o.panel_available) !== void 0)
      return !!this._panel.panel_available;
    const t = this._runtimeRelayStates.length > 0 ? this._runtimeRelayStates : (n = this._panel) == null ? void 0 : n.relay_states;
    return t && t.length > 0 ? t.some((s) => s != null) : !0;
  }
  _renderUnavailableStatus() {
    if (this._isPanelAvailable())
      return u;
    const e = this.t("card.panel_unavailable");
    return d`
      <div
        class="faceplate-unavailable"
        data-panel-unavailable
        role="status"
        aria-live="polite"
      >
        ${e}
      </div>
    `;
  }
  _renderSchedulerNextFooter() {
    var r, i, a;
    if (!this._isPanelAvailable() || (r = this._panel) != null && r.holiday_mode)
      return u;
    const e = (i = this._panel) == null ? void 0 : i.scheduler_next, t = !!((a = this._panel) != null && a.scheduler_active);
    return t && (e != null && e.profile_name) && e.at_time ? d`
        <div class="faceplate-scheduler-next" data-scheduler-next>
          <span class="scheduler-next-label">${this.t("scheduler.next_profile")}</span>
          <span class="scheduler-next-profile">${e.profile_name}</span>
          <span class="scheduler-next-sep">${this.t("scheduler.next_at")}</span>
          <span class="scheduler-next-time">${this._formatSchedulerNextAt(e)}</span>
        </div>
      ` : t ? d`
        <div class="faceplate-scheduler-next" data-scheduler-next data-scheduler-active-only>
          <span class="scheduler-next-label">${this.t("scheduler.active_compact")}</span>
        </div>
      ` : u;
  }
  _renderFaceplate() {
    if (!this._draft)
      return u;
    const e = this._ringOnColor(), t = this._ringOffColor();
    return d`
      <!--
        Faceplate matches product photos: black label bar (~28%), white touch
        face with rings centered in the lower body (clear gap under labels),
        N equal columns (L1 leftmost … Ln). Outer bezel keeps the landscape
        4-gang footprint; rings use color_on / color_off.
        Photo skin hook: --conx-faceplate-skin on .faceplate.
      -->
      <div
        class="faceplate"
        dir="ltr"
        style="--ring-on:${e};--ring-off:${t};--conx-gang-count:${this._gangCount()}"
        role="img"
        aria-label=${this.t("card.preview")}
      >
        <div class="faceplate-bezel">
          ${this._renderHolidayBadge()}
          <div class="faceplate-skin"></div>
          <div class="faceplate-glass">
            <div class="faceplate-labels">
              ${this._draft.buttons.filter((r) => r.index <= this._gangCount()).map(
      (r) => d`
                    <div class="faceplate-label">
                      ${r.name || `L${r.index}`}
                    </div>
                  `
    )}
            </div>
            <div class="faceplate-touch">
              <div class="faceplate-rings">
                ${this._draft.buttons.filter((r) => r.index <= this._gangCount()).map((r) => {
      const i = this._isRingOn(r.index), a = this._pressedRing === r.index;
      return d`
                    <button
                      type="button"
                      class="ring ${i ? "on" : "off"} ${a ? "pressed" : ""}"
                      ?disabled=${this._busy}
                      @click=${() => this._onRingPress(r.index)}
                      aria-label=${`${this.t("card.button")} ${r.index}`}
                    >
                      <span class="ring-glow"></span>
                    </button>
                  `;
    })}
              </div>
            </div>
          </div>
        </div>
        ${this._renderUnavailableStatus()}
        ${this._renderSchedulerNextFooter()}
      </div>
    `;
  }
  _renderWizardNav() {
    const e = this._wizardIndex();
    return d`
      <nav class="wizard-steps" aria-label=${this.t("card.wizard")}>
        ${H.map((t, r) => {
      const i = t === this._wizardStep, a = r < e;
      return d`
            <button
              type="button"
              class="wizard-step ${i ? "active" : ""} ${a ? "done" : ""}"
              ?disabled=${this._busy}
              @click=${() => this._goToStep(t)}
            >
              <span class="wizard-index">${r + 1}</span>
              <span class="wizard-label">${this._stepLabel(t)}</span>
            </button>
          `;
    })}
      </nav>
      <p class="wizard-hint">${this.t(`card.step_${this._wizardStep}_hint`)}</p>
    `;
  }
  _renderWizardFooter() {
    const e = this._wizardIndex();
    return d`
      <div class="wizard-footer">
        <button
          type="button"
          class="btn"
          ?disabled=${this._busy || e <= 0}
          @click=${this._wizardBack}
        >
          ${this.t("card.wizard_back")}
        </button>
        <button
          type="button"
          class="btn primary"
          ?disabled=${this._busy || e >= H.length - 1}
          @click=${this._wizardNext}
        >
          ${this.t("card.wizard_next")}
        </button>
      </div>
    `;
  }
  _renderThemePicker() {
    return d`
      <div class="theme-picker" role="group" aria-label=${this.t("card.theme")}>
        <div class="theme-picker-label">${this.t("card.theme")}</div>
        <div class="theme-swatches">
          ${We.map(
      (e) => d`
              <button
                type="button"
                class="theme-swatch ${this._theme === e.id ? "active" : ""}"
                style="--swatch:${e.swatch};--swatch-accent:${e.accent}"
                title=${this.t(`theme.${e.id}`)}
                ?disabled=${this._busy}
                @click=${() => this._setTheme(e.id)}
              >
                <span class="theme-swatch-face" aria-hidden="true"></span>
                <span class="theme-swatch-name">${this.t(`theme.${e.id}`)}</span>
              </button>
            `
    )}
        </div>
      </div>
    `;
  }
  _renderStepLanguage() {
    return d`
      <div class="lang-hero" role="group" aria-label=${this.t("card.language")}>
        ${Ne.map(
      (e) => d`
            <button
              type="button"
              class="lang-hero-btn ${this._language === e.id ? "active" : ""}"
              ?disabled=${this._busy}
              @click=${() => this._setLanguage(e.id)}
            >
              ${this._renderFlag(e.flag)}
              <span class="lang-hero-code">${e.id.toUpperCase()}</span>
              <span class="lang-hero-name">${e.label}</span>
            </button>
          `
    )}
      </div>
    `;
  }
  _renderStepProfiles() {
    return !this._panel || !this._draft ? u : d`
      <div class="profile-list">
        ${Object.values(this._panel.profiles).map(
      (e) => {
        var t;
        return d`
            <button
              type="button"
              class="profile-chip ${e.id === ((t = this._draft) == null ? void 0 : t.id) ? "active" : ""}"
              ?disabled=${this._busy}
              @click=${() => this._selectProfile(e.id)}
            >
              <span class="chip-name">${e.name}</span>
              <span class="chip-id">${e.id}</span>
            </button>
          `;
      }
    )}
      </div>
      <div class="profile-gang" data-profiles-gang>
        ${this._renderGangPicker()}
      </div>
      <div class="profile-name-row">
        <label class="field">
          <span>${this.t("card.panel_name")}</span>
          <input
            type="text"
            .value=${this._panelNameDraft}
            ?disabled=${this._busy}
            @input=${(e) => {
      this._panelNameDraft = e.target.value;
    }}
            @change=${this._commitPanelName}
          />
        </label>
        <label class="field">
          <span>${this.t("card.profile_name")}</span>
          <input
            type="text"
            .value=${this._draft.name}
            ?disabled=${this._busy}
            @input=${this._onProfileNameInput}
          />
        </label>
      </div>
      <div class="profile-actions">
        <button type="button" class="btn" ?disabled=${this._busy} @click=${this._createProfile}>
          ${this.t("card.create")}
        </button>
        <button type="button" class="btn" ?disabled=${this._busy} @click=${this._duplicateProfile}>
          ${this.t("card.duplicate")}
        </button>
        <button type="button" class="btn danger" ?disabled=${this._busy} @click=${this._deleteProfile}>
          ${this.t("card.delete")}
        </button>
      </div>
    `;
  }
  _editSchedulerTask(e) {
    this._schedulerDraft = {
      ...structuredClone(e),
      scope: e.scope || "local",
      entry_ids: [...e.entry_ids || []],
      conditions: ht(e.conditions)
    };
  }
  _defaultProfileIdForScheduler() {
    var e, t, r;
    return ((e = this._panel) == null ? void 0 : e.default_profile_id) || ((t = this._panel) == null ? void 0 : t.active_profile_id) || Object.keys(((r = this._panel) == null ? void 0 : r.profiles) || {})[0] || "lighting";
  }
  _alternateProfileIdForScheduler(e) {
    var r;
    return Object.keys(((r = this._panel) == null ? void 0 : r.profiles) || {}).find((i) => i !== e);
  }
  _startNewSchedulerTask() {
    if (!this._panel) return;
    const e = this._defaultProfileIdForScheduler();
    this._schedulerDraft = Bt(
      e,
      this._alternateProfileIdForScheduler(e)
    );
  }
  _startNewMasterSchedulerTask() {
    if (!this._panel || !this._config) return;
    const e = this._defaultProfileIdForScheduler();
    this._schedulerDraft = Jr(
      e,
      [this._config.entry_id],
      this._alternateProfileIdForScheduler(e)
    );
  }
  _conflictTasksForDraft(e) {
    var a;
    if (!this._panel || !this._config) return [e];
    const t = this._config.entry_id, r = Object.values(this._panel.scheduler_tasks || {}), i = Object.values(this._panel.master_scheduler_tasks || {});
    if ((e.scope || "local") === "master") {
      const o = (a = e.entry_ids) != null && a.length ? e.entry_ids : [t], n = [];
      for (const c of o) {
        const l = pt(
          c === t ? r : [],
          i,
          c
        ).filter((p) => p.id !== e.id);
        n.push(...l);
      }
      const s = /* @__PURE__ */ new Map();
      for (const c of n) s.set(c.id, c);
      return s.set(e.id, e), [...s.values()];
    }
    return [
      ...pt(r, i, t).filter((o) => o.id !== e.id),
      e
    ];
  }
  async _saveSchedulerTask() {
    if (!this.hass || !this._config || !this._schedulerDraft || !this._panel) return;
    const e = {
      ...this._schedulerDraft,
      conditions: ht(this._schedulerDraft.conditions),
      entry_ids: (this._schedulerDraft.scope || "local") === "master" ? [...this._schedulerDraft.entry_ids || []] : [],
      scope: this._schedulerDraft.scope || "local"
    };
    if (e.scope === "master" && !(e.entry_ids || []).length) {
      this._error = this.t("scheduler.master_panels");
      return;
    }
    const t = Yr(this._conflictTasksForDraft(e));
    if (t.length) {
      this._schedulerConflict = t[0].message;
      return;
    }
    this._busy = !0;
    try {
      const r = await Rr(this.hass, this._config.entry_id, e);
      this._applyPanel(r), this._schedulerDraft = null, this._error = void 0, this._notice = this.t("scheduler.saved");
    } catch (r) {
      const i = r instanceof Error ? r.message : String(r);
      i.toLowerCase().includes("conflict") || /schedule_conflict/i.test(i) ? this._schedulerConflict = i : this._error = i;
    } finally {
      this._busy = !1;
    }
  }
  async _deleteSchedulerTask(e) {
    var t;
    if (!(!this.hass || !this._config)) {
      this._busy = !0;
      try {
        const r = await Mr(this.hass, this._config.entry_id, e);
        this._applyPanel(r), ((t = this._schedulerDraft) == null ? void 0 : t.id) === e && (this._schedulerDraft = null), this._notice = this.t("scheduler.deleted");
      } catch (r) {
        this._error = r instanceof Error ? r.message : String(r);
      } finally {
        this._busy = !1;
      }
    }
  }
  async _toggleHoliday(e, t = "panel") {
    if (!(!this.hass || !this._config)) {
      this._busy = !0;
      try {
        const r = await Lr(
          this.hass,
          this._config.entry_id,
          e,
          t
        );
        this._applyPanel(r);
      } catch (r) {
        this._error = r instanceof Error ? r.message : String(r);
      } finally {
        this._busy = !1;
      }
    }
  }
  async _changeDefaultProfile(e) {
    if (!(!this.hass || !this._config)) {
      this._busy = !0;
      try {
        const t = await zr(this.hass, this._config.entry_id, e);
        this._applyPanel(t);
      } catch (t) {
        this._error = t instanceof Error ? t.message : String(t);
      } finally {
        this._busy = !1;
      }
    }
  }
  async _toggleTaskEnabled(e, t) {
    if (!(!this.hass || !this._config)) {
      this._busy = !0;
      try {
        const r = await Nr(
          this.hass,
          this._config.entry_id,
          e,
          t
        );
        this._applyPanel(r);
      } catch (r) {
        const i = r instanceof Error ? r.message : String(r);
        i.toLowerCase().includes("conflict") ? this._schedulerConflict = i : this._error = i;
      } finally {
        this._busy = !1;
      }
    }
  }
  _renderConditionEditor(e) {
    const t = e.conditions || [], r = this._haEntityPickerReady && !!this.hass;
    return d`
      <div class="scheduler-conditions">
        <div class="scheduler-field-label">${this.t("scheduler.conditions")}</div>
        <p class="field-hint">${this.t("scheduler.conditions_hint")}</p>
        <p class="field-hint">${this.t("scheduler.conflict_conditions_note")}</p>
        ${t.map(
      (i, a) => d`
            <div class="scheduler-condition-row">
              <label class="field">
                <span>${this.t("scheduler.condition_entity")}</span>
                ${r ? d`
                      <ha-entity-picker
                        .hass=${this.hass}
                        .value=${i.entity_id}
                        allow-custom-entity
                        @value-changed=${(o) => {
        var s;
        const n = String(
          ((s = o.detail) == null ? void 0 : s.value) || ""
        );
        i.entity_id = n, e.conditions = [...t], this._schedulerDraft = { ...e };
      }}
                      ></ha-entity-picker>
                    ` : d`
                      <input
                        type="text"
                        .value=${i.entity_id}
                        @input=${(o) => {
        i.entity_id = o.target.value, e.conditions = [...t], this._schedulerDraft = { ...e };
      }}
                      />
                    `}
              </label>
              <label class="field">
                <span>${this.t("scheduler.condition_operator")}</span>
                <select
                  @change=${(o) => {
        i.operator = o.target.value, e.conditions = [...t], this._schedulerDraft = { ...e };
      }}
                >
                  ${Ur.map(
        (o) => d`
                      <option value=${o} ?selected=${i.operator === o}>
                        ${this.t(`scheduler.op_${o}`)}
                      </option>
                    `
      )}
                </select>
              </label>
              <label class="field">
                <span>${this.t("scheduler.condition_value")}</span>
                <input
                  type="text"
                  .value=${i.value}
                  @input=${(o) => {
        i.value = o.target.value, e.conditions = [...t], this._schedulerDraft = { ...e };
      }}
                />
              </label>
              <button
                type="button"
                class="btn danger"
                @click=${() => {
        e.conditions = t.filter((o, n) => n !== a), this._schedulerDraft = { ...e };
      }}
              >
                ${this.t("scheduler.delete_condition")}
              </button>
            </div>
          `
    )}
        <button
          type="button"
          class="btn"
          @click=${() => {
      e.conditions = [...t, Gr()], this._schedulerDraft = { ...e };
    }}
        >
          ${this.t("scheduler.add_condition")}
        </button>
      </div>
    `;
  }
  _renderSchedulerTaskEditor(e, t) {
    var n, s, c;
    const r = (e.scope || "local") === "master", i = ((n = this._panel) == null ? void 0 : n.panels) || [], a = Object.keys(((s = this._panel) == null ? void 0 : s.scheduler_tasks) || {}).includes(e.id), o = Object.keys(((c = this._panel) == null ? void 0 : c.master_scheduler_tasks) || {}).includes(
      e.id
    );
    return d`
      <div class="scheduler-editor">
        ${r ? d`<p class="notice subtle">${this.t("scheduler.master_hint")}</p>` : u}
        <label class="field">
          <span>${this.t("scheduler.task_name")}</span>
          <input
            type="text"
            .value=${e.name}
            @input=${(l) => {
      e.name = l.target.value, this._schedulerDraft = { ...e };
    }}
          />
        </label>
        <label class="switch-row">
          <span>${this.t("scheduler.enabled")}</span>
          <label class="switch">
            <input
              type="checkbox"
              .checked=${e.enabled}
              @change=${(l) => {
      e.enabled = l.target.checked, this._schedulerDraft = { ...e };
    }}
            />
            <span class="slider"></span>
          </label>
        </label>
        ${r ? d`
              <div class="scheduler-field-block">
                <div class="scheduler-field-label">${this.t("scheduler.master_panels")}</div>
                <div
                  class="chip-row chip-row-panels"
                  role="group"
                  aria-label=${this.t("scheduler.master_panels")}
                >
                  ${i.map(
      (l) => d`
                      <button
                        type="button"
                        class="chip ${(e.entry_ids || []).includes(l.entry_id) ? "active" : ""}"
                        @click=${() => {
        const p = new Set(e.entry_ids || []);
        p.has(l.entry_id) ? p.delete(l.entry_id) : p.add(l.entry_id), e.entry_ids = [...p], this._schedulerDraft = { ...e };
      }}
                      >
                        ${l.panel_name}
                      </button>
                    `
    )}
                </div>
              </div>
            ` : u}
        <div class="scheduler-field-block">
          <div class="scheduler-field-label">${this.t("scheduler.weekdays")}</div>
          <div
            class="chip-row chip-row-days"
            role="group"
            aria-label=${this.t("scheduler.weekdays")}
          >
            ${lt.map(
      (l, p) => d`
                <button
                  type="button"
                  class="chip ${e.weekdays.includes(p) ? "active" : ""}"
                  aria-pressed=${e.weekdays.includes(p) ? "true" : "false"}
                  @click=${() => {
        const h = new Set(e.weekdays);
        h.has(p) ? h.delete(p) : h.add(p), e.weekdays = [...h].sort((_, b) => _ - b), this._schedulerDraft = { ...e };
      }}
                >
                  ${this.t(l)}
                </button>
              `
    )}
          </div>
        </div>
        <div class="scheduler-field-block">
          <div class="scheduler-field-label">${this.t("scheduler.months")}</div>
          <div
            class="chip-row chip-row-months"
            role="group"
            aria-label=${this.t("scheduler.months")}
          >
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(
      (l) => d`
                <button
                  type="button"
                  class="chip ${e.months.includes(l) ? "active" : ""}"
                  aria-pressed=${e.months.includes(l) ? "true" : "false"}
                  @click=${() => {
        const p = new Set(e.months);
        p.has(l) ? p.delete(l) : p.add(l), e.months = [...p].sort((h, _) => h - _), this._schedulerDraft = { ...e };
      }}
                >
                  ${this.t(`scheduler.month_${l}`)}
                </button>
              `
    )}
          </div>
        </div>
        <p class="field-hint">${this.t("scheduler.overnight_hint")}</p>
        <div class="scheduler-ranges">
          <div class="scheduler-field-label">${this.t("scheduler.ranges")}</div>
          ${e.ranges.map(
      (l, p) => d`
              <div class="scheduler-range-row">
                <label class="field">
                  <span>${this.t("scheduler.range_from")}</span>
                  <input
                    type="time"
                    .value=${l.start}
                    @change=${(h) => {
        l.start = h.target.value || "00:00", this._schedulerDraft = {
          ...e,
          ranges: [...e.ranges]
        };
      }}
                  />
                </label>
                <label class="field">
                  <span>${this.t("scheduler.range_to")}</span>
                  <input
                    type="time"
                    .value=${l.end}
                    @change=${(h) => {
        l.end = h.target.value || "00:00", this._schedulerDraft = {
          ...e,
          ranges: [...e.ranges]
        };
      }}
                  />
                </label>
                <label class="field">
                  <span>${this.t("scheduler.range_profile")}</span>
                  <select
                    @change=${(h) => {
        l.profile_id = h.target.value, this._schedulerDraft = {
          ...e,
          ranges: [...e.ranges]
        };
      }}
                  >
                    ${t.map(
        (h) => d`
                        <option
                          value=${h.id}
                          ?selected=${h.id === l.profile_id}
                        >
                          ${h.name}
                        </option>
                      `
      )}
                  </select>
                </label>
                <button
                  type="button"
                  class="btn danger"
                  ?disabled=${e.ranges.length <= 1}
                  @click=${() => {
        e.ranges = e.ranges.filter((h, _) => _ !== p), this._schedulerDraft = { ...e };
      }}
                >
                  ${this.t("scheduler.delete_range")}
                </button>
              </div>
            `
    )}
          <button
            type="button"
            class="btn"
            @click=${() => {
      const l = this._defaultProfileIdForScheduler();
      e.ranges = [
        ...e.ranges,
        { start: "18:00", end: "22:00", profile_id: l }
      ], this._schedulerDraft = { ...e };
    }}
          >
            ${this.t("scheduler.add_range")}
          </button>
        </div>
        ${this._renderConditionEditor(e)}
        <label class="field">
          <span>${this.t("scheduler.notes")}</span>
          <input
            type="text"
            .value=${e.notes || ""}
            @input=${(l) => {
      e.notes = l.target.value, this._schedulerDraft = { ...e };
    }}
          />
        </label>
        <div class="profile-actions">
          <button
            type="button"
            class="btn primary"
            ?disabled=${this._busy}
            @click=${() => void this._saveSchedulerTask()}
          >
            ${this.t("scheduler.save_task")}
          </button>
          <button
            type="button"
            class="btn"
            ?disabled=${this._busy}
            @click=${() => {
      this._schedulerDraft = null;
    }}
          >
            ${this.t("card.discard")}
          </button>
          ${a || o ? d`
                <button
                  type="button"
                  class="btn danger"
                  ?disabled=${this._busy}
                  @click=${() => void this._deleteSchedulerTask(e.id)}
                >
                  ${this.t("scheduler.delete_task")}
                </button>
              ` : u}
        </div>
      </div>
    `;
  }
  _renderSchedulerTab() {
    if (!this._panel)
      return u;
    const e = Object.values(this._panel.scheduler_tasks || {}).sort(
      (o, n) => o.name.localeCompare(n.name)
    ), t = Object.values(this._panel.master_scheduler_tasks || {}).sort(
      (o, n) => o.name.localeCompare(n.name)
    ), r = this._schedulerDraft, i = Object.values(this._panel.profiles), a = (o, n) => d`
      <div class="scheduler-task-row">
        <button
          type="button"
          class="profile-chip ${(r == null ? void 0 : r.id) === o.id ? "active" : ""}"
          @click=${() => this._editSchedulerTask(o)}
        >
          <span class="chip-name"
            >${n ? d`<span class="master-badge">${this.t("scheduler.master_badge")}</span>` : u}${o.name}</span
          >
          <span class="chip-id">${o.ranges.length} ranges</span>
        </button>
        <label class="scheduler-enable" title=${this.t("scheduler.enabled")}>
          <span class="switch-caption">${this.t("scheduler.enabled")}</span>
          <label class="switch">
            <input
              type="checkbox"
              .checked=${o.enabled}
              ?disabled=${this._busy}
              aria-label=${`${this.t("scheduler.enabled")}: ${o.name}`}
              @change=${(s) => {
      this._toggleTaskEnabled(o.id, s.target.checked);
    }}
            />
            <span class="slider"></span>
          </label>
        </label>
      </div>
    `;
    return d`
      <div class="scheduler-panel" data-scheduler>
        <p class="field-hint">${this.t("scheduler.hint")}</p>
        <label class="switch-row">
          <span>${this.t("scheduler.holiday")}</span>
          <label class="switch">
            <input
              type="checkbox"
              .checked=${!!this._panel.panel_holiday_mode}
              ?disabled=${this._busy}
              @change=${(o) => {
      this._toggleHoliday(
        o.target.checked,
        "panel"
      );
    }}
            />
            <span class="slider"></span>
          </label>
        </label>
        <label class="switch-row">
          <span>${this.t("scheduler.master_holiday")}</span>
          <label class="switch">
            <input
              type="checkbox"
              .checked=${!!this._panel.master_holiday_mode}
              ?disabled=${this._busy}
              @change=${(o) => {
      this._toggleHoliday(
        o.target.checked,
        "master"
      );
    }}
            />
            <span class="slider"></span>
          </label>
        </label>
        ${this._panel.master_holiday_mode ? d`<p class="notice subtle">${this.t("scheduler.master_holiday_on")}</p>` : this._panel.holiday_mode ? d`<p class="notice subtle">${this.t("scheduler.holiday_on")}</p>` : u}
        <label class="field">
          <span>${this.t("scheduler.default_profile")}</span>
          <select
            ?disabled=${this._busy}
            @change=${(o) => {
      this._changeDefaultProfile(o.target.value);
    }}
          >
            ${i.map(
      (o) => {
        var n;
        return d`
                <option
                  value=${o.id}
                  ?selected=${o.id === ((n = this._panel) == null ? void 0 : n.default_profile_id)}
                >
                  ${o.name}
                </option>
              `;
      }
    )}
          </select>
          <span class="field-hint">${this.t("scheduler.default_hint")}</span>
        </label>

        <div class="menu-section scheduler-transfer">
          <span class="menu-label">${this.t("scheduler.transfer")}</span>
          <p class="field-hint">${this.t("scheduler.import_hint")}</p>
          <div class="menu-actions menu-action-grid">
            <button
              type="button"
              class="btn success"
              ?disabled=${this._busy}
              @click=${() => {
      this._exportScheduler();
    }}
            >
              ${this.t("scheduler.export")}
            </button>
            <button
              type="button"
              class="btn"
              ?disabled=${this._busy}
              @click=${() => this._openSchedulerImport("merge")}
            >
              ${this.t("scheduler.import_merge")}
            </button>
            <button
              type="button"
              class="btn danger"
              ?disabled=${this._busy}
              @click=${() => this._openSchedulerImport("replace")}
            >
              ${this.t("scheduler.import_replace")}
            </button>
          </div>
          ${this._schedulerImportWarnings.length ? d`
                <details class="scheduler-import-warnings">
                  <summary>${this.t("scheduler.import_warnings")}</summary>
                  <ul>
                    ${this._schedulerImportWarnings.map(
      (o) => d`<li>${o}</li>`
    )}
                  </ul>
                </details>
              ` : u}
        </div>

        <div class="scheduler-task-list">
          <div class="section-head-main">
            <div class="section-title">${this.t("scheduler.local_tasks")}</div>
            <button
              type="button"
              class="btn"
              data-scheduler-add-local
              ?disabled=${this._busy}
              @click=${() => this._startNewSchedulerTask()}
            >
              ${this.t("scheduler.add_task")}
            </button>
          </div>
          ${e.map((o) => a(o, !1))}
        </div>

        <div class="scheduler-task-list">
          <div class="section-head-main">
            <div class="section-title">${this.t("scheduler.master_tasks")}</div>
            <button
              type="button"
              class="btn"
              ?disabled=${this._busy}
              @click=${() => this._startNewMasterSchedulerTask()}
            >
              ${this.t("scheduler.add_master")}
            </button>
          </div>
          ${t.map((o) => a(o, !0))}
        </div>

        ${r ? this._renderSchedulerTaskEditor(r, i) : u}
      </div>
    `;
  }
  _renderSchedulerConflictDialog() {
    return this._schedulerConflict ? d`
      <div
        class="conx-layer"
        role="presentation"
        @click=${(e) => {
      e.target === e.currentTarget && (this._schedulerConflict = null);
    }}
      >
        <div class="conx-panel compact" role="dialog" aria-modal="true" data-scheduler-conflict>
          <div class="menu-head">
            <div class="menu-title">${this.t("scheduler.conflict_title")}</div>
            <button
              type="button"
              class="menu-close"
              @click=${() => {
      this._schedulerConflict = null;
    }}
            >
              ×
            </button>
          </div>
          <p class="info-intro">${this.t("scheduler.conflict_body")}</p>
          <p class="field-hint">${this.t("scheduler.conflict_conditions_note")}</p>
          <pre class="conflict-detail">${this._schedulerConflict}</pre>
          <button
            type="button"
            class="btn primary"
            @click=${() => {
      this._schedulerConflict = null;
    }}
          >
            ${this.t("scheduler.conflict_ok")}
          </button>
        </div>
      </div>
    ` : u;
  }
  async _commitPanelName() {
    if (!this.hass || !this._config || !this._panel)
      return;
    const e = this._panelNameDraft.trim();
    if (!e || e === this._panel.panel_name) {
      this._panelNameDraft = this._panel.panel_name;
      return;
    }
    this._busy = !0, this._error = void 0;
    try {
      const t = await Pr(
        this.hass,
        this._config.entry_id,
        e
      );
      this._applyPanel(t), this._notice = this.t("card.panel_name_ok");
    } catch (t) {
      this._error = t instanceof Error ? t.message : String(t), this._panelNameDraft = this._panel.panel_name;
    } finally {
      this._busy = !1;
    }
  }
  _renderModePicker() {
    if (!this._panel || !this._draft)
      return u;
    const e = nt(
      this._panel.capabilities.modes,
      this._gangCount()
    ), t = Me(
      this._draft.mode,
      this._gangCount()
    );
    return d`
      <label class="field">
        <span>${this.t("card.mode")}</span>
        <div class="mode-picker" role="radiogroup" data-mode-picker>
          ${e.map(
      (r) => d`
              <button
                type="button"
                class="radio-member ${t === r ? "on" : ""}"
                role="radio"
                aria-checked=${t === r ? "true" : "false"}
                data-mode=${r}
                ?disabled=${this._busy}
                @click=${() => this._setMode(r)}
              >
                <span class="radio-member-label">${this.t(`mode.${r}`)}</span>
              </button>
            `
    )}
        </div>
      </label>
    `;
  }
  _renderAppearanceFields() {
    if (!this._panel || !this._draft)
      return u;
    const e = Ri(
      this._panel.capabilities.colors,
      this._draft.color_on,
      this._draft.color_off
    ), t = U(this._draft.color_on) ? W(this._draft.color_on) : this._draft.color_on, r = U(this._draft.color_off) ? W(this._draft.color_off) : this._draft.color_off, i = Mi(
      this._panel.capabilities.radar,
      this._draft.radar
    );
    return d`
          <div class="grid-2">
            <label class="field">
              <span>${this.t("card.color_on")}</span>
              <div class="select-wrap color-select">
                <span
                  class="swatch"
                  style="background:${_e(t)}"
                ></span>
                <select
                  .value=${t}
                  ?disabled=${this._busy}
                  @change=${(a) => this._patchDraft((o) => {
      o.color_on = a.target.value;
    })}
                >
                  ${e.map(
      (a) => d`<option value=${a}>${wt(
        a,
        this._language
      )}</option>`
    )}
                </select>
              </div>
            </label>
            <label class="field">
              <span>${this.t("card.color_off")}</span>
              <div class="select-wrap color-select">
                <span
                  class="swatch"
                  style="background:${_e(r)}"
                ></span>
                <select
                  .value=${r}
                  ?disabled=${this._busy}
                  @change=${(a) => this._patchDraft((o) => {
      o.color_off = a.target.value;
    })}
                >
                  ${e.map(
      (a) => d`<option value=${a}>${wt(
        a,
        this._language
      )}</option>`
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
                @change=${(a) => this._patchDraft((o) => {
      o.radar = a.target.value;
    })}
              >
                ${i.map(
      (a) => d`<option value=${a}>${zi(
        a,
        this._language
      )}</option>`
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
                  @change=${(a) => this._patchDraft((o) => {
      o.backlight = a.target.checked;
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
                  @change=${(a) => this._patchDraft((o) => {
      o.child_lock = a.target.checked;
    })}
                />
                <span class="slider"></span>
              </label>
            </label>
          </div>
          <label class="field dimmer-field ${this._draft.backlight ? "" : "dimmed"}">
            <span class="dimmer-label-row">
              <span>${this.t("card.backlight_brightness")}</span>
              <strong class="dimmer-pct">${this._draft.backlight_brightness ?? 100}%</strong>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              .value=${String(this._draft.backlight_brightness ?? 100)}
              style="--brightness-pct: ${this._draft.backlight_brightness ?? 100}%"
              ?disabled=${this._busy || !this._draft.backlight}
              @input=${(a) => this._patchDraft((o) => {
      o.backlight_brightness = Number(
        a.target.value
      );
    })}
            />
          </label>
    `;
  }
  _renderMixedRolesSection() {
    if (!this._draft || this._draft.mode !== "mixed")
      return u;
    const e = Re(this._gangCount()), t = this._covers(), r = t.length > 1, i = this._draft.buttons.filter(
      (a) => a.index <= this._gangCount()
    );
    return d`
      <div class="mixed-roles-section" data-mixed-roles>
        <div class="mixed-roles-head">
          <span class="menu-label">${this.t("card.mixed_roles")}</span>
        </div>
        ${i.map((a) => {
      var S, A, O, R;
      const o = a.role || "toggle", n = a.pulse_time_s ?? D, s = String(a.cover_id || ((S = t[0]) == null ? void 0 : S.id) || "cover_1").trim() || "cover_1", c = (a.name || "").trim() || "—", l = o === "cover_open" || o === "cover_close", p = o === "toggle" || o === "momentary" || o === "radio", h = p || l, _ = t.find((x) => x.id === s) || t[0], b = l ? this._firstCoverRoleIndex(s) : null, y = l && _ && b === a.index, w = l && _ && b != null && b !== a.index;
      return String(
        ((O = (A = a.action) == null ? void 0 : A.target) == null ? void 0 : O.entity_id) || ""
      ), (R = a.action) != null && R.action, d`
            <div class="mixed-role-card" data-mixed-role=${a.index}>
              <div class="mixed-role-card-main">
                <div class="mixed-role-card-head">
                  <span class="mixed-role-l" dir="ltr">L${a.index}</span>
                  <span class="mixed-role-name">${c}</span>
                </div>
                <div
                  class="mixed-role-picker"
                  role="radiogroup"
                  aria-label=${this.t("card.button_role")}
                >
                  ${e.map(
        (x) => d`
                      <button
                        type="button"
                        class="radio-member ${o === x ? "on" : ""}"
                        role="radio"
                        aria-checked=${o === x ? "true" : "false"}
                        data-role=${x}
                        ?disabled=${this._busy}
                        @click=${() => this._setButtonRole(a.index, x)}
                      >
                        <span class="radio-member-label"
                          >${this.t(`role.${x}`)}</span
                        >
                      </button>
                    `
      )}
                </div>
              </div>
              ${h ? d`
                    <div class="mixed-role-extras">
                      ${o === "momentary" ? d`
                            <label class="field field-inline mixed-pulse">
                              <span
                                >${this.t("card.pulse_time")} (${this.t(
        "card.cover_seconds"
      )})</span
                              >
                              <input
                                type="number"
                                data-pulse-time
                                min=${Tt}
                                max=${Rt}
                                step="0.1"
                                .value=${String(n)}
                                ?disabled=${this._busy}
                                @change=${(x) => {
        const M = Number(
          x.target.value
        );
        this._patchDraft((v) => {
          const Ge = v.buttons.find(
            (Vt) => Vt.index === a.index
          );
          Ge && (Ge.pulse_time_s = ie(
            M,
            D
          ));
        });
      }}
                              />
                            </label>
                          ` : u}
                      ${p ? d`
                            <div
                              class="mixed-action-entity"
                              data-mixed-action-entity
                            >
                              ${this._renderButtonActionSlots(a.index)}
                            </div>
                          ` : u}
                      ${l && _ ? this._renderMixedCoverExtras({
        buttonIndex: a.index,
        cover: _,
        coverId: s,
        covers: t,
        multiCover: r,
        showTimes: !!y,
        showTimesPointer: !!(w && b != null),
        timesOwner: b
      }) : u}
                    </div>
                  ` : u}
            </div>
          `;
    })}
      </div>
    `;
  }
  _renderButtonsFields() {
    return !this._panel || !this._draft ? u : d`
      ${this._renderModePicker()} ${this._renderMixedRolesSection()}
      ${this._renderRadioGroupsEditor()}
      ${this._renderCoverEditor()}
          <div class="buttons-accordion">
            ${this._draft.buttons.filter((e) => e.index <= this._gangCount()).map((e) => {
      var b, y, w, S, A, O;
      const t = !!this._expandedButtons[e.index], r = String(
        ((y = (b = e.action) == null ? void 0 : b.target) == null ? void 0 : y.entity_id) || ""
      ), i = (e.name || "").trim() || "—", a = ((w = e.action) == null ? void 0 : w.action) || "", o = ((S = this._draft) == null ? void 0 : S.mode) === "radio_mandatory" || ((A = this._draft) == null ? void 0 : A.mode) === "radio_optional", n = e.radio_member !== !1, s = this._coverDirectionFor(e.index), c = ((O = this._draft) == null ? void 0 : O.mode) === "mixed" ? e.role || "toggle" : null, l = c === "cover_open" || c === "cover_close", p = c ? this.t(`role.${c}`) : s ? this.t(
        s === "open" ? "card.cover_open" : "card.cover_close"
      ) : o ? n ? this.t("card.radio_member") : this.t("card.radio_toggle") : "", h = !l && !a, _ = [
        l ? "" : a,
        l ? "" : r,
        p,
        h ? this.t("card.missing_action") : ""
      ].filter(Boolean).join(" · ") || "—";
      return d`
                <div
                  class="button-edit ${t ? "open" : ""}"
                  data-button=${e.index}
                >
                  <button
                    type="button"
                    class="button-edit-toggle"
                    aria-expanded=${t ? "true" : "false"}
                    title=${t ? this.t("card.button_collapse") : this.t("card.button_expand")}
                    ?disabled=${this._busy}
                    @click=${() => this._toggleButtonEditor(e.index)}
                  >
                    <span class="button-edit-chevron" aria-hidden="true"></span>
                    <span class="button-edit-summary">
                      <span class="button-edit-title">
                        ${this.t("card.button")} ${e.index} · ${i}
                      </span>
                      <span class="button-edit-meta">${_}</span>
                    </span>
                  </button>
                  <div class="button-edit-body">
                    <div class="button-edit-fields">
                      ${t ? d`
                            <label class="field">
                              <span>${this.t("card.label")}</span>
                              <input
                                type="text"
                                .value=${e.name}
                                ?disabled=${this._busy}
                                @input=${(R) => this._onButtonNameInput(e.index, R)}
                              />
                            </label>
                            ${l ? u : d`
                                  ${h ? d`<p
                                        class="radio-groups-hint"
                                        data-missing-action
                                      >
                                        ${this.t("card.missing_action")}
                                      </p>` : u}
                                  ${this._renderButtonActionSlots(e.index)}
                                `}
                            ${o ? d`
                                  <label class="field">
                                    <span>${this.t("card.radio_participation")}</span>
                                    <div class="select-wrap">
                                      <select
                                        .value=${n ? "radio" : "toggle"}
                                        ?disabled=${this._busy}
                                        @change=${(R) => this._patchDraft((x) => {
        const M = x.buttons.find(
          (v) => v.index === e.index
        );
        M && (M.radio_member = R.target.value === "radio");
      })}
                                      >
                                        <option value="radio">
                                          ${this.t("card.radio_member")}
                                        </option>
                                        <option value="toggle">
                                          ${this.t("card.radio_toggle")}
                                        </option>
                                      </select>
                                    </div>
                                  </label>
                                ` : u}
                          ` : u}
                    </div>
                  </div>
                </div>
              `;
    })}
          </div>
    `;
  }
  _renderStepEdit() {
    return !this._panel || !this._draft ? u : d`
      ${this._renderAppearanceFields()}
      ${this._renderButtonsFields()}
    `;
  }
  _renderStepReview() {
    return !this._draft || !this._panel ? u : d`
      <div class="review-grid">
        <div><strong>${this.t("card.profile_name")}</strong> ${this._draft.name}</div>
        <div><strong>${this.t("card.mode")}</strong> ${this.t(`mode.${this._draft.mode}`)}</div>
        <div><strong>${this.t("card.color_on")}</strong> ${this._draft.color_on}</div>
        <div><strong>${this.t("card.color_off")}</strong> ${this._draft.color_off}</div>
        <div><strong>${this.t("card.radar")}</strong> ${this._draft.radar}</div>
        <div>
          <strong>${this.t("card.buttons")}</strong>
          ${this._draft.buttons.map((e) => e.name).join(" · ")}
        </div>
        ${this._draft.mode === "cover" ? d`<div data-cover-review>
              <strong>${this.t("card.cover")}</strong>
              ${this._covers().map(
      (e) => `${e.id}: L${e.open_button}/${e.close_button} (${e.open_time_s}/${e.close_time_s}${this.t("card.cover_seconds")})`
    ).join(" · ")}
            </div>` : u}
        <div>
          <strong>${this.t("card.gang_count")}</strong> ${this._gangCount()}
        </div>
      </div>
      ${this._renderFaceplate()} ${this._renderCoverControl()}
      ${this._renderActionButtons("review")}
    `;
  }
  _renderStepTransfer() {
    if (!this._panel || !this._config)
      return u;
    const e = this._serviceYaml || this._buildServiceYaml();
    return d`
      <div class="schema-box">
        <div class="schema-title">${this.t("card.schema_title")}</div>
        <p>${this.t("card.schema_body")}</p>
        <pre class="schema-pre">{
  "schema_version": 2,
  "active_profile_id": "lighting",
  "profiles": {
    "lighting": {
      "id": "lighting",
      "name": "Lighting",
      "mode": "toggle",
      "color_on": "cyan",
      "color_off": "blue",
      "radar": "30s",
      "backlight": true,
      "backlight_brightness": 100,
      "child_lock": false,
      "selected_button": null,
      "buttons": [
        {"index": 1, "name": "L1", "action": null, "action_double": null, "radio_member": true, "role": "toggle"}
      ]
    }
  }
}</pre>
      </div>
      <div class="row actions">
        <button type="button" class="btn primary" ?disabled=${this._busy} @click=${this._export}>
          ${this.t("card.download_export")}
        </button>
      </div>
      <label class="field">
        <span>${this.t("card.import_mode")}</span>
        <div class="select-wrap">
          <select
            .value=${this._importMode}
            ?disabled=${this._busy}
            @change=${(t) => {
      this._importMode = t.target.value, this._refreshServiceYaml();
    }}
          >
            <option value="merge">${this.t("card.import_merge")}</option>
            <option value="replace">${this.t("card.import_replace")}</option>
          </select>
        </div>
      </label>
      <div class="row actions">
        <button type="button" class="btn" ?disabled=${this._busy} @click=${this._openImport}>
          ${this.t("card.choose_file")}
        </button>
        <button type="button" class="btn" ?disabled=${this._busy} @click=${this._copyServiceYaml}>
          ${this.t("card.copy_yaml")}
        </button>
      </div>
      <label class="field">
        <span>${this.t("card.service_yaml")}</span>
        <textarea class="yaml-box" readonly rows="12" .value=${e}></textarea>
      </label>
    `;
  }
  _renderWizardBody() {
    switch (this._wizardStep) {
      case "language":
        return this._renderStepLanguage();
      case "profiles":
        return this._renderStepProfiles();
      case "edit":
        return this._renderStepEdit();
      case "preview":
        return this._renderFaceplate();
      case "review":
        return this._renderStepReview();
      case "transfer":
        return this._renderStepTransfer();
      default:
        return u;
    }
  }
  render() {
    var a;
    const e = Yt(this._language);
    if (!((a = this._config) != null && a.entry_id))
      return d`<ha-card class="conx-card"><div class="pad">${this.t("card.missing_entry")}</div></ha-card>`;
    if (this._loading && !this._panel)
      return d`<ha-card class="conx-card"><div class="pad">${this.t("card.loading")}</div></ha-card>`;
    if (!this._panel || !this._draft)
      return d`<ha-card class="conx-card"><div class="pad error">${this._error || this.t("card.loading")}</div></ha-card>`;
    const t = !!this._config.compact, r = this._operateMode, i = this._menuOpen || this._automationOpen || this._infoOpen || !!this._schedulerConflict;
    return d`
      <ha-card
        dir=${e ? "rtl" : "ltr"}
        data-theme=${this._theme}
        data-operate=${r ? "true" : "false"}
        class="conx-card theme-${this._theme} editor-open ${this._menuOpen ? "menu-open" : ""} ${i ? "overlay-open" : ""} ${t ? "compact" : ""} ${r ? "operate-mode" : ""} ${this._syncPulse ? "syncing-pulse" : ""}"
      >
        <div class="atmosphere"></div>
        ${this._renderSchedulerConflictDialog()}
        ${r ? u : d`
              <div class="panel-title" data-panel-title>
                <div class="brand" dir="ltr" lang="en">ConX</div>
                <div class="title">${this._panel.panel_name || this.t("card.title")}</div>
              </div>
              <div class="header" dir="ltr" data-card-header>
                <div class="header-side">
                  <div class="badge status-${this._panel.sync_status}">
                    ${this.t("card.status")}: ${this._panel.sync_status}
                  </div>
                  <button
                    type="button"
                    class="operate-btn"
                    data-operate-toggle
                    aria-pressed="false"
                    aria-label=${this.t("card.operate")}
                    title=${this.t("card.operate_hint")}
                    ?disabled=${this._busy}
                    @click=${this._toggleOperateMode}
                  >
                    ${this.t("card.operate")}
                  </button>
                  <button
                    type="button"
                    class="menu-btn"
                    data-header-menu
                    aria-label=${this.t("card.menu")}
                    aria-expanded=${this._menuOpen ? "true" : "false"}
                    ?disabled=${this._busy}
                    @click=${() => {
      this._menuOpen = !this._menuOpen;
    }}
                  >
                    <span></span><span></span><span></span>
                  </button>
                </div>
              </div>

              <div class="status-action-bar" data-status-action-bar>
                ${this._dirty ? d`<div class="warn unsaved-draft" role="status">${this.t("card.unsaved")}</div>` : u}
                ${!this._dirty && (this._panel.sync_status === "pending" || this._panel.sync_status === "out_of_sync") ? d`<div class="notice sync-needed" role="status" data-sync-needed>
                      ${this.t("card.sync_needed")}
                    </div>` : u}
                ${this._notice ? d`<div class="notice">${this._notice}</div>` : u}
                ${this._error || this._panel.last_error ? d`<div class="error">${this._error || this._panel.last_error}</div>` : u}
                ${this._renderActionButtons("top")}
              </div>
            `}

        ${this._renderMainEditor()}
        ${this._menuOpen ? this._renderSettingsMenu() : u}
        ${this._automationOpen ? this._renderAutomationExample() : u}
        ${this._infoOpen ? this._renderInfoGuide() : u}
      </ha-card>
    `;
  }
  _renderSettingsMenu() {
    const e = this._operateMode;
    return d`
      <div
        class="conx-layer"
        @click=${(t) => {
      t.target === t.currentTarget && (this._menuOpen = !1);
    }}
      >
        <aside class="conx-panel compact" role="dialog" aria-modal="true" data-settings-menu>
          <div class="menu-head">
            <div class="menu-title">${this.t("card.menu")}</div>
            <button
              type="button"
              class="menu-close"
              @click=${() => {
      this._menuOpen = !1;
    }}
            >
              ×
            </button>
          </div>
          ${e ? d`
                <div class="menu-section" data-operate-exit-section>
                  <div class="menu-actions">
                    <button
                      type="button"
                      class="btn primary"
                      data-operate-exit
                      ?disabled=${this._busy}
                      @click=${() => this._exitOperateMode()}
                    >
                      ${this.t("card.operate_exit")}
                    </button>
                  </div>
                </div>
              ` : u}
          <div class="menu-section">
            <span class="menu-label">${this.t("card.language")}</span>
            <div class="lang-flags" role="group" aria-label=${this.t("card.language")}>
              ${Ne.map(
      (t) => d`
                  <button
                    type="button"
                    class="lang-btn ${this._language === t.id ? "active" : ""}"
                    ?disabled=${this._busy}
                    title=${t.label}
                    @click=${() => this._setLanguage(t.id)}
                  >
                    ${this._renderFlag(t.flag)}
                    <span class="lang-code">${t.id.toUpperCase()}</span>
                  </button>
                `
    )}
            </div>
          </div>
          <div class="menu-section">
            <span class="menu-label">${this.t("card.theme")}</span>
            ${this._renderThemePicker()}
          </div>
          <div class="menu-section">
            <span class="menu-label">${this.t("card.step_transfer")}</span>
            <div class="menu-actions menu-action-grid">
              <button
                type="button"
                class="btn success"
                ?disabled=${this._busy}
                @click=${() => {
      this._menuOpen = !1, this._export();
    }}
              >
                ${this.t("card.export")}
              </button>
              <button
                type="button"
                class="btn"
                ?disabled=${this._busy}
                @click=${() => {
      this._menuOpen = !1, this._importMode = "merge", this._openImport();
    }}
              >
                ${this.t("card.import_merge")}
              </button>
              <button
                type="button"
                class="btn danger"
                ?disabled=${this._busy}
                @click=${() => {
      this._menuOpen = !1, this._importMode = "replace", this._openImport();
    }}
              >
                ${this.t("card.import_replace")}
              </button>
            </div>
          </div>
          <div class="menu-section">
            <span class="menu-label">${this.t("card.more")}</span>
            <div class="menu-actions menu-action-grid">
              <button
                type="button"
                class="btn info-menu-btn"
                data-info-menu
                @click=${() => {
      this._menuOpen = !1, this._infoOpen = !0;
    }}
              >
                ${this.t("card.info")}
              </button>
              <button
                type="button"
                class="btn automation-menu-btn"
                @click=${() => {
      this._menuOpen = !1, this._automationOpen = !0;
    }}
              >
                ${this.t("card.automation_example")}
              </button>
            </div>
          </div>
        </aside>
      </div>
    `;
  }
  _renderInfoGuide() {
    const e = [
      { title: "info.profiles_title", body: "info.profiles_body" },
      { title: "info.appearance_title", body: "info.appearance_body" },
      { title: "info.buttons_title", body: "info.buttons_body" },
      { title: "info.modes_title", body: "info.modes_body" },
      { title: "info.roles_title", body: "info.roles_body" },
      { title: "info.sync_title", body: "info.sync_body" },
      { title: "info.operate_title", body: "info.operate_body" },
      { title: "info.cover_title", body: "info.cover_body" },
      { title: "info.actions_title", body: "info.actions_body" },
      { title: "info.menu_title", body: "info.menu_body" }
    ];
    return d`
      <div
        class="conx-layer"
        @click=${(t) => {
      t.target === t.currentTarget && (this._infoOpen = !1);
    }}
      >
        <div
          class="conx-panel xwide info-panel"
          role="dialog"
          aria-modal="true"
          data-info-guide
        >
          <div class="menu-head">
            <div class="menu-title">${this.t("info.title")}</div>
            <button
              type="button"
              class="menu-close"
              data-info-close
              @click=${() => {
      this._infoOpen = !1;
    }}
            >
              ×
            </button>
          </div>
          <p class="info-intro">${this.t("info.intro")}</p>
          <div class="info-sections">
            ${e.map(
      (t) => d`
                <section class="info-section">
                  <h3 class="info-section-title">${this.t(t.title)}</h3>
                  <p class="info-section-body">${this.t(t.body)}</p>
                </section>
              `
    )}
          </div>
          <div class="automation-actions">
            <button
              type="button"
              class="btn"
              data-info-close
              @click=${() => {
      this._infoOpen = !1;
    }}
            >
              ${this.t("card.close")}
            </button>
          </div>
        </div>
      </div>
    `;
  }
  _renderAutomationExample() {
    const e = this._buildAutomationYaml();
    return d`
      <div
        class="conx-layer"
        @click=${(t) => {
      t.target === t.currentTarget && (this._automationOpen = !1);
    }}
      >
        <div class="conx-panel xwide automation-panel" role="dialog" aria-modal="true">
          <div class="menu-head">
            <div class="menu-title">${this.t("card.automation_example")}</div>
            <button
              type="button"
              class="menu-close"
              @click=${() => {
      this._automationOpen = !1;
    }}
            >
              ×
            </button>
          </div>
          <p class="automation-hint">${this.t("card.automation_example_hint")}</p>
          <pre class="automation-yaml" dir="ltr" lang="en">${e}</pre>
          <div class="automation-actions">
            <button
              type="button"
              class="btn primary"
              @click=${this._copyAutomationYaml}
            >
              ${this.t("card.copy_yaml")}
            </button>
            <button
              type="button"
              class="btn"
              @click=${() => {
      this._automationOpen = !1;
    }}
            >
              ${this.t("card.close")}
            </button>
          </div>
        </div>
      </div>
    `;
  }
  _renderMainEditor() {
    if (!this._draft || !this._panel)
      return u;
    const e = this._operateMode, t = e || this._previewOpen, r = [
      "profiles",
      "appearance",
      "buttons",
      "scheduler"
    ], i = {
      profiles: this.t("card.profiles"),
      appearance: this.t("card.editor"),
      buttons: this.t("card.buttons"),
      scheduler: this.t("card.scheduler")
    };
    return d`
      <div class="layout single-layout ${e ? "operate-layout" : ""}">
        <section
          class="hero-preview ${t ? "open" : "closed"} ${e ? "operate-hero" : ""}"
          data-hero-preview
        >
          ${e ? d`
                <header class="section-head operate-profile-only" data-operate-profile>
                  <button
                    type="button"
                    class="operate-menu-btn"
                    data-operate-menu
                    aria-label=${this.t("card.menu")}
                    aria-expanded=${this._menuOpen ? "true" : "false"}
                    ?disabled=${this._busy}
                    @click=${(a) => {
      a.stopPropagation(), this._menuOpen = !this._menuOpen;
    }}
                  >
                    <span></span><span></span><span></span>
                  </button>
                  <div class="hero-profile-name" aria-live="polite">${this._draft.name}</div>
                </header>
              ` : d`
                <header class="section-head" data-preview-chrome>
                  <div class="section-head-main">
                    <div class="section-title">${this.t("card.preview")}</div>
                  </div>
                  <div class="hero-profile-name" aria-live="polite">${this._draft.name}</div>
                  <label class="switch" title=${this.t("card.section_toggle")}>
                    <input
                      type="checkbox"
                      .checked=${this._previewOpen}
                      @change=${() => {
      this._previewOpen = !this._previewOpen;
    }}
                    />
                    <span class="slider"></span>
                  </label>
                </header>
              `}
          ${t ? d`<div class="hero-body">
                ${this._renderFaceplate()} ${this._renderCoverControl()}
              </div>` : u}
        </section>

        ${e ? u : d`
              <p class="layout-hint">${this.t("card.tabs_hint")}</p>

              <div class="settings-tabs" data-editor-chrome>
                <div class="tab-bar" role="tablist">
                  ${r.map(
      (a, o) => d`
                      <button
                        type="button"
                        class="tab-btn ${this._activeTab === a ? "active" : ""}"
                        role="tab"
                        aria-selected=${this._activeTab === a ? "true" : "false"}
                        ?disabled=${this._busy}
                        @click=${() => {
        this._activeTab = a;
      }}
                      >
                        <span class="tab-step">${this.t(`card.step_${o + 1}`)}</span>
                        <span class="tab-label">${i[a]}</span>
                      </button>
                    `
    )}
                </div>
                <div class="tab-panels">
                  <section
                    class="tab-panel ${this._activeTab === "profiles" ? "active" : ""}"
                    ?hidden=${this._activeTab !== "profiles"}
                  >
                    ${this._renderStepProfiles()}
                  </section>
                  <section
                    class="tab-panel ${this._activeTab === "appearance" ? "active" : ""}"
                    ?hidden=${this._activeTab !== "appearance"}
                  >
                    ${this._renderAppearanceFields()}
                  </section>
                  <section
                    class="tab-panel ${this._activeTab === "buttons" ? "active" : ""}"
                    ?hidden=${this._activeTab !== "buttons"}
                  >
                    ${this._renderButtonsFields()}
                  </section>
                  <section
                    class="tab-panel ${this._activeTab === "scheduler" ? "active" : ""}"
                    ?hidden=${this._activeTab !== "scheduler"}
                  >
                    ${this._renderSchedulerTab()}
                  </section>
                </div>
              </div>
            `}
      </div>
    `;
  }
  _renderActionButtons(e = "top") {
    return d`
      <div
        class="actions-dock ${e === "top" ? "actions-dock-top" : ""}"
        data-actions=${e}
      >
        <div class="actions-grid">
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
      </div>
    `;
  }
};
m.styles = At`
    :host {
      display: block;
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
      --conx-font: "Manrope", "Outfit", ui-sans-serif, sans-serif;
      --conx-display: "Cormorant Garamond", "Sora", Georgia, serif;
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
      --conx-gap: 10px;
    }


    ha-card.conx-card {
      position: relative;
      overflow: hidden;
      width: 100%;
      max-width: none;
      box-sizing: border-box;
      font-family: var(--conx-font);
      color: var(--text);
      background:
        linear-gradient(180deg, rgba(255,255,255,.08) 0%, transparent 36%),
        linear-gradient(165deg, #262b34 0%, #1a1d22 44%, #15181e 100%);
      border: 1px solid var(--border);
      box-shadow: var(--card-shadow);
      padding: 12px 14px 14px;

      /* Noir gold — elevated charcoal/slate with 3D depth */
      --bg: #1a1d22;
      --surface: #1a1d22;
      --surface-2: #242830;
      --border: rgba(255, 255, 255, 0.13);
      --text: #f0f2f5;
      --text-muted: #a8afb8;
      --accent: #d4af61;
      --accent-soft: rgba(212, 175, 97, 0.16);
      --accent-text: #1a1d22;
      --danger: #b42318;
      --unsaved-warn-text: #ff6b6b;
      --btn-bg: #2a2f38;
      --btn-text: #f0f2f5;
      --btn-border: rgba(255, 255, 255, 0.16);
      --btn-primary-bg: #d4af61;
      --btn-primary-text: #1a1d22;
      --btn-success-bg: #1f8a4c;
      --btn-success-text: #fff;
      --input-bg: #15181e;
      --input-text: #f0f2f5;
      --label: #c8ced6;
      --bevel-light: rgba(255, 255, 255, 0.14);
      --bevel-dark: rgba(0, 0, 0, 0.38);
      --atm-1: rgba(212, 175, 97, 0.12);
      --atm-2: rgba(90, 115, 150, 0.11);
      --faceplate-well: radial-gradient(ellipse at 50% 0%, #2e3440 0%, #1e232b 52%, #15191f 100%);
      --card-shadow:
        0 22px 48px rgba(0, 0, 0, 0.42),
        0 1px 0 rgba(255, 255, 255, 0.10) inset,
        inset 0 -1px 0 rgba(0, 0, 0, 0.28);

      --conx-ink: var(--text);
      --conx-steel: #8a837a;
      --conx-accent: var(--accent);
      --conx-accent-soft: var(--accent-soft);
      --conx-bevel-light: var(--bevel-light);
      --conx-bevel-dark: var(--bevel-dark);
      --conx-danger: var(--danger);
      --conx-panel-bg: var(--surface);
      --conx-field-bg: var(--input-bg);
      --conx-text-muted: var(--text-muted);
      --conx-atm-1: var(--atm-1);
      --conx-atm-2: var(--atm-2);
      --conx-card-bg: var(--bg);
      --conx-card-border: var(--border);
      --conx-card-shadow: var(--card-shadow);
    }

    ha-card.conx-card[data-theme="noir"] {
      --bg: #1a1d22;
      --surface: #1a1d22;
      --surface-2: #242830;
      --border: rgba(255, 255, 255, 0.13);
      --text: #f0f2f5;
      --text-muted: #a8afb8;
      --accent: #d4af61;
      --accent-soft: rgba(212, 175, 97, 0.16);
      --accent-text: #1a1d22;
      --danger: #b42318;
      --unsaved-warn-text: #ff6b6b;
      --btn-bg: #2a2f38;
      --btn-text: #f0f2f5;
      --btn-primary-bg: #d4af61;
      --btn-primary-text: #1a1d22;
      --btn-success-bg: #1f8a4c;
      --btn-success-text: #fff;
      --input-bg: #15181e;
      --input-text: #f0f2f5;
      --faceplate-well: radial-gradient(ellipse at 50% 0%, #2e3440 0%, #1e232b 52%, #15191f 100%);
    }

    ha-card.conx-card[data-theme="ivory"] {
      --bg: #f5f7fa;
      --surface: #f5f7fa;
      --surface-2: #ffffff;
      --border: #d0d6df;
      --text: #1a1c1f;
      --text-muted: #5c636e;
      --accent: #8a7348;
      --accent-soft: rgba(138, 115, 72, 0.12);
      --accent-text: #111318;
      --danger: #b42318;
      --unsaved-warn-text: #c62828;
      --btn-bg: #e8ecf1;
      --btn-text: #1a1c1f;
      --btn-border: #c0c6d0;
      --btn-primary-bg: #8a7348;
      --btn-primary-text: #ffffff;
      --btn-success-bg: #1f8a4c;
      --btn-success-text: #fff;
      --input-bg: #ffffff;
      --input-text: #1a1c1f;
      --label: #3d434c;
      --bevel-light: rgba(255, 255, 255, 0.8);
      --bevel-dark: rgba(0, 0, 0, 0.07);
      --atm-1: rgba(138, 115, 72, 0.07);
      --atm-2: rgba(90, 115, 150, 0.08);
      --faceplate-well: linear-gradient(180deg, #e8eaee, #dce1e8);
      --card-shadow: 0 14px 36px rgba(20, 28, 40, 0.10), 0 1px 0 rgba(255, 255, 255, 0.9) inset;
      --conx-steel: #8a9098;
      background: linear-gradient(180deg, #ffffff 0%, #f5f7fa 55%, #eef1f5 100%);
    }

    .atmosphere {
      pointer-events: none;
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse at 18% 0%, var(--conx-atm-1), transparent 44%),
        radial-gradient(ellipse at 88% 16%, var(--conx-atm-2), transparent 42%);
      opacity: 1;
    }

    .theme-picker {
      display: grid;
      gap: 8px;
      margin-top: 4px;
    }
    .theme-picker-label {
      display: none;
    }
    .theme-swatches {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .theme-swatch {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 14px 10px;
      border-radius: 14px;
      cursor: pointer;
      font: inherit;
      border: 1px solid var(--btn-border, var(--border));
      background: var(--btn-bg);
      color: var(--text-muted);
    }
    .theme-swatch:hover {
      color: var(--text);
    }
    .theme-swatch.active {
      border-color: var(--accent);
      background: var(--accent-soft);
      color: var(--text);
    }
    .theme-swatch-face {
      display: block;
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: var(--swatch);
      border: 2px solid var(--border);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    }
    .theme-swatch.active .theme-swatch-face {
      border-color: var(--swatch-accent, var(--accent));
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--swatch-accent, var(--accent)) 40%, transparent);
    }
    .theme-swatch-name {
      font-size: 0.78rem;
      font-weight: 700;
      line-height: 1.25;
      text-align: center;
    }
    .theme-swatch.active .theme-swatch-name {
      color: var(--text);
    }
    .dimmer-field input[type="range"] {
      width: 100%;
      accent-color: var(--conx-accent);
    }
    .dimmer-field.dimmed {
      opacity: 0.45;
    }
    .dimmer-field span {
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }

    .panel-title,
    .header,
    .status-action-bar,
    .warn,
    .error,
    .notice,
    .hero-preview,
    .settings-tabs,
    .actions-dock,
    .layout-hint,
    .layout {
      position: relative;
      z-index: 1;
    }

    .panel-title {
      text-align: center;
      margin: 0 0 14px;
      padding: 0 8px;
    }

    .panel-title .brand {
      font-family: var(--conx-display);
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      line-height: 1;
      color: var(--accent);
    }

    .panel-title .title {
      font-family: var(--conx-display);
      font-size: 1.35rem;
      font-weight: 600;
      margin-top: 6px;
      color: var(--text);
    }


    .single-layout {
      display: grid;
      gap: var(--conx-gap);
      grid-template-columns: 1fr;
    }
    @media (min-width: 860px) {
      .single-layout {
        grid-template-columns: 1fr 1.1fr;
      }
      .single-layout > .panel-section:nth-child(1),
      .single-layout > .panel-section:nth-child(4) {
        grid-column: 1 / -1;
      }
    }
    .export-view {
      position: relative;
      z-index: 1;
      display: grid;
      gap: 12px;
    }
    .export-toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 14px;
      border: 1px solid color-mix(in srgb, var(--conx-accent) 40%, transparent);
      background: var(--conx-accent-soft);
      box-shadow: inset 0 1px 0 var(--conx-bevel-light);
    }
    .export-title {
      font-family: var(--conx-display);
      font-weight: 700;
    }
    .back-to-editor {
      font-weight: 700;
    }

    .wizard-layout {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .wizard-steps {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .wizard-step {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 1px solid color-mix(in srgb, var(--conx-steel) 40%, transparent);
      background: var(--btn-bg);
      color: var(--btn-text);
      border-radius: 999px;
      padding: 6px 10px;
      font: inherit;
      cursor: pointer;
      transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
    }

    .wizard-step:hover {
      transform: translateY(-1px);
    }

    .wizard-step.active {
      border-color: var(--conx-accent);
      background: var(--conx-accent-soft);
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--conx-accent) 35%, transparent);
    }

    .wizard-step.done .wizard-index {
      background: var(--conx-accent);
      color: #fff;
    }

    .wizard-index {
      width: 1.4rem;
      height: 1.4rem;
      border-radius: 50%;
      display: inline-grid;
      place-items: center;
      font-size: 0.75rem;
      font-weight: 700;
      background: color-mix(in srgb, var(--conx-steel) 22%, transparent);
    }

    .wizard-label {
      font-size: 0.78rem;
      font-weight: 600;
    }

    .wizard-hint {
      margin: 0;
      opacity: 0.75;
      font-size: 0.9rem;
    }

    .wizard-body {
      animation: wizard-in 220ms ease;
    }

    @keyframes wizard-in {
      from {
        opacity: 0;
        transform: translateY(6px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .wizard-footer {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin-top: 4px;
    }

    .lang-hero {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }

    .lang-hero-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 16px 10px;
      border-radius: 16px;
      border: 1px solid color-mix(in srgb, var(--conx-steel) 35%, transparent);
      background: var(--btn-bg);
      color: var(--btn-text);
      cursor: pointer;
      font: inherit;
      transition: transform 160ms ease, border-color 160ms ease;
    }

    .lang-hero-btn:hover {
      transform: translateY(-2px);
    }

    .lang-hero-btn.active {
      border-color: var(--conx-accent);
      box-shadow: 0 8px 18px color-mix(in srgb, var(--conx-accent) 18%, transparent);
    }

    .lang-hero-code {
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    .lang-hero-name {
      font-size: 0.85rem;
      opacity: 0.8;
    }

    .review-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px 12px;
      margin-bottom: 12px;
      font-size: 0.92rem;
    }

    .schema-box {
      border: 1px solid color-mix(in srgb, var(--conx-steel) 35%, transparent);
      border-radius: 14px;
      padding: 12px;
      background: color-mix(in srgb, #fff 66%, transparent);
      margin-bottom: 12px;
    }

    .schema-title {
      font-weight: 700;
      margin-bottom: 4px;
    }

    .schema-pre,
    .yaml-box {
      width: 100%;
      box-sizing: border-box;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 0.72rem;
      line-height: 1.35;
      border-radius: 10px;
      border: 1px solid color-mix(in srgb, var(--conx-steel) 35%, transparent);
      background: color-mix(in srgb, #0b1218 4%, #fff);
      padding: 10px;
      overflow: auto;
      white-space: pre;
    }

    .yaml-box {
      resize: vertical;
      min-height: 160px;
    }

    @media (max-width: 640px) {
      .lang-hero {
        grid-template-columns: 1fr;
      }

      .review-grid {
        grid-template-columns: 1fr;
      }

      .wizard-label {
        display: none;
      }
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

    @media (max-width: 520px) {
      .panel-title .brand {
        font-size: 1.5rem;
      }
      .panel-title .title {
        font-size: 1.2rem;
      }
    }

    .header-side {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
    }

    .lang-flags {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 6px;
    }

    .lang-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      width: 100%;
      min-height: 36px;
      padding: 6px 4px;
      border-radius: 10px;
      border: 1px solid var(--btn-border, var(--border));
      background: var(--btn-bg);
      box-shadow:
        inset 0 1px 0 var(--bevel-light, var(--conx-bevel-light)),
        0 1px 3px rgba(0, 0, 0, 0.14);
      cursor: pointer;
      color: var(--btn-text, inherit);
      font: inherit;
      box-sizing: border-box;
    }

    .lang-btn.active {
      border-color: var(--accent);
      background: var(--accent-soft);
      color: var(--text);
      box-shadow:
        inset 0 1px 0 var(--bevel-light, var(--conx-bevel-light)),
        0 0 0 1px color-mix(in srgb, var(--accent) 28%, transparent);
    }

    .lang-code {
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.06em;
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

    /* Unsaved-draft banner only — centered, bold, larger red for clarity */
    .warn.unsaved-draft {
      text-align: center;
      font-weight: 700;
      font-size: 1.2rem;
      line-height: 1.35;
      letter-spacing: 0.01em;
      color: var(--unsaved-warn-text, #ff5252);
      background: color-mix(in srgb, var(--unsaved-warn-text, #ff5252) 16%, transparent);
      border-color: color-mix(in srgb, var(--unsaved-warn-text, #ff5252) 40%, transparent);
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
      background: var(--conx-panel-bg);
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

    /* Shared toggle pattern: physical LTR thumb travel, balanced proportions. */
    .switch {
      --switch-w: 44px;
      --switch-h: 26px;
      --switch-thumb: 22px;
      --switch-pad: 2px;
      position: relative;
      display: inline-block;
      width: var(--switch-w);
      height: var(--switch-h);
      flex-shrink: 0;
      vertical-align: middle;
    }

    .switch input {
      position: absolute;
      opacity: 0;
      inset: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      cursor: pointer;
      z-index: 1;
    }

    .slider {
      position: absolute;
      inset: 0;
      border-radius: 999px;
      background: color-mix(in srgb, var(--conx-steel) 42%, #d5dde5);
      box-shadow: inset 0 1px 2px color-mix(in srgb, #0b1218 22%, transparent);
      transition: background 180ms ease, box-shadow 180ms ease;
      pointer-events: none;
    }

    .slider::before {
      content: "";
      position: absolute;
      width: var(--switch-thumb);
      height: var(--switch-thumb);
      top: 50%;
      left: var(--switch-pad);
      border-radius: 50%;
      background: linear-gradient(180deg, #fff 0%, #e8eef3 100%);
      box-shadow:
        0 1px 3px color-mix(in srgb, #0b1218 28%, transparent),
        inset 0 1px 0 #fff;
      transform: translateY(-50%);
      transition: left 180ms ease, background 180ms ease;
    }

    .switch input:checked + .slider {
      background: color-mix(in srgb, var(--conx-accent) 82%, #6aa8b6);
      box-shadow: inset 0 1px 2px color-mix(in srgb, #0b1218 18%, transparent);
    }

    .switch input:checked + .slider::before {
      left: calc(100% - var(--switch-thumb) - var(--switch-pad));
    }

    .switch input:focus-visible + .slider {
      outline: 2px solid color-mix(in srgb, var(--conx-accent) 55%, transparent);
      outline-offset: 2px;
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
      gap: 3px;
      margin-bottom: 6px;
      font-size: 0.86rem;
    }

    .field > span {
      font-weight: 500;
      opacity: 0.85;
    }

    input[type="text"],
    input[type="number"],
    select,
    textarea.yaml-box {
      font: inherit;
      color: var(--input-text);
      background: var(--input-bg);
      border: 1px solid var(--border);
      border-radius: 11px;
      padding: 9px 11px;
      box-shadow:
        inset 0 1px 0 var(--conx-bevel-light),
        inset 0 -1px 0 color-mix(in srgb, #0b1218 6%, transparent);
    }

    input[type="text"],
    select,
    textarea.yaml-box {
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }

    /* Compact numerics: values like 20 / 0.5 should not smear full-width. */
    input[type="number"] {
      width: 7.5ch;
      min-width: 4.75rem;
      max-width: 9rem;
      box-sizing: content-box;
      -moz-appearance: textfield;
      appearance: textfield;
    }
    input[type="number"]::-webkit-outer-spin-button,
    input[type="number"]::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    input[type="text"]:focus,
    input[type="number"]:focus,
    select:focus {
      outline: none;
      border-color: color-mix(in srgb, var(--conx-accent) 55%, transparent);
      box-shadow:
        inset 0 1px 0 var(--conx-bevel-light),
        0 0 0 2px var(--conx-accent-soft);
    }

    .select-wrap {
      position: relative;
      max-width: 22rem;
    }
    .select-wrap-wide {
      max-width: 100%;
    }
    .field-hint {
      font-size: 0.78rem;
      opacity: 0.7;
      line-height: 1.35;
    }
    .field-error {
      font-size: 0.78rem;
      color: var(--error-color, #c62828);
      line-height: 1.35;
    }
    .action-data-field {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }
    .action-data-toggle {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      width: fit-content;
      max-width: 100%;
      margin: 0;
      padding: 2px 0;
      border: 0;
      background: transparent;
      color: var(--text);
      font: inherit;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      text-align: start;
    }
    .action-data-toggle:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .action-data-chevron {
      display: inline-block;
      width: 0.45em;
      height: 0.45em;
      border-inline-end: 2px solid currentColor;
      border-bottom: 2px solid currentColor;
      transform: rotate(-45deg);
      transition: transform 0.15s ease;
      flex: 0 0 auto;
    }
    .action-data-toggle[aria-expanded="true"] .action-data-chevron {
      transform: rotate(45deg);
    }
    .multi-click-hint {
      margin: 0.35rem 0 0.15rem;
      opacity: 0.85;
      font-size: 0.78rem;
      line-height: 1.35;
    }
    .action-slots-accordion {
      display: flex;
      flex-direction: column;
      gap: 8px;
      grid-column: 1 / -1;
      min-width: 0;
    }
    .action-edit {
      border-radius: 12px;
      border: 1px solid var(--border);
      background: var(--surface-2);
      color: var(--text);
      overflow: hidden;
    }
    .action-edit-toggle {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 12px;
      border: 0;
      background: transparent;
      color: var(--text);
      font: inherit;
      cursor: pointer;
      text-align: start;
    }
    .action-edit-toggle:hover:not(:disabled) {
      background: color-mix(in srgb, var(--conx-accent) 6%, transparent);
    }
    .action-edit-toggle:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
    .action-edit.open > .action-edit-toggle .button-edit-chevron {
      transform: rotate(45deg);
    }
    :host([dir="rtl"]) .action-edit.open > .action-edit-toggle .button-edit-chevron,
    ha-card[dir="rtl"] .action-edit.open > .action-edit-toggle .button-edit-chevron {
      transform: rotate(-45deg);
    }
    .action-edit-body {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 200ms ease;
    }
    .action-edit.open .action-edit-body {
      grid-template-rows: 1fr;
    }
    .action-edit-fields {
      min-height: 0;
      overflow: hidden;
      padding: 0 12px;
      border-top: 0 solid var(--border);
      opacity: 0;
      transition:
        opacity 160ms ease,
        padding 200ms ease,
        border-top-width 200ms ease;
    }
    .action-edit.open .action-edit-fields {
      padding: 0 12px 12px;
      border-top: 1px solid var(--border);
      opacity: 1;
    }
    .action-edit.open .action-edit-fields .field:first-child {
      margin-top: 10px;
    }
    .action-edit .action-slot {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .action-slot[data-action-slot="double"] {
      padding-inline-start: 0;
    }
    .action-data-editor {
      margin: 0;
    }
    textarea.action-data-box {
      width: 100%;
      min-height: 5.5rem;
      resize: vertical;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid color-mix(in srgb, var(--line) 80%, transparent);
      background: color-mix(in srgb, var(--surface) 92%, #000 4%);
      color: var(--text);
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 0.78rem;
      line-height: 1.4;
      box-sizing: border-box;
    }
    textarea.action-data-box:focus {
      outline: none;
      border-color: color-mix(in srgb, var(--conx-accent) 55%, transparent);
      box-shadow: 0 0 0 2px var(--conx-accent-soft);
    }
    ha-entity-picker,
    ha-service-picker {
      display: block;
      width: 100%;
      --mdc-theme-primary: var(--conx-accent, #d4af61);
    }
    .picker-filter {
      width: 100%;
      min-height: 28px;
      margin-bottom: 4px;
      padding: 4px 8px;
      border-radius: 8px;
      border: 1px solid color-mix(in srgb, var(--line) 80%, transparent);
      background: color-mix(in srgb, var(--surface) 88%, transparent);
      color: var(--text);
      font: inherit;
      font-size: 0.78rem;
    }

    .field-inline {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px 12px;
    }
    .field-inline > span {
      min-width: 0;
      flex: 1 1 8rem;
    }
    .field-inline input[type="number"],
    .field-inline .select-wrap {
      flex: 0 0 auto;
    }

    .cover-times {
      display: flex;
      flex-wrap: wrap;
      gap: 10px 16px;
      margin-bottom: 10px;
    }
    .cover-times .field {
      flex: 0 1 auto;
      margin-bottom: 0;
      min-width: 0;
    }
    .cover-times-compact {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
      gap: 6px 10px;
      margin-bottom: 0;
      width: 100%;
      align-items: start;
    }
    .cover-times-compact .field {
      margin-bottom: 0;
      gap: 2px;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .cover-times-compact .field > span {
      font-size: 0.62rem;
      color: var(--text-muted);
      line-height: 1.15;
    }
    .cover-times-compact input[type="number"],
    .cover-times-compact select {
      min-height: 24px;
      padding: 2px 4px;
      font-size: 0.72rem;
      width: 100%;
      max-width: none;
      box-sizing: border-box;
    }
    .cover-times-compact .field-compact-select .select-wrap {
      max-width: none;
      width: 100%;
    }
    .cover-section .cover-times-compact {
      margin-bottom: 4px;
    }
    .cover-section .radio-groups-hint {
      margin: 0 0 6px;
      font-size: 0.68rem;
      line-height: 1.2;
    }
    .cover-section .cover-block {
      margin-top: 6px;
      padding-top: 6px;
    }
    .cover-section .cover-head {
      margin-bottom: 4px;
    }

    .gang-picker {
      direction: ltr;
      display: grid;
      grid-template-columns: repeat(4, minmax(2.6rem, 3.4rem));
      gap: 6px;
      width: max-content;
      max-width: 100%;
    }
    .profile-gang {
      margin: 4px 0 12px;
    }
    .profile-gang .gang-picker {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      width: 100%;
      max-width: none;
    }
    .profile-gang .gang-picker .radio-member {
      min-height: 34px;
      padding: 6px 4px;
    }
    .cover-section .gang-picker {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      width: 100%;
      max-width: none;
      margin-bottom: 2px;
    }
    .cover-section .gang-picker .radio-member {
      min-height: 34px;
      padding: 6px 4px;
    }

    .mixed-roles-section {
      display: grid;
      gap: 3px;
      margin: 0 0 6px;
      padding: 4px;
      border-radius: 8px;
      border: 1px solid var(--border, var(--conx-border, rgba(255, 255, 255, 0.12)));
      background: var(--surface);
      color: var(--text);
      container-type: inline-size;
      container-name: mixed-roles;
    }
    .mixed-roles-section > .radio-groups-hint {
      margin: 0 0 1px;
      font-size: 0.68rem;
      line-height: 1.2;
      color: var(--text-muted);
    }
    .mixed-roles-head .menu-label {
      margin-bottom: 0;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--text);
    }
    .mixed-role-card {
      display: grid;
      gap: 2px;
      padding: 3px 5px;
      border-radius: 7px;
      border: 1px solid var(--border, var(--conx-border, rgba(255, 255, 255, 0.1)));
      background: var(--surface-2);
      color: var(--text);
    }
    .mixed-role-card-main {
      display: grid;
      grid-template-columns: minmax(2.2rem, 4.2rem) minmax(0, 1fr);
      align-items: center;
      gap: 3px 6px;
      min-width: 0;
    }
    .mixed-role-card-head {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0;
      min-width: 0;
      min-height: 0;
    }
    .mixed-role-l {
      font-weight: 800;
      letter-spacing: 0.04em;
      font-size: 0.7rem;
      line-height: 1.15;
      color: var(--text);
    }
    .mixed-role-name {
      font-size: 0.65rem;
      font-weight: 600;
      line-height: 1.15;
      color: var(--text);
      opacity: 1;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .mixed-role-picker {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 2px;
      width: 100%;
      min-width: 0;
    }
    .mixed-role-picker .radio-member {
      flex: none;
      width: 100%;
      min-width: 0;
      padding: 2px 1px;
      min-height: 22px;
      border-radius: 6px;
    }
    .mixed-role-picker .radio-member-label {
      font-size: 0.58rem;
      font-weight: 650;
      text-align: center;
      line-height: 1.05;
      white-space: normal;
      overflow-wrap: anywhere;
      hyphens: auto;
    }
    .mixed-role-extras {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
      width: 100%;
    }
    .mixed-action-entity {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
      gap: 6px 10px;
      width: 100%;
    }
    .mixed-action-entity .field {
      margin: 0;
      min-width: 0;
    }
    .mixed-action-entity .field-hint {
      font-size: 0.58rem;
      line-height: 1.2;
    }
    .mixed-action-entity .picker-filter {
      min-height: 24px;
      margin-bottom: 3px;
      font-size: 0.7rem;
    }
    .mixed-pulse {
      width: max-content;
      max-width: 100%;
      margin: 0;
      gap: 3px;
    }
    .mixed-pulse span {
      font-size: 0.62rem;
      color: var(--text-muted);
    }
    .mixed-pulse input[type="number"] {
      width: 3.8rem;
      min-height: 24px;
      padding: 2px 4px;
      font-size: 0.72rem;
    }
    .mixed-cover-extras {
      width: 100%;
      display: grid;
      gap: 4px;
    }
    .mixed-cover-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
      gap: 6px 10px;
      width: 100%;
      align-items: start;
    }
    .mixed-cover-grid > .field,
    .mixed-cover-grid > .mixed-cover-slot-field {
      margin: 0;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .mixed-cover-grid > .field > span,
    .mixed-cover-grid > .mixed-cover-slot-field > span:first-child {
      font-size: 0.62rem;
      color: var(--text-muted);
      line-height: 1.15;
    }
    .mixed-cover-grid input[type="number"],
    .mixed-cover-grid select,
    .mixed-cover-grid .select-wrap,
    .mixed-cover-grid ha-entity-picker {
      width: 100%;
      max-width: none;
      box-sizing: border-box;
    }
    .mixed-cover-grid input[type="number"],
    .mixed-cover-grid select {
      min-height: 24px;
      padding: 2px 4px;
      font-size: 0.72rem;
    }
    .mixed-cover-id .select-wrap {
      min-width: 0;
    }
    .mixed-cover-slot-field .mixed-cover-slot,
    .mixed-cover-slot {
      font-size: 0.72rem;
      font-weight: 650;
      color: var(--text);
      line-height: 1.3;
      min-height: 24px;
      display: flex;
      align-items: center;
    }
    .mixed-cover-ha-entity {
      grid-column: 1 / -1;
      width: 100%;
    }
    .mixed-cover-times-on {
      margin: 0;
      font-size: 0.62rem;
      line-height: 1.15;
    }
    @container mixed-roles (max-width: 360px) {
      .mixed-role-card-main {
        grid-template-columns: 1fr;
        gap: 2px;
      }
      .mixed-role-card-head {
        flex-direction: row;
        align-items: baseline;
        gap: 5px;
      }
      .mixed-role-picker {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .mixed-cover-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    .mode-picker {
      display: flex;
      flex-wrap: wrap;
      gap: 3px;
      width: 100%;
    }
    .mode-picker .radio-member {
      flex: 1 1 calc(25% - 3px);
      min-width: 3.6rem;
      padding: 4px 3px;
      min-height: 28px;
      border-radius: 8px;
    }
    .mode-picker .radio-member-label {
      font-size: 0.68rem;
      font-weight: 800;
      white-space: normal;
      text-align: center;
      line-height: 1.1;
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
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text);
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

    .radio-groups-section {
      margin: 2px 0 8px;
      padding: 8px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: color-mix(in srgb, var(--surface-2, var(--surface)) 88%, transparent);
    }
    .radio-groups-section .menu-label {
      display: block;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 0;
    }
    .radio-groups-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      min-height: 34px;
    }
    .radio-groups-head-main {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      min-width: 0;
      flex: 1;
    }
    .radio-groups-summary {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }
    .radio-groups-section:not(.open) {
      padding-top: 8px;
      padding-bottom: 8px;
    }
    .radio-groups-hint {
      margin: 4px 0 6px;
      font-size: 0.78rem;
      color: var(--text-muted);
      line-height: 1.35;
    }
    .radio-group-card {
      padding: 6px 8px;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: var(--input-bg, var(--surface));
      margin-bottom: 6px;
    }
    .radio-group-card:last-child {
      margin-bottom: 0;
    }
    .radio-group-card.is-summary {
      border-style: dashed;
      background: color-mix(in srgb, var(--surface-2, var(--surface)) 70%, transparent);
    }
    .radio-group-title {
      font-size: 0.8rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--label, var(--text-muted));
      margin-bottom: 8px;
    }
    .radio-group-members {
      /* Physical panel order: L1 leftmost regardless of UI language RTL. */
      direction: ltr;
      display: grid;
      grid-template-columns: repeat(var(--conx-gang-count, 4), minmax(0, 1fr));
      gap: 6px;
    }
    .radio-member {
      appearance: none;
      -webkit-appearance: none;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 38px;
      padding: 9px 4px;
      border-radius: 10px;
      border: 1px solid var(--btn-border, var(--border));
      background: var(--btn-bg);
      color: var(--btn-text);
      cursor: pointer;
      font: inherit;
      user-select: none;
      transition: border-color 160ms ease, background 160ms ease, color 160ms ease;
    }
    .radio-member:hover:not(:disabled) {
      border-color: var(--accent);
    }
    .radio-member:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
    .radio-member.on {
      border-color: var(--accent);
      background: var(--accent);
      color: var(--accent-text);
      box-shadow: none;
    }
    .radio-member:disabled {
      cursor: default;
    }
    .radio-member.is-independent.on:disabled {
      opacity: 1;
    }
    .radio-member-label {
      font-size: 0.8rem;
      font-weight: 800;
      letter-spacing: 0.02em;
      line-height: 1;
    }
    .radio-groups-error {
      margin-top: 10px;
      padding: 8px 10px;
      border-radius: 10px;
      border: 1px solid var(--warn-border, var(--border));
      background: var(--warn-bg, var(--accent-soft));
      color: var(--warn-text, var(--text));
      font-size: 0.85rem;
      font-weight: 600;
    }

    .cover-section {
      margin: 2px 0 8px;
      padding: 8px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: color-mix(in srgb, var(--surface-2, var(--surface)) 88%, transparent);
    }
    .cover-block {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid color-mix(in srgb, var(--border) 80%, transparent);
    }
    .cover-block:first-of-type {
      margin-top: 6px;
      padding-top: 8px;
    }
    .cover-block-empty {
      padding: 8px;
      border: 1px dashed var(--border);
      border-radius: 10px;
      border-top: 1px dashed var(--border);
      background: color-mix(in srgb, var(--surface) 70%, transparent);
    }
    .cover-slot-status {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
    }
    .cover-add-slot {
      width: 100%;
      min-height: 44px;
      font-weight: 800;
    }
    .cover-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 8px;
    }
    .cover-section .menu-label {
      display: block;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-muted);
    }
    .cover-control-block + .cover-control-block {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid color-mix(in srgb, var(--border) 80%, transparent);
    }
    .cover-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin-bottom: 10px;
    }
    .cover-field {
      padding: 10px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: var(--input-bg, var(--surface));
    }
    .cover-label {
      display: block;
      margin-bottom: 8px;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-muted);
    }
    .cover-buttons {
      /* Physical panel order: L1 leftmost regardless of UI language RTL. */
      direction: ltr;
      display: grid;
      grid-template-columns: repeat(var(--conx-gang-count, 4), minmax(0, 1fr));
      gap: 8px;
      width: 100%;
    }
    .cover-buttons .radio-member {
      min-height: 42px;
      padding: 10px 4px;
    }
    .cover-buttons .radio-member-label {
      font-size: 0.85rem;
    }
    .cover-safety {
      margin: 10px 0 0;
      font-size: 0.8rem;
      line-height: 1.45;
      color: var(--text-muted);
    }
    .cover-control {
      margin-top: 12px;
      padding: 12px;
      border-radius: 14px;
      border: 1px solid var(--border);
      background: color-mix(in srgb, var(--surface-2, var(--surface)) 88%, transparent);
    }
    .cover-control-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 10px;
    }
    .cover-state {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-muted);
    }
    .cover-state-open,
    .cover-state-close {
      color: var(--accent);
    }
    .cover-control-row {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }

    @media (max-width: 520px) {
      .cover-grid {
        grid-template-columns: 1fr;
      }
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
      color: var(--btn-text);
      cursor: pointer;
      border-radius: 999px;
      border: 1px solid var(--btn-border, var(--border));
      background: var(--btn-bg);
      padding: 6px 10px;
      font-weight: 700;
      font-size: 0.88rem;
      min-height: 34px;
      box-shadow:
        inset 0 1px 0 var(--bevel-light),
        0 2px 6px rgba(0, 0, 0, 0.18);
      transition: filter 120ms ease;
    }

    .btn:hover:not(:disabled) {
      filter: brightness(1.06);
    }

    .btn:active:not(:disabled) {
      filter: brightness(0.98);
    }

    .btn.primary {
      background: var(--btn-primary-bg);
      color: var(--btn-primary-text);
      border-color: var(--btn-primary-bg);
      font-weight: 700;
    }

    .btn.danger {
      color: #ffffff;
      background: var(--danger);
      border-color: var(--danger);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      filter: none;
    }

    .buttons-accordion {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .button-edit {
      border-radius: 12px;
      border: 1px solid var(--border);
      background: var(--surface-2);
      color: var(--text);
      overflow: hidden;
    }

    .button-edit-toggle {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 12px;
      border: 0;
      background: transparent;
      color: var(--text);
      font: inherit;
      cursor: pointer;
      text-align: start;
    }

    .button-edit-toggle:hover:not(:disabled) {
      background: color-mix(in srgb, var(--conx-accent) 6%, transparent);
    }

    .button-edit-toggle:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .button-edit-chevron {
      width: 8px;
      height: 8px;
      border-inline-end: 2px solid color-mix(in srgb, var(--conx-ink) 45%, transparent);
      border-bottom: 2px solid color-mix(in srgb, var(--conx-ink) 45%, transparent);
      transform: rotate(-45deg);
      transition: transform 180ms ease;
      flex-shrink: 0;
      margin-inline-start: 2px;
    }

    :host([dir="rtl"]) .button-edit-chevron,
    ha-card[dir="rtl"] .button-edit-chevron {
      transform: rotate(45deg);
    }

    .button-edit.open > .button-edit-toggle .button-edit-chevron {
      transform: rotate(45deg);
    }

    :host([dir="rtl"]) .button-edit.open > .button-edit-toggle .button-edit-chevron,
    ha-card[dir="rtl"] .button-edit.open > .button-edit-toggle .button-edit-chevron {
      transform: rotate(-45deg);
    }

    .button-edit-summary {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      flex: 1;
    }

    .button-edit-title {
      font-weight: 600;
      line-height: 1.2;
    }

    .button-edit-meta {
      font-size: 0.78rem;
      opacity: 0.62;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .button-edit-body {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 200ms ease;
    }

    .button-edit.open .button-edit-body {
      grid-template-rows: 1fr;
    }

    .button-edit-fields {
      overflow: hidden;
      padding: 0 12px;
    }

    .button-edit.open .button-edit-fields {
      padding: 0 12px 12px;
      border-top: 1px solid color-mix(in srgb, var(--conx-steel) 22%, transparent);
    }

    .button-edit.open .button-edit-fields .field:first-child {
      margin-top: 10px;
    }

    .button-edit .field:last-child {
      margin-bottom: 0;
    }

    /* Product-photo faceplate: fill ha-card width; keep 4-gang landscape proportions. */
    .faceplate {
      width: 100%;
      max-width: 100%;
      container-type: inline-size;
      container-name: faceplate;
    }

    .faceplate-bezel {
      position: relative;
      width: 100%;
      max-width: none;
      min-width: 0;
      margin: 0;
      aspect-ratio: calc(0.66 * 4) / 1;
      border-radius: 22px;
      padding: 7px;
      box-sizing: border-box;
      background: linear-gradient(145deg, #f2f0ea 0%, #b8b0a4 36%, #ebe6dc 62%, #8a8378 100%);
      box-shadow:
        inset 0 1px 1px #fff,
        inset 0 -1px 2px rgba(0, 0, 0, 0.35),
        0 16px 36px rgba(0, 0, 0, 0.35);
    }

    .operate-menu-btn {
      position: absolute;
      inset-inline-start: 0;
      top: 50%;
      transform: translateY(-50%);
      z-index: 2;
      /* Sized to title line-height (display clamp × 1.15). */
      width: calc(1.15 * clamp(1.05rem, 2.8vw, 1.45rem) + 4px);
      height: calc(1.15 * clamp(1.05rem, 2.8vw, 1.45rem) + 4px);
      border-radius: 8px;
      border: 1px solid color-mix(in srgb, var(--accent, #d4af61) 35%, transparent);
      background: color-mix(in srgb, var(--card-background-color, #1a1d22) 72%, transparent);
      color: var(--primary-text-color, #f0f2f5);
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.12) inset;
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      cursor: pointer;
      padding: 0;
      margin: 0;
      box-sizing: border-box;
    }
    .operate-menu-btn:hover {
      border-color: var(--accent);
      color: var(--accent);
    }
    .operate-menu-btn span {
      display: block;
      width: 52%;
      height: 1.5px;
      border-radius: 1px;
      background: currentColor;
    }
    ha-card.conx-card[data-theme="ivory"] .operate-menu-btn {
      background: rgba(255, 255, 255, 0.72);
      color: #4a4338;
      border-color: rgba(138, 115, 72, 0.35);
    }

    .faceplate-skin {
      position: absolute;
      inset: 7px;
      border-radius: 16px;
      background-image: var(--conx-faceplate-skin, none);
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
      border-radius: 16px;
      overflow: hidden;
      display: grid;
      /* Label bar ~28%: room for HE names; rings stay in the light body only. */
      grid-template-rows: 28% 72%;
      background: #fff;
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
    }

    .faceplate-labels {
      position: relative;
      display: grid;
      grid-template-columns: repeat(var(--conx-gang-count, 4), 1fr);
      align-items: center;
      background: linear-gradient(180deg, #2a3038 0%, #1a1d22 100%);
      color: #f0f2f5;
      padding: 0 6px;
      min-height: 0;
      z-index: 2;
    }

    .faceplate-label {
      text-align: center;
      font-size: clamp(0.7rem, 4.2cqw, 1.05rem);
      font-weight: 600;
      line-height: 1.15;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding: 0 4px;
      font-family: var(--conx-font);
    }

    .faceplate-touch {
      display: flex;
      align-items: center;
      justify-content: stretch;
      background: linear-gradient(180deg, #ffffff 0%, #f7f5f1 70%, #efebe4 100%);
      /* Top pad clears the label bar; bottom bias keeps rings in the lower body. */
      padding: 10% 3% 14%;
      min-height: 0;
      overflow: hidden;
      box-sizing: border-box;
    }

    .faceplate-rings {
      display: grid;
      grid-template-columns: repeat(var(--conx-gang-count, 4), 1fr);
      width: 100%;
      place-items: center;
      align-content: center;
    }

    .faceplate-scheduler-next {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: center;
      gap: 0.35rem 0.55rem;
      margin-top: 0.45rem;
      padding: 0.35rem 0.55rem;
      font-size: 0.78rem;
      line-height: 1.25;
      color: var(--secondary-text-color, #8b93a7);
      text-align: center;
    }

    .faceplate-unavailable {
      margin-top: 0.45rem;
      padding: 0.4rem 0.65rem;
      font-size: 0.88rem;
      font-weight: 700;
      line-height: 1.3;
      letter-spacing: 0.01em;
      text-align: center;
      color: #ff3b3b;
      background: color-mix(in srgb, #ff3b3b 14%, transparent);
      border: 1px solid color-mix(in srgb, #ff3b3b 42%, transparent);
      border-radius: 8px;
    }

    .faceplate-scheduler-next .scheduler-next-profile,
    .faceplate-scheduler-next .scheduler-next-time {
      font-weight: 600;
      color: var(--primary-text-color, #e8ecf4);
    }

    .faceplate-scheduler-next .scheduler-next-time {
      font-variant-numeric: tabular-nums;
    }

    .faceplate-holiday-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 4;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 7px;
      color: color-mix(in srgb, var(--accent, #d4af61) 88%, #fff);
      background: rgba(26, 29, 34, 0.72);
      border: 1px solid color-mix(in srgb, var(--accent, #d4af61) 45%, transparent);
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.12) inset;
      pointer-events: none;
    }

    ha-card.conx-card[dir="rtl"] .faceplate-holiday-badge {
      right: auto;
      left: 8px;
    }

    .operate-mode .faceplate-holiday-badge {
      top: 8px;
    }

    .faceplate-holiday-badge svg {
      width: 13px;
      height: 13px;
      display: block;
    }

    ha-card.conx-card[data-theme="ivory"] .faceplate-holiday-badge {
      color: #8a7348;
      background: rgba(255, 255, 255, 0.82);
      border-color: rgba(138, 115, 72, 0.35);
    }

    .scheduler-task-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .scheduler-task-row .scheduler-enable {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .scheduler-task-row .switch-caption {
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      color: var(--secondary-text-color, #8b93a7);
      white-space: nowrap;
    }

    ha-card.conx-card[data-theme="ivory"] .faceplate-scheduler-next {
      color: #5c6578;
    }

    ha-card.conx-card[data-theme="ivory"] .faceplate-scheduler-next .scheduler-next-profile,
    ha-card.conx-card[data-theme="ivory"] .faceplate-scheduler-next .scheduler-next-time {
      color: #1e2430;
    }

    ha-card.conx-card[data-theme="ivory"] .faceplate-unavailable {
      color: #c62828;
      background: rgba(198, 40, 40, 0.1);
      border-color: rgba(198, 40, 40, 0.35);
    }

    .ring {
      width: clamp(26px, 12.5cqw, 56px);
      height: clamp(26px, 12.5cqw, 56px);
      border-radius: 50%;
      border: 3px solid
        color-mix(in srgb, var(--ring-off, var(--conx-ring-off)) 70%, #9aa7b5);
      background: transparent;
      padding: 0;
      cursor: pointer;
      position: relative;
      box-shadow:
        0 0 8px color-mix(in srgb, var(--ring-off, var(--conx-ring-off)) 40%, transparent);
      transition:
        border-color 160ms ease,
        box-shadow 160ms ease,
        transform 120ms ease;
    }

    .ring.on {
      border-color: var(--ring-on, var(--conx-ring));
      box-shadow:
        0 0 18px color-mix(in srgb, var(--ring-on, var(--conx-ring)) 75%, transparent),
        0 0 6px color-mix(in srgb, var(--ring-on, var(--conx-ring)) 90%, transparent);
    }

    .ring.pressed {
      transform: scale(0.92);
    }

    .ring-glow {
      position: absolute;
      inset: 6px;
      border-radius: 50%;
      background: color-mix(
        in srgb,
        var(--ring-off, var(--conx-ring-off)) 14%,
        transparent
      );
      pointer-events: none;
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

    .header {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      align-items: center;
      margin-bottom: 14px;
      direction: ltr;
    }
    .header-side {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
      flex-direction: row;
      direction: ltr;
    }
    .operate-btn {
      min-height: 46px;
      padding: 0 14px;
      border-radius: 14px;
      border: 1px solid var(--btn-border, var(--border));
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 55%),
        var(--btn-bg);
      color: var(--text);
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.08) inset, 0 2px 6px rgba(0, 0, 0, 0.2);
      font-family: var(--body, inherit);
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      cursor: pointer;
      white-space: nowrap;
    }
    .operate-btn:hover {
      border-color: var(--accent);
      color: var(--accent);
    }
    ha-card.conx-card[data-theme="ivory"] .operate-btn {
      background: linear-gradient(180deg, #ffffff, var(--btn-bg));
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.9) inset, 0 2px 6px rgba(20, 28, 40, 0.08);
    }
    ha-card.conx-card.operate-mode {
      padding: 8px;
      background:
        linear-gradient(180deg, rgba(255,255,255,.04) 0%, transparent 40%),
        linear-gradient(165deg, #262b34 0%, #1a1d22 44%, #15181e 100%);
    }
    ha-card.conx-card.operate-mode[data-theme="ivory"] {
      background:
        linear-gradient(180deg, rgba(255,255,255,.55) 0%, transparent 42%),
        linear-gradient(165deg, #f7f4ee 0%, #ebe6dc 48%, #e4dfd4 100%);
    }
    ha-card.conx-card.operate-mode .atmosphere {
      opacity: 0.35;
    }
    ha-card.conx-card.operate-mode .operate-layout {
      gap: 0;
      margin: 0;
    }
    ha-card.conx-card.operate-mode .hero-preview.operate-hero {
      margin: 0;
      padding: 0;
      border: 0;
      background: transparent;
      box-shadow: none;
    }
    ha-card.conx-card.operate-mode .section-head.operate-profile-only {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      gap: 0;
      padding: 4px 8px 10px;
      /* Reserve start-side room so a long title never sits under the hamburger. */
      padding-inline: calc(1.15 * clamp(1.05rem, 2.8vw, 1.45rem) + 16px) 8px;
      border-bottom: 0;
      background: transparent;
      min-height: calc(1.15 * clamp(1.05rem, 2.8vw, 1.45rem) + 8px);
    }
    ha-card.conx-card.operate-mode .section-head.operate-profile-only .hero-profile-name {
      position: static;
      left: auto;
      transform: none;
      max-width: min(90%, 320px);
      pointer-events: auto;
    }
    ha-card.conx-card.operate-mode .hero-body {
      padding: 0;
      background: transparent;
      gap: 10px;
    }
    ha-card.conx-card.operate-mode .cover-control {
      margin-top: 0;
      padding: 10px;
    }
    /*
      Operate mode shrinks the card to the faceplate. Absolute .conx-layer
      overlays are clipped to that short box and force awkward inner scroll.
      When any modal is open, inflate the card so menus/modals open full-size.
    */
    ha-card.conx-card.operate-mode.overlay-open {
      min-height: min(92dvh, 720px);
    }
    ha-card.conx-card.operate-mode.overlay-open .conx-layer {
      align-items: center;
      justify-content: center;
      padding: clamp(12px, 2.5vw, 20px);
      overflow: auto;
    }
    ha-card.conx-card.operate-mode.overlay-open .conx-panel.compact {
      width: min(440px, 100%);
      max-height: none;
      overflow: visible;
      margin: auto;
    }
    ha-card.conx-card.operate-mode.overlay-open .conx-panel.wide,
    ha-card.conx-card.operate-mode.overlay-open .conx-panel.xwide {
      width: min(100%, 680px);
      max-height: calc(100% - 24px);
      overflow: hidden;
      margin: auto;
    }
    ha-card.conx-card.operate-mode.overlay-open .info-panel {
      display: flex;
      flex-direction: column;
    }
    ha-card.conx-card.operate-mode.overlay-open .info-panel .info-sections {
      max-height: none;
      flex: 1 1 auto;
      min-height: 0;
      overflow: auto;
    }
    ha-card.conx-card.operate-mode.overlay-open .automation-panel {
      display: flex;
      flex-direction: column;
    }
    ha-card.conx-card.operate-mode.overlay-open .automation-panel .automation-yaml {
      max-height: none;
      flex: 1 1 auto;
      min-height: 0;
    }
    .menu-btn {
      width: 46px;
      height: 46px;
      border-radius: 14px;
      border: 1px solid var(--btn-border, var(--border));
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 55%),
        var(--btn-bg);
      color: var(--text);
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.08) inset, 0 2px 6px rgba(0, 0, 0, 0.2);
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 5px;
      cursor: pointer;
      padding: 0;
    }
    ha-card.conx-card[data-theme="ivory"] .menu-btn {
      background: linear-gradient(180deg, #ffffff, var(--btn-bg));
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.9) inset, 0 2px 6px rgba(20, 28, 40, 0.08);
    }
    .menu-btn:hover {
      border-color: var(--accent);
      color: var(--accent);
    }
    .menu-btn span {
      display: block;
      width: 18px;
      height: 2px;
      border-radius: 2px;
      background: currentColor;
    }
    .conx-layer {
      /* Absolute inside ha-card (overflow clip); preview uses viewport-fixed siblings. */
      position: absolute;
      inset: 0;
      z-index: 80;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: rgba(8, 10, 14, 0.55);
      opacity: 1;
      backdrop-filter: blur(2px);
    }
    ha-card.conx-card[data-theme="ivory"] .conx-layer {
      background: rgba(20, 28, 40, 0.42);
    }
    .conx-panel {
      width: min(400px, 100%);
      max-height: calc(100% - 32px);
      overflow: auto;
      display: flex;
      flex-direction: column;
      padding: 14px 14px 16px;
      border-radius: 18px;
      border: 1px solid var(--border);
      background: var(--surface-2, var(--surface));
      color: var(--text);
      box-shadow:
        0 22px 56px rgba(8, 10, 14, 0.48),
        inset 0 1px 0 var(--conx-bevel-light);
      animation: conx-panel-in 180ms ease;
    }
    /* Short settings menu: size to content — no inner scrollbar when it fits. */
    .conx-panel.compact {
      width: min(420px, 100%);
      max-height: none;
      overflow: visible;
    }
    @keyframes conx-panel-in {
      from {
        transform: scale(0.96) translateY(8px);
        opacity: 0.85;
      }
      to {
        transform: scale(1) translateY(0);
        opacity: 1;
      }
    }
    .conx-panel.wide { width: min(100%, 560px); }
    .conx-panel.xwide { width: min(100%, 760px); max-height: min(90%, 860px); }
    .automation-hint {
      margin: 0 0 12px;
      color: var(--text-muted);
      font-size: 0.9rem;
      line-height: 1.5;
    }
    .info-intro {
      margin: 0 0 12px;
      color: var(--text-muted);
      font-size: 0.9rem;
      line-height: 1.45;
    }
    .info-sections {
      display: grid;
      gap: 12px;
      max-height: min(58vh, 520px);
      overflow: auto;
      padding-inline-end: 4px;
    }
    .info-section {
      margin: 0;
      padding: 0;
    }
    .info-section-title {
      margin: 0 0 4px;
      font-size: 0.95rem;
      font-weight: 750;
      color: var(--text);
      line-height: 1.25;
    }
    .info-section-body {
      margin: 0;
      font-size: 0.82rem;
      line-height: 1.45;
      color: var(--text-muted);
    }
    .automation-yaml {
      margin: 0;
      max-height: 52vh;
      overflow: auto;
      padding: 12px 14px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: var(--input-bg);
      color: var(--input-text);
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 0.78rem;
      line-height: 1.5;
      white-space: pre;
      text-align: left;
      -webkit-user-select: text;
      user-select: text;
    }
    .automation-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 12px;
    }
    .automation-actions .btn { min-width: 112px; justify-content: center; }
    .menu-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 12px;
    }
    .menu-title, .export-title {
      font-family: var(--conx-display);
      font-size: 1.25rem;
      font-weight: 700;
    }
    .menu-close {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: var(--btn-bg);
      color: var(--text);
      cursor: pointer;
      font-size: 1.2rem;
      line-height: 1;
    }
    .menu-section { margin-bottom: 14px; }
    .menu-section .menu-label {
      display: block;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 8px;
    }
    .menu-actions {
      display: grid;
      gap: 8px;
    }
    .menu-action-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }
    .menu-action-grid .btn {
      display: inline-flex;
      align-items: center;
      width: 100%;
      justify-content: center;
      min-height: 38px;
      padding: 8px 10px;
      border-radius: 12px;
      box-sizing: border-box;
      white-space: normal;
      line-height: 1.25;
      text-align: center;
    }
    .menu-action-grid .btn:last-child:nth-child(odd) {
      grid-column: 1 / -1;
    }
    .hero-preview {
      border-radius: 16px;
      border: 1px solid var(--border);
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent 40%),
        var(--surface-2);
      overflow: hidden;
      margin-bottom: 10px;
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.06) inset;
    }
    ha-card.conx-card[data-theme="ivory"] .hero-preview {
      background: linear-gradient(180deg, #ffffff, var(--surface-2));
      box-shadow: none;
    }
    .hero-preview .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      position: relative;
    }
    .hero-preview .section-head-main,
    .hero-preview .section-head > .switch {
      position: relative;
      z-index: 1;
      flex: 0 1 auto;
      min-width: 0;
    }
    .hero-preview .section-title {
      font-family: var(--conx-display);
      font-size: 1.35rem;
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    .hero-profile-name {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      z-index: 0;
      text-align: center;
      font-family: var(--conx-display);
      font-weight: 600;
      font-size: clamp(1.05rem, 2.8vw, 1.45rem);
      letter-spacing: 0.01em;
      line-height: 1.15;
      color: var(--accent);
      max-width: min(46%, 280px);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      pointer-events: none;
    }
    .hero-body {
      padding: 12px 10px 14px;
      background: var(--faceplate-well);
    }
    .hero-preview.closed .hero-body {
      display: none;
    }
    .hero-preview.closed .section-head {
      border-bottom: 0;
    }
    .layout-hint {
      margin: 0 0 10px;
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .settings-tabs {
      border-radius: 16px;
      border: 1px solid var(--border);
      background: var(--surface-2);
      overflow: hidden;
    }
    .tab-bar {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0;
      border-bottom: 1px solid var(--border);
      background: color-mix(in srgb, var(--surface) 70%, var(--surface-2));
      margin-bottom: 0;
    }
    .scheduler-panel {
      display: grid;
      gap: 12px;
      padding: 4px 2px 8px;
    }
    .scheduler-transfer {
      padding: 10px;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: var(--surface);
    }
    .scheduler-transfer .menu-label {
      display: block;
      margin-bottom: 6px;
    }
    .scheduler-import-warnings {
      margin-top: 8px;
      font-size: 0.85rem;
      color: var(--muted, var(--text));
    }
    .scheduler-import-warnings ul {
      margin: 6px 0 0;
      padding-inline-start: 1.2em;
    }
    .scheduler-task-list {
      display: grid;
      gap: 8px;
    }
    .scheduler-task-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .scheduler-task-row .profile-chip {
      flex: 1;
    }
    .scheduler-editor {
      display: grid;
      gap: 12px;
      padding: 12px;
      border: 1px solid var(--border);
      border-radius: 14px;
      background:
        linear-gradient(180deg, color-mix(in srgb, var(--surface-2) 55%, transparent) 0%, transparent 42%),
        var(--surface);
      box-shadow: inset 0 1px 0 var(--bevel-light, rgba(255, 255, 255, 0.08));
    }
    .scheduler-field-block {
      display: grid;
      gap: 8px;
    }
    .scheduler-field-label {
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--label, var(--text-muted));
      line-height: 1.2;
    }
    .chip-row {
      display: grid;
      gap: 6px;
    }
    .chip-row-days {
      grid-template-columns: repeat(7, minmax(0, 1fr));
    }
    .chip-row-months {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    .chip-row-panels {
      grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
    }
    .chip {
      appearance: none;
      -webkit-appearance: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 40px;
      padding: 8px 6px;
      border-radius: 10px;
      border: 1px solid var(--btn-border, var(--border));
      background: color-mix(in srgb, var(--btn-bg, var(--surface-2)) 88%, #000);
      color: var(--text-muted);
      cursor: pointer;
      font: inherit;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.01em;
      line-height: 1.1;
      text-align: center;
      user-select: none;
      transition:
        border-color 160ms ease,
        background 160ms ease,
        color 160ms ease,
        box-shadow 160ms ease,
        transform 120ms ease;
    }
    .chip:hover:not(.active) {
      border-color: color-mix(in srgb, var(--accent) 55%, var(--btn-border, var(--border)));
      color: var(--text);
      background: color-mix(in srgb, var(--btn-bg, var(--surface-2)) 70%, var(--accent-soft));
    }
    .chip:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
    .chip.active {
      border-color: var(--accent);
      background: var(--accent);
      color: var(--accent-text);
      font-weight: 800;
      box-shadow:
        0 1px 0 rgba(255, 255, 255, 0.22) inset,
        0 2px 10px color-mix(in srgb, var(--accent) 28%, transparent);
    }
    .chip.active:hover {
      border-color: var(--accent);
      background: color-mix(in srgb, var(--accent) 88%, #fff);
      color: var(--accent-text);
    }
    .scheduler-ranges,
    .scheduler-conditions {
      display: grid;
      gap: 8px;
      padding: 10px;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: color-mix(in srgb, var(--surface-2) 82%, transparent);
    }
    .scheduler-range-row,
    .scheduler-condition-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)) auto;
      gap: 8px;
      align-items: end;
      margin-bottom: 0;
      padding: 8px;
      border-radius: 10px;
      border: 1px solid color-mix(in srgb, var(--border) 85%, transparent);
      background: var(--input-bg, var(--surface));
    }
    .scheduler-ranges > .btn,
    .scheduler-conditions > .btn {
      justify-self: start;
    }
    @media (max-width: 420px) {
      .chip-row-months {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .chip {
        min-height: 38px;
        font-size: 0.74rem;
        padding: 7px 4px;
      }
    }
    .master-badge {
      display: inline-block;
      margin-inline-end: 0.35rem;
      padding: 0.05rem 0.35rem;
      border-radius: 0.25rem;
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      background: color-mix(in srgb, var(--accent) 22%, transparent);
      color: var(--accent);
    }
    .switch-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .conflict-detail {
      white-space: pre-wrap;
      font-size: 0.82rem;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px;
      margin: 0 0 12px;
    }
    .notice.subtle {
      margin: 0;
      opacity: 0.85;
    }
    .tab-btn {
      appearance: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1px;
      border: 0;
      border-radius: 0;
      border-bottom: 2px solid transparent;
      background: transparent;
      color: var(--text-muted);
      font: inherit;
      font-weight: 700;
      min-height: 42px;
      padding: 6px 6px;
      cursor: pointer;
      transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
    }
    .tab-btn:hover {
      color: var(--text);
      background: var(--accent-soft);
    }
    .tab-btn.active {
      color: var(--text);
      border-bottom-color: var(--accent);
      background: color-mix(in srgb, var(--accent-soft) 55%, transparent);
    }
    .tab-step {
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--accent);
    }
    .tab-btn:not(.active) .tab-step {
      color: var(--text-muted);
      opacity: 0.8;
    }
    .tab-label {
      font-family: var(--conx-display);
      font-size: 1.05rem;
      font-weight: 600;
    }
    .tab-panels {
      padding: 0;
    }
    .tab-panel {
      display: none;
      padding: 16px;
    }
    .tab-panel.active {
      display: block;
    }
    .profile-list {
      display: grid !important;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      margin-bottom: 10px;
    }
    .profile-name-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 10px;
    }
    .profile-name-row .field { margin-bottom: 0; }
    .profile-actions {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }
    .profile-actions .btn {
      width: 100%;
      min-height: 50px;
      justify-content: center;
    }
    .status-action-bar {
      position: sticky;
      top: 0;
      z-index: 5;
      display: grid;
      gap: 6px;
      margin: 0 0 8px;
      padding: 0 0 2px;
      background: linear-gradient(
        to bottom,
        var(--card-background-color, var(--ha-card-background, var(--surface, #12141a))) 70%,
        transparent
      );
    }
    .actions-dock { margin-top: 0; }
    .actions-dock-top {
      border-radius: 12px;
      border: 1px solid var(--border, var(--divider-color, #333));
      background: var(--surface-2, color-mix(in srgb, var(--card-background-color, #1a1d24) 92%, #000));
      padding: 6px;
    }
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 6px;
      margin: 0;
    }
    .actions-grid .btn {
      width: 100%;
      justify-content: center;
      min-height: 32px;
      padding: 5px 8px;
      font-size: 0.82rem;
    }
    @media (max-width: 720px) {
      .actions-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    .btn.success {
      background: var(--btn-success-bg, #1f8a4c);
      color: var(--btn-success-text, #fff);
      border-color: var(--btn-success-bg, #1f8a4c);
    }
    .export-hint {
      margin: 0 0 12px;
      color: var(--text-muted);
      font-size: 0.9rem;
    }
    .export-actions {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      margin-bottom: 12px;
    }
    .export-footer { margin-top: 12px; }
    .dimmer-label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      min-height: 28px;
    }
    .dimmer-pct {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 3.4em;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.92rem;
      font-weight: 800;
      letter-spacing: 0.02em;
      color: var(--accent-text);
      background: var(--accent);
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.18) inset, 0 2px 8px rgba(0, 0, 0, 0.22);
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
    }
    .dimmer-field input[type="range"] {
      width: 100%;
      height: 44px;
      accent-color: var(--accent);
    }
    .single-layout {
      display: grid !important;
      gap: var(--conx-gap);
      grid-template-columns: 1fr !important;
    }
    @media (max-width: 520px) {
      .profile-list { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
      .profile-name-row, .export-actions, .actions-grid { grid-template-columns: 1fr; }
      .tab-label { font-size: 0.95rem; }
    }
  `;
f([
  Ie({ attribute: !1, hasChanged: () => !0 })
], m.prototype, "hass", 2);
f([
  g()
], m.prototype, "_config", 2);
f([
  g()
], m.prototype, "_panel", 2);
f([
  g()
], m.prototype, "_draft", 2);
f([
  g()
], m.prototype, "_saved", 2);
f([
  g()
], m.prototype, "_error", 2);
f([
  g()
], m.prototype, "_notice", 2);
f([
  g()
], m.prototype, "_loading", 2);
f([
  g()
], m.prototype, "_busy", 2);
f([
  g()
], m.prototype, "_syncPulse", 2);
f([
  g()
], m.prototype, "_pressedRing", 2);
f([
  g()
], m.prototype, "_splitPreviewOn", 2);
f([
  g()
], m.prototype, "_runtimeRelayStates", 2);
f([
  g()
], m.prototype, "_radioPreviewSelected", 2);
f([
  g()
], m.prototype, "_uiLang", 2);
f([
  g()
], m.prototype, "_theme", 2);
f([
  g()
], m.prototype, "_operateMode", 2);
f([
  g()
], m.prototype, "_wizardStep", 2);
f([
  g()
], m.prototype, "_importMode", 2);
f([
  g()
], m.prototype, "_schedulerImportMode", 2);
f([
  g()
], m.prototype, "_schedulerImportWarnings", 2);
f([
  g()
], m.prototype, "_serviceYaml", 2);
f([
  g()
], m.prototype, "_sections", 2);
f([
  g()
], m.prototype, "_expandedButtons", 2);
f([
  g()
], m.prototype, "_activeTab", 2);
f([
  g()
], m.prototype, "_schedulerDraft", 2);
f([
  g()
], m.prototype, "_schedulerConflict", 2);
f([
  g()
], m.prototype, "_menuOpen", 2);
f([
  g()
], m.prototype, "_automationOpen", 2);
f([
  g()
], m.prototype, "_infoOpen", 2);
f([
  g()
], m.prototype, "_previewOpen", 2);
f([
  g()
], m.prototype, "_panelNameDraft", 2);
f([
  g()
], m.prototype, "_radioGroupsOpen", 2);
f([
  g()
], m.prototype, "_haEntityPickerReady", 2);
f([
  g()
], m.prototype, "_haServicePickerReady", 2);
f([
  g()
], m.prototype, "_pickerFilter", 2);
f([
  g()
], m.prototype, "_actionDataOpen", 2);
f([
  g()
], m.prototype, "_actionDataText", 2);
f([
  g()
], m.prototype, "_actionDataError", 2);
f([
  g()
], m.prototype, "_actionDataAutoDefault", 2);
f([
  g()
], m.prototype, "_actionSlotOpen", 2);
m = f([
  Dt("conx-dynamic-panel-card")
], m);
var Li = Object.defineProperty, Ni = Object.getOwnPropertyDescriptor, Ye = (e, t, r, i) => {
  for (var a = i > 1 ? void 0 : i ? Ni(t, r) : t, o = e.length - 1, n; o >= 0; o--)
    (n = e[o]) && (a = (i ? n(t, r, a) : n(a)) || a);
  return i && a && Li(t, r, a), a;
};
let le = class extends Y {
  setConfig(e) {
    this._config = e;
  }
  get _language() {
    var e, t, r, i;
    return ((e = this._config) == null ? void 0 : e.language) || ((r = (t = this.hass) == null ? void 0 : t.locale) == null ? void 0 : r.language) || ((i = this.hass) == null ? void 0 : i.language) || "en";
  }
  _valueChanged(e) {
    if (!this._config)
      return;
    const t = { ...this._config, ...e };
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
      return d``;
    const e = Yt(this._language);
    return d`
      <div class="editor" dir=${e ? "rtl" : "ltr"}>
        <label>
          ${P(this._language, "editor.entry_id")}
          <input
            .value=${this._config.entry_id || ""}
            @input=${(t) => this._valueChanged({
      entry_id: t.target.value.trim()
    })}
          />
        </label>
        <label>
          ${P(this._language, "card.language")}
          <select
            .value=${ce(this._config.language || this._language)}
            @change=${(t) => this._valueChanged({
      language: t.target.value
    })}
          >
            ${Ne.map(
      (t) => d`<option value=${t.id}>${t.label}</option>`
    )}
          </select>
        </label>
        <label>
          ${P(this._language, "card.theme")}
          <select
            .value=${xe(this._config.theme)}
            @change=${(t) => this._valueChanged({
      theme: t.target.value
    })}
          >
            ${We.map(
      (t) => d`<option value=${t.id}>
                ${P(this._language, `theme.${t.id}`)}
              </option>`
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
          ${P(this._language, "card.compact")}
        </label>
      </div>
    `;
  }
};
le.styles = At`
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
Ye([
  Ie({ attribute: !1 })
], le.prototype, "hass", 2);
Ye([
  g()
], le.prototype, "_config", 2);
le = Ye([
  Dt("conx-dynamic-panel-card-editor")
], le);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "conx-dynamic-panel-card",
  name: "ConX Dynamic Panel Card",
  description: "Private ConX card for multi-profile smart panels",
  preview: !0
});
//# sourceMappingURL=conx-dynamic-panel-card.js.map
