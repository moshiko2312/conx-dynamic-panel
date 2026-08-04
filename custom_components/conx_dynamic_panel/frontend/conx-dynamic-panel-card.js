/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const V = globalThis, ht = V.ShadowRoot && (V.ShadyCSS === void 0 || V.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, ut = Symbol(), xt = /* @__PURE__ */ new WeakMap();
let Bt = class {
  constructor(t, r, i) {
    if (this._$cssResult$ = !0, i !== ut) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = r;
  }
  get styleSheet() {
    let t = this.o;
    const r = this.t;
    if (ht && t === void 0) {
      const i = r !== void 0 && r.length === 1;
      i && (t = xt.get(r)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && xt.set(r, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const te = (e) => new Bt(typeof e == "string" ? e : e + "", void 0, ut), It = (e, ...t) => {
  const r = e.length === 1 ? e[0] : t.reduce((i, a, s) => i + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(a) + e[s + 1], e[0]);
  return new Bt(r, e, ut);
}, ee = (e, t) => {
  if (ht) e.adoptedStyleSheets = t.map((r) => r instanceof CSSStyleSheet ? r : r.styleSheet);
  else for (const r of t) {
    const i = document.createElement("style"), a = V.litNonce;
    a !== void 0 && i.setAttribute("nonce", a), i.textContent = r.cssText, e.appendChild(i);
  }
}, yt = ht ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((t) => {
  let r = "";
  for (const i of t.cssRules) r += i.cssText;
  return te(r);
})(e) : e;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: re, defineProperty: ie, getOwnPropertyDescriptor: ae, getOwnPropertyNames: se, getOwnPropertySymbols: oe, getPrototypeOf: ne } = Object, y = globalThis, $t = y.trustedTypes, ce = $t ? $t.emptyScript : "", et = y.reactiveElementPolyfillSupport, B = (e, t) => e, q = { toAttribute(e, t) {
  switch (t) {
    case Boolean:
      e = e ? ce : null;
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
} }, _t = (e, t) => !re(e, t), wt = { attribute: !0, type: String, converter: q, reflect: !1, useDefault: !1, hasChanged: _t };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), y.litPropertyMetadata ?? (y.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let O = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, r = wt) {
    if (r.state && (r.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((r = Object.create(r)).wrapped = !0), this.elementProperties.set(t, r), !r.noAccessor) {
      const i = Symbol(), a = this.getPropertyDescriptor(t, i, r);
      a !== void 0 && ie(this.prototype, t, a);
    }
  }
  static getPropertyDescriptor(t, r, i) {
    const { get: a, set: s } = ae(this.prototype, t) ?? { get() {
      return this[r];
    }, set(o) {
      this[r] = o;
    } };
    return { get: a, set(o) {
      const n = a == null ? void 0 : a.call(this);
      s == null || s.call(this, o), this.requestUpdate(t, n, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? wt;
  }
  static _$Ei() {
    if (this.hasOwnProperty(B("elementProperties"))) return;
    const t = ne(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(B("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(B("properties"))) {
      const r = this.properties, i = [...se(r), ...oe(r)];
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
      for (const a of i) r.unshift(yt(a));
    } else t !== void 0 && r.push(yt(t));
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
    return ee(t, this.constructor.elementStyles), t;
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
    var s;
    const i = this.constructor.elementProperties.get(t), a = this.constructor._$Eu(t, i);
    if (a !== void 0 && i.reflect === !0) {
      const o = (((s = i.converter) == null ? void 0 : s.toAttribute) !== void 0 ? i.converter : q).toAttribute(r, i.type);
      this._$Em = t, o == null ? this.removeAttribute(a) : this.setAttribute(a, o), this._$Em = null;
    }
  }
  _$AK(t, r) {
    var s, o;
    const i = this.constructor, a = i._$Eh.get(t);
    if (a !== void 0 && this._$Em !== a) {
      const n = i.getPropertyOptions(a), c = typeof n.converter == "function" ? { fromAttribute: n.converter } : ((s = n.converter) == null ? void 0 : s.fromAttribute) !== void 0 ? n.converter : q;
      this._$Em = a;
      const _ = c.fromAttribute(r, n.type);
      this[a] = _ ?? ((o = this._$Ej) == null ? void 0 : o.get(a)) ?? _, this._$Em = null;
    }
  }
  requestUpdate(t, r, i, a = !1, s) {
    var o;
    if (t !== void 0) {
      const n = this.constructor;
      if (a === !1 && (s = this[t]), i ?? (i = n.getPropertyOptions(t)), !((i.hasChanged ?? _t)(s, r) || i.useDefault && i.reflect && s === ((o = this._$Ej) == null ? void 0 : o.get(t)) && !this.hasAttribute(n._$Eu(t, i)))) return;
      this.C(t, r, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, r, { useDefault: i, reflect: a, wrapped: s }, o) {
    i && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(t) && (this._$Ej.set(t, o ?? r ?? this[t]), s !== !0 || o !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (r = void 0), this._$AL.set(t, r)), a === !0 && this._$Em !== t && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(t));
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
        for (const [s, o] of this._$Ep) this[s] = o;
        this._$Ep = void 0;
      }
      const a = this.constructor.elementProperties;
      if (a.size > 0) for (const [s, o] of a) {
        const { wrapped: n } = o, c = this[s];
        n !== !0 || this._$AL.has(s) || c === void 0 || this.C(s, void 0, o, c);
      }
    }
    let t = !1;
    const r = this._$AL;
    try {
      t = this.shouldUpdate(r), t ? (this.willUpdate(r), (i = this._$EO) == null || i.forEach((a) => {
        var s;
        return (s = a.hostUpdate) == null ? void 0 : s.call(a);
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
O.elementStyles = [], O.shadowRootOptions = { mode: "open" }, O[B("elementProperties")] = /* @__PURE__ */ new Map(), O[B("finalized")] = /* @__PURE__ */ new Map(), et == null || et({ ReactiveElement: O }), (y.reactiveElementVersions ?? (y.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const I = globalThis, kt = (e) => e, Z = I.trustedTypes, St = Z ? Z.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, Ut = "$lit$", x = `lit$${Math.random().toFixed(9).slice(2)}$`, jt = "?" + x, de = `<${jt}>`, A = document, j = () => A.createComment(""), H = (e) => e === null || typeof e != "object" && typeof e != "function", ft = Array.isArray, le = (e) => ft(e) || typeof (e == null ? void 0 : e[Symbol.iterator]) == "function", rt = `[ 	
\f\r]`, R = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Et = /-->/g, At = />/g, k = RegExp(`>|${rt}(?:([^\\s"'>=/]+)(${rt}*=${rt}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Ct = /'/g, Ot = /"/g, Ht = /^(?:script|style|textarea|title)$/i, pe = (e) => (t, ...r) => ({ _$litType$: e, strings: t, values: r }), d = pe(1), T = Symbol.for("lit-noChange"), l = Symbol.for("lit-nothing"), Pt = /* @__PURE__ */ new WeakMap(), S = A.createTreeWalker(A, 129);
function Ft(e, t) {
  if (!ft(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return St !== void 0 ? St.createHTML(t) : t;
}
const he = (e, t) => {
  const r = e.length - 1, i = [];
  let a, s = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = R;
  for (let n = 0; n < r; n++) {
    const c = e[n];
    let _, g, h = -1, m = 0;
    for (; m < c.length && (o.lastIndex = m, g = o.exec(c), g !== null); ) m = o.lastIndex, o === R ? g[1] === "!--" ? o = Et : g[1] !== void 0 ? o = At : g[2] !== void 0 ? (Ht.test(g[2]) && (a = RegExp("</" + g[2], "g")), o = k) : g[3] !== void 0 && (o = k) : o === k ? g[0] === ">" ? (o = a ?? R, h = -1) : g[1] === void 0 ? h = -2 : (h = o.lastIndex - g[2].length, _ = g[1], o = g[3] === void 0 ? k : g[3] === '"' ? Ot : Ct) : o === Ot || o === Ct ? o = k : o === Et || o === At ? o = R : (o = k, a = void 0);
    const b = o === k && e[n + 1].startsWith("/>") ? " " : "";
    s += o === R ? c + de : h >= 0 ? (i.push(_), c.slice(0, h) + Ut + c.slice(h) + x + b) : c + x + (h === -2 ? n : b);
  }
  return [Ft(e, s + (e[r] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class F {
  constructor({ strings: t, _$litType$: r }, i) {
    let a;
    this.parts = [];
    let s = 0, o = 0;
    const n = t.length - 1, c = this.parts, [_, g] = he(t, r);
    if (this.el = F.createElement(_, i), S.currentNode = this.el.content, r === 2 || r === 3) {
      const h = this.el.content.firstChild;
      h.replaceWith(...h.childNodes);
    }
    for (; (a = S.nextNode()) !== null && c.length < n; ) {
      if (a.nodeType === 1) {
        if (a.hasAttributes()) for (const h of a.getAttributeNames()) if (h.endsWith(Ut)) {
          const m = g[o++], b = a.getAttribute(h).split(x), $ = /([.?@])?(.*)/.exec(m);
          c.push({ type: 1, index: s, name: $[2], strings: b, ctor: $[1] === "." ? _e : $[1] === "?" ? fe : $[1] === "@" ? ge : Q }), a.removeAttribute(h);
        } else h.startsWith(x) && (c.push({ type: 6, index: s }), a.removeAttribute(h));
        if (Ht.test(a.tagName)) {
          const h = a.textContent.split(x), m = h.length - 1;
          if (m > 0) {
            a.textContent = Z ? Z.emptyScript : "";
            for (let b = 0; b < m; b++) a.append(h[b], j()), S.nextNode(), c.push({ type: 2, index: ++s });
            a.append(h[m], j());
          }
        }
      } else if (a.nodeType === 8) if (a.data === jt) c.push({ type: 2, index: s });
      else {
        let h = -1;
        for (; (h = a.data.indexOf(x, h + 1)) !== -1; ) c.push({ type: 7, index: s }), h += x.length - 1;
      }
      s++;
    }
  }
  static createElement(t, r) {
    const i = A.createElement("template");
    return i.innerHTML = t, i;
  }
}
function N(e, t, r = e, i) {
  var o, n;
  if (t === T) return t;
  let a = i !== void 0 ? (o = r._$Co) == null ? void 0 : o[i] : r._$Cl;
  const s = H(t) ? void 0 : t._$litDirective$;
  return (a == null ? void 0 : a.constructor) !== s && ((n = a == null ? void 0 : a._$AO) == null || n.call(a, !1), s === void 0 ? a = void 0 : (a = new s(e), a._$AT(e, r, i)), i !== void 0 ? (r._$Co ?? (r._$Co = []))[i] = a : r._$Cl = a), a !== void 0 && (t = N(e, a._$AS(e, t.values), a, i)), t;
}
class ue {
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
    const { el: { content: r }, parts: i } = this._$AD, a = ((t == null ? void 0 : t.creationScope) ?? A).importNode(r, !0);
    S.currentNode = a;
    let s = S.nextNode(), o = 0, n = 0, c = i[0];
    for (; c !== void 0; ) {
      if (o === c.index) {
        let _;
        c.type === 2 ? _ = new W(s, s.nextSibling, this, t) : c.type === 1 ? _ = new c.ctor(s, c.name, c.strings, this, t) : c.type === 6 && (_ = new me(s, this, t)), this._$AV.push(_), c = i[++n];
      }
      o !== (c == null ? void 0 : c.index) && (s = S.nextNode(), o++);
    }
    return S.currentNode = A, a;
  }
  p(t) {
    let r = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, r), r += i.strings.length - 2) : i._$AI(t[r])), r++;
  }
}
class W {
  get _$AU() {
    var t;
    return ((t = this._$AM) == null ? void 0 : t._$AU) ?? this._$Cv;
  }
  constructor(t, r, i, a) {
    this.type = 2, this._$AH = l, this._$AN = void 0, this._$AA = t, this._$AB = r, this._$AM = i, this.options = a, this._$Cv = (a == null ? void 0 : a.isConnected) ?? !0;
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
    t = N(this, t, r), H(t) ? t === l || t == null || t === "" ? (this._$AH !== l && this._$AR(), this._$AH = l) : t !== this._$AH && t !== T && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : le(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== l && H(this._$AH) ? this._$AA.nextSibling.data = t : this.T(A.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    var s;
    const { values: r, _$litType$: i } = t, a = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = F.createElement(Ft(i.h, i.h[0]), this.options)), i);
    if (((s = this._$AH) == null ? void 0 : s._$AD) === a) this._$AH.p(r);
    else {
      const o = new ue(a, this), n = o.u(this.options);
      o.p(r), this.T(n), this._$AH = o;
    }
  }
  _$AC(t) {
    let r = Pt.get(t.strings);
    return r === void 0 && Pt.set(t.strings, r = new F(t)), r;
  }
  k(t) {
    ft(this._$AH) || (this._$AH = [], this._$AR());
    const r = this._$AH;
    let i, a = 0;
    for (const s of t) a === r.length ? r.push(i = new W(this.O(j()), this.O(j()), this, this.options)) : i = r[a], i._$AI(s), a++;
    a < r.length && (this._$AR(i && i._$AB.nextSibling, a), r.length = a);
  }
  _$AR(t = this._$AA.nextSibling, r) {
    var i;
    for ((i = this._$AP) == null ? void 0 : i.call(this, !1, !0, r); t !== this._$AB; ) {
      const a = kt(t).nextSibling;
      kt(t).remove(), t = a;
    }
  }
  setConnected(t) {
    var r;
    this._$AM === void 0 && (this._$Cv = t, (r = this._$AP) == null || r.call(this, t));
  }
}
class Q {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, r, i, a, s) {
    this.type = 1, this._$AH = l, this._$AN = void 0, this.element = t, this.name = r, this._$AM = a, this.options = s, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = l;
  }
  _$AI(t, r = this, i, a) {
    const s = this.strings;
    let o = !1;
    if (s === void 0) t = N(this, t, r, 0), o = !H(t) || t !== this._$AH && t !== T, o && (this._$AH = t);
    else {
      const n = t;
      let c, _;
      for (t = s[0], c = 0; c < s.length - 1; c++) _ = N(this, n[i + c], r, c), _ === T && (_ = this._$AH[c]), o || (o = !H(_) || _ !== this._$AH[c]), _ === l ? t = l : t !== l && (t += (_ ?? "") + s[c + 1]), this._$AH[c] = _;
    }
    o && !a && this.j(t);
  }
  j(t) {
    t === l ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class _e extends Q {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === l ? void 0 : t;
  }
}
class fe extends Q {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== l);
  }
}
class ge extends Q {
  constructor(t, r, i, a, s) {
    super(t, r, i, a, s), this.type = 5;
  }
  _$AI(t, r = this) {
    if ((t = N(this, t, r, 0) ?? l) === T) return;
    const i = this._$AH, a = t === l && i !== l || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, s = t !== l && (i === l || a);
    a && this.element.removeEventListener(this.name, this, i), s && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    var r;
    typeof this._$AH == "function" ? this._$AH.call(((r = this.options) == null ? void 0 : r.host) ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class me {
  constructor(t, r, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = r, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    N(this, t);
  }
}
const it = I.litHtmlPolyfillSupport;
it == null || it(F, W), (I.litHtmlVersions ?? (I.litHtmlVersions = [])).push("3.3.3");
const be = (e, t, r) => {
  const i = (r == null ? void 0 : r.renderBefore) ?? t;
  let a = i._$litPart$;
  if (a === void 0) {
    const s = (r == null ? void 0 : r.renderBefore) ?? null;
    i._$litPart$ = a = new W(t.insertBefore(j(), s), s, void 0, r ?? {});
  }
  return a._$AI(e), a;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const E = globalThis;
class z extends O {
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
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = be(r, this.renderRoot, this.renderOptions);
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
    return T;
  }
}
var Lt;
z._$litElement$ = !0, z.finalized = !0, (Lt = E.litElementHydrateSupport) == null || Lt.call(E, { LitElement: z });
const at = E.litElementPolyfillSupport;
at == null || at({ LitElement: z });
(E.litElementVersions ?? (E.litElementVersions = [])).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Yt = (e) => (t, r) => {
  r !== void 0 ? r.addInitializer(() => {
    customElements.define(e, t);
  }) : customElements.define(e, t);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ve = { attribute: !0, type: String, converter: q, reflect: !1, hasChanged: _t }, xe = (e = ve, t, r) => {
  const { kind: i, metadata: a } = r;
  let s = globalThis.litPropertyMetadata.get(a);
  if (s === void 0 && globalThis.litPropertyMetadata.set(a, s = /* @__PURE__ */ new Map()), i === "setter" && ((e = Object.create(e)).wrapped = !0), s.set(r.name, e), i === "accessor") {
    const { name: o } = r;
    return { set(n) {
      const c = t.get.call(this);
      t.set.call(this, n), this.requestUpdate(o, c, e, !0, n);
    }, init(n) {
      return n !== void 0 && this.C(o, void 0, e, n), n;
    } };
  }
  if (i === "setter") {
    const { name: o } = r;
    return function(n) {
      const c = this[o];
      t.call(this, n), this.requestUpdate(o, c, e, !0, n);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function gt(e) {
  return (t, r) => typeof r == "object" ? xe(e, t, r) : ((i, a, s) => {
    const o = a.hasOwnProperty(s);
    return a.constructor.createProperty(s, i), o ? Object.getOwnPropertyDescriptor(a, s) : void 0;
  })(e, t, r);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function f(e) {
  return gt({ ...e, state: !0, attribute: !1 });
}
const U = 1, K = 600, dt = 0, lt = 5, D = {
  open_button: 1,
  close_button: 2,
  open_time_s: 20,
  close_time_s: 20,
  direction_settle_s: 0.5
};
async function zt(e, t) {
  return e.callWS({
    type: "conx_dynamic_panel/get_config",
    entry_id: t
  });
}
async function ye(e, t, r, i) {
  return e.callWS({
    type: "conx_dynamic_panel/update_profile",
    entry_id: t,
    profile_id: r,
    profile: i
  });
}
async function $e(e, t, r) {
  return e.callWS({
    type: "conx_dynamic_panel/create_profile",
    entry_id: t,
    profile: r
  });
}
async function we(e, t, r) {
  await e.callWS({
    type: "conx_dynamic_panel/delete_profile",
    entry_id: t,
    profile_id: r
  });
}
async function ke(e, t, r, i, a) {
  return e.callWS({
    type: "conx_dynamic_panel/duplicate_profile",
    entry_id: t,
    profile_id: r,
    new_id: i,
    new_name: a
  });
}
async function st(e, t, r, i = !1) {
  return e.callWS({
    type: "conx_dynamic_panel/set_active_profile",
    entry_id: t,
    profile_id: r,
    sync: i
  });
}
async function Se(e, t) {
  return e.callWS({
    type: "conx_dynamic_panel/sync",
    entry_id: t
  });
}
async function Ee(e, t) {
  return e.callWS({
    type: "conx_dynamic_panel/pull",
    entry_id: t
  });
}
async function Ae(e, t) {
  return e.callWS({
    type: "conx_dynamic_panel/export_profiles",
    entry_id: t
  });
}
async function Ce(e, t, r, i = "merge") {
  return e.callWS({
    type: "conx_dynamic_panel/import_profiles",
    entry_id: t,
    payload: r,
    mode: i
  });
}
async function Oe(e, t, r) {
  return e.callWS({
    type: "conx_dynamic_panel/update_panel_name",
    entry_id: t,
    panel_name: r
  });
}
async function Pe(e, t, r) {
  return e.callWS({
    type: "conx_dynamic_panel/cover_command",
    entry_id: t,
    command: r
  });
}
function ot(e, t, r, i) {
  const a = typeof e == "number" ? e : Number(e);
  return Number.isFinite(a) ? Math.max(t, Math.min(r, a)) : i;
}
function Tt(e, t) {
  const r = Math.round(typeof e == "number" ? e : Number(e));
  return !Number.isFinite(r) || r < 1 || r > 4 ? t : r;
}
function X(e) {
  const t = e || {}, r = Tt(t.open_button, D.open_button);
  let i = Tt(t.close_button, D.close_button);
  return i === r && (i = [1, 2, 3, 4].find((a) => a !== r) ?? 2), {
    open_button: r,
    close_button: i,
    open_time_s: ot(
      t.open_time_s,
      U,
      K,
      D.open_time_s
    ),
    close_time_s: ot(
      t.close_time_s,
      U,
      K,
      D.close_time_s
    ),
    direction_settle_s: ot(
      t.direction_settle_s,
      dt,
      lt,
      D.direction_settle_s
    ),
    opposite_press: t.opposite_press === "stop_then_reverse" ? "stop_then_reverse" : "stop_only"
  };
}
function ze(e) {
  const t = structuredClone(e);
  typeof t.backlight_brightness != "number" || !Number.isFinite(t.backlight_brightness) ? t.backlight_brightness = 100 : t.backlight_brightness = Math.max(
    0,
    Math.min(100, Math.round(t.backlight_brightness))
  ), t.buttons = [1, 2, 3, 4].map((a) => {
    var o;
    const s = (o = t.buttons) == null ? void 0 : o.find((n) => n.index === a);
    return {
      index: a,
      name: (s == null ? void 0 : s.name) ?? `Button ${a}`,
      action: (s == null ? void 0 : s.action) ?? null,
      radio_member: (s == null ? void 0 : s.radio_member) !== !1
    };
  });
  const i = (Array.isArray(t.radio_groups) ? t.radio_groups : []).map((a, s) => ({
    id: String((a == null ? void 0 : a.id) || `g${s + 1}`),
    buttons: Array.isArray(a == null ? void 0 : a.buttons) ? a.buttons.map((o) => Number(o)).filter((o, n, c) => o >= 1 && o <= 4 && c.indexOf(o) === n) : []
  }));
  for (; i.length < 2; )
    i.push({ id: `g${i.length + 1}`, buttons: [] });
  return t.radio_groups = i, t.cover = X(t.cover), t;
}
function M(e) {
  return ze(e);
}
function Te(e, t) {
  return !e || !t ? e === t : JSON.stringify(e) === JSON.stringify(t);
}
function Ne(e, t) {
  const r = new Blob([JSON.stringify(t, null, 2)], {
    type: "application/json"
  }), i = URL.createObjectURL(r), a = document.createElement("a");
  a.href = i, a.download = e, a.click(), URL.revokeObjectURL(i);
}
const Re = "YOUR_ENTRY_ID", nt = [
  { id: "morning", at: "06:30:00", profile: "morning" },
  { id: "evening", at: "18:00:00", profile: "evening" },
  { id: "night", at: "23:00:00", profile: "night" }
];
function Nt(e, t) {
  const r = (e || "").trim();
  return r || t;
}
function ct(e) {
  return String(e).split(`
`).map((t) => `# ${t.trim()}`.trimEnd());
}
function De(e) {
  const { comments: t } = e, r = Nt(e.entryId, Re), i = {
    morning: t.morning,
    evening: t.evening,
    night: t.night
  }, a = (o) => {
    var n;
    return Nt((n = e.profileIds) == null ? void 0 : n[o], nt[o].profile);
  }, s = [
    ...ct(t.header),
    ...ct(t.sync),
    ...ct(t.ids),
    `alias: ${t.alias}`,
    "mode: single",
    "triggers:"
  ];
  return nt.forEach((o) => {
    s.push(`  # ${i[o.id]}`), s.push("  - trigger: time"), s.push(`    at: "${o.at}"`), s.push(`    id: ${o.id}`);
  }), s.push("actions:"), s.push("  - choose:"), nt.forEach((o, n) => {
    s.push("      - conditions:"), s.push("          - condition: trigger"), s.push(`            id: ${o.id}`), s.push("        sequence:"), s.push("          - action: conx_dynamic_panel.activate_profile"), s.push("            data:"), s.push(`              entry_id: ${r}`), s.push(`              profile_id: ${a(n)}`), s.push("              sync: true");
  }), `${s.join(`
`)}
`;
}
const L = 1, Me = /* @__PURE__ */ new Set(["toggle", "radio_mandatory", "radio_optional", "radio_split"]);
function Le(e) {
  const t = [];
  for (Array.isArray(e) && e.forEach((r, i) => {
    if (!v(r)) return;
    const a = [], s = Array.isArray(r.buttons) ? r.buttons : [];
    for (const o of s) {
      const n = Number(o);
      n >= 1 && n <= 4 && !a.includes(n) && a.push(n);
    }
    t.push({ id: String(r.id || `g${i + 1}`), buttons: a });
  }); t.length < 2; )
    t.push({ id: `g${t.length + 1}`, buttons: [] });
  return t;
}
function v(e) {
  return typeof e == "object" && e !== null && !Array.isArray(e);
}
function Be(e) {
  if (v(e)) {
    const t = Object.entries(e);
    if (!t.length)
      return { ok: !1, error: "profiles must be a non-empty object or array" };
    const r = {};
    for (const [i, a] of t) {
      const s = Rt(a, i);
      if (!s.ok)
        return s;
      r[s.profile.id] = s.profile;
    }
    return { ok: !0, profiles: r };
  }
  if (Array.isArray(e)) {
    if (!e.length)
      return { ok: !1, error: "profiles must be a non-empty object or array" };
    const t = {};
    for (let r = 0; r < e.length; r += 1) {
      const i = Rt(e[r], void 0);
      if (!i.ok)
        return { ok: !1, error: `${i.error} (index ${r})` };
      t[i.profile.id] = i.profile;
    }
    return { ok: !0, profiles: t };
  }
  return { ok: !1, error: "profiles must be a non-empty object or array" };
}
function Rt(e, t) {
  if (!v(e))
    return { ok: !1, error: "each profile must be an object" };
  const r = String(e.id || t || "").trim();
  if (!r)
    return { ok: !1, error: "profile is missing id" };
  const i = String(e.mode || "toggle");
  if (!Me.has(i))
    return { ok: !1, error: `unsupported mode for profile ${r}: ${i}` };
  const a = Array.isArray(e.buttons) ? e.buttons : [], s = [1, 2, 3, 4].map((n) => {
    const c = a.find(
      (g) => v(g) && Number(g.index) === n
    );
    if (!v(c))
      return { index: n, name: `Button ${n}`, action: null };
    let _ = null;
    return v(c.action) && typeof c.action.action == "string" && (_ = {
      action: c.action.action,
      target: v(c.action.target) ? c.action.target : {},
      data: v(c.action.data) ? c.action.data : {}
    }), {
      index: n,
      name: String(c.name ?? `Button ${n}`),
      action: _,
      radio_member: c.radio_member === void 0 ? !0 : !!c.radio_member
    };
  });
  let o = 100;
  if (e.backlight_brightness !== void 0 && e.backlight_brightness !== null) {
    const n = Number(e.backlight_brightness);
    if (!Number.isFinite(n))
      return { ok: !1, error: `invalid backlight_brightness for profile ${r}` };
    o = Math.max(0, Math.min(100, Math.round(n)));
  }
  return {
    ok: !0,
    profile: {
      id: r,
      name: String(e.name || r),
      mode: i,
      color_on: String(e.color_on || "cyan"),
      color_off: String(e.color_off || "blue"),
      radar: String(e.radar || "30s"),
      backlight: !!(e.backlight ?? !0),
      backlight_brightness: o,
      child_lock: !!(e.child_lock ?? !1),
      selected_button: e.selected_button === null || e.selected_button === void 0 ? null : Number(e.selected_button),
      buttons: s,
      radio_groups: Le(e.radio_groups)
    }
  };
}
function Ie(e) {
  if (!v(e))
    return { ok: !1, error: "Root must be a JSON object" };
  const t = e.schema_version ?? L, r = Number(t);
  if (!Number.isInteger(r) || r < 1)
    return { ok: !1, error: "schema_version must be a positive integer" };
  if (r > L)
    return {
      ok: !1,
      error: `Unsupported schema_version ${r}; current is ${L}`
    };
  const i = Be(e.profiles);
  if (!i.ok)
    return i;
  let a = null;
  return typeof e.active_profile_id == "string" && e.active_profile_id && (a = e.active_profile_id, !(a in i.profiles)) ? {
    ok: !1,
    error: `active_profile_id "${a}" is not present in profiles`
  } : {
    ok: !0,
    payload: {
      schema_version: L,
      active_profile_id: a,
      profiles: i.profiles
    }
  };
}
function Ue(e, t) {
  return {
    schema_version: L,
    active_profile_id: t,
    profiles: structuredClone(e)
  };
}
function je(e, t, r = "YOUR_CONFIG_ENTRY_ID") {
  const i = JSON.stringify(e, null, 2).split(`
`).map((a, s) => s === 0 ? a : `    ${a}`).join(`
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
const Gt = "conx-dynamic-panel-lang", Wt = {}, Jt = {
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
  "card.backlight_brightness": "Backlight brightness",
  "card.child_lock": "Child lock",
  "card.theme": "Interface theme",
  "card.open_export_wizard": "Export wizard",
  "card.back_to_editor": "Back to editor",
  "card.button": "Button",
  "card.button_expand": "Expand button settings",
  "card.button_collapse": "Collapse button settings",
  "card.label": "Label",
  "card.action": "Action",
  "card.entity_id": "Entity ID",
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
  "card.cover_settle_hint": "Dead time between switching one direction off and the other on. Keep it above zero for motor relay safety.",
  "card.cover_opposite": "Opposite direction press",
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
  "cover.stop_only": "Stop only",
  "cover.stop_then_reverse": "Stop, then reverse",
  "theme.noir": "Noir gray",
  "theme.ivory": "Ivory cool",
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
  "card.panel_name": "Panel name",
  "card.panel_name_ok": "Panel name updated.",
  "card.menu": "Settings",
  "card.tabs_hint": "Three setup steps under the panel preview",
  "card.step_1": "Step 1",
  "card.step_2": "Step 2",
  "card.step_3": "Step 3",
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
  "card.step_profiles_hint": "Select the active profile for this panel, or create a new one.",
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
  "mode.cover": "Cover / shutter"
}, He = {
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
  "card.backlight_brightness": "עוצמת תאורת רקע",
  "card.child_lock": "נעילת ילדים",
  "card.theme": "ערכת נושא",
  "card.open_export_wizard": "אשף ייצוא",
  "card.back_to_editor": "חזרה לעריכה",
  "card.button": "כפתור",
  "card.button_expand": "הרחב הגדרות כפתור",
  "card.button_collapse": "כווץ הגדרות כפתור",
  "card.label": "תווית",
  "card.action": "פעולה",
  "card.entity_id": "מזהה ישות",
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
  "card.cover_settle_hint": "זמן מת בין כיבוי כיוון אחד להפעלת השני. מומלץ להשאיר מעל אפס לבטיחות ממסרי המנוע.",
  "card.cover_opposite": "לחיצה על הכיוון ההפוך",
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
  "cover.stop_only": "עצירה בלבד",
  "cover.stop_then_reverse": "עצירה ואז כיוון הפוך",
  "theme.noir": "נואר אפור",
  "theme.ivory": "שנהב קר",
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
  "card.panel_name": "שם פאנל",
  "card.panel_name_ok": "שם הפאנל עודכן.",
  "card.menu": "הגדרות",
  "card.tabs_hint": "שלושה שלבי הגדרה מתחת לתצוגת הפאנל",
  "card.step_1": "שלב 1",
  "card.step_2": "שלב 2",
  "card.step_3": "שלב 3",
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
  "card.step_profiles_hint": "בחרו פרופיל פעיל לפאנל, או צרו חדש.",
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
  "mode.cover": "תריס"
}, Fe = {
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
  "card.backlight_brightness": "Яркость подсветки",
  "card.child_lock": "Блокировка",
  "card.theme": "Тема интерфейса",
  "card.open_export_wizard": "Мастер экспорта",
  "card.back_to_editor": "Назад к редактору",
  "card.button": "Кнопка",
  "card.button_expand": "Развернуть настройки кнопки",
  "card.button_collapse": "Свернуть настройки кнопки",
  "card.label": "Название",
  "card.action": "Действие",
  "card.entity_id": "Entity ID",
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
  "card.cover_settle_hint": "Пауза между выключением одного направления и включением другого. Держите её выше нуля для безопасности реле мотора.",
  "card.cover_opposite": "Нажатие противоположного направления",
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
  "cover.stop_only": "Только стоп",
  "cover.stop_then_reverse": "Стоп, затем реверс",
  "theme.noir": "Нуар серый",
  "theme.ivory": "Слоновая кость холодная",
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
  "card.panel_name": "Имя панели",
  "card.panel_name_ok": "Имя панели обновлено.",
  "card.menu": "Настройки",
  "card.tabs_hint": "Три шага настройки под превью панели",
  "card.step_1": "Шаг 1",
  "card.step_2": "Шаг 2",
  "card.step_3": "Шаг 3",
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
  "card.step_profiles_hint": "Выберите активный профиль или создайте новый.",
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
  "mode.cover": "Ролета / жалюзи"
}, Ye = {
  en: Jt,
  he: He,
  ru: Fe
}, pt = [
  { id: "he", label: "עברית", flag: "IL" },
  { id: "en", label: "English", flag: "GB" },
  { id: "ru", label: "Русский", flag: "RU" }
];
function Y(e) {
  const t = (e || "en").toLowerCase();
  return t.startsWith("he") || t.startsWith("iw") ? "he" : t.startsWith("ru") ? "ru" : "en";
}
function Ge() {
  var e, t;
  try {
    const r = (t = (e = globalThis.localStorage) == null ? void 0 : e.getItem) == null ? void 0 : t.call(e, Gt);
    if (r === "en" || r === "he" || r === "ru")
      return r;
  } catch {
  }
  return Wt.language || null;
}
function We(e) {
  var t, r;
  Wt.language = e;
  try {
    (r = (t = globalThis.localStorage) == null ? void 0 : t.setItem) == null || r.call(t, Gt, e);
  } catch {
  }
}
function P(e, t) {
  const r = Y(e);
  return Ye[r][t] || Jt[t] || t;
}
function Vt(e) {
  return Y(e) === "he";
}
const Xt = "conx-dynamic-panel-theme", Je = {
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
}, mt = [
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
], Ve = new Set(mt.map((e) => e.id));
function tt(e) {
  return e ? Ve.has(e) ? e : Je[e] || "noir" : "noir";
}
function Dt() {
  var e, t;
  try {
    const r = (t = (e = globalThis.localStorage) == null ? void 0 : e.getItem) == null ? void 0 : t.call(e, Xt);
    return r ? tt(r) : null;
  } catch {
  }
  return null;
}
function Xe(e) {
  var t, r;
  try {
    (r = (t = globalThis.localStorage) == null ? void 0 : t.setItem) == null || r.call(t, Xt, e);
  } catch {
  }
}
function Mt(e, t) {
  return e ? tt(e) : t || "noir";
}
var qe = Object.defineProperty, Ze = Object.getOwnPropertyDescriptor, u = (e, t, r, i) => {
  for (var a = i > 1 ? void 0 : i ? Ze(t, r) : t, s = e.length - 1, o; s >= 0; s--)
    (o = e[s]) && (a = (i ? o(t, r, a) : o(a)) || a);
  return i && a && qe(t, r, a), a;
};
const C = [
  "language",
  "profiles",
  "edit",
  "preview",
  "review",
  "transfer"
], Ke = {
  red: "#ff1744",
  blue: "#2979ff",
  green: "#00e676",
  white: "#f5f7fa",
  yellow: "#ffea00",
  magenta: "#f50057",
  cyan: "#00e5ff",
  warm_white: "#ffe0b2",
  warm_yellow: "#ffc400"
}, qt = "#00e5ff", Qe = "#2979ff", Zt = "conx-dynamic-panel-radio-groups-open";
function tr() {
  var e, t;
  try {
    const r = (t = (e = globalThis.localStorage) == null ? void 0 : e.getItem) == null ? void 0 : t.call(e, Zt);
    if (r === "0")
      return !1;
    if (r === "1")
      return !0;
  } catch {
  }
  return null;
}
function er(e) {
  var t, r;
  try {
    (r = (t = globalThis.localStorage) == null ? void 0 : t.setItem) == null || r.call(t, Zt, e ? "1" : "0");
  } catch {
  }
}
function J(e, t = qt) {
  return e && (Ke[e] || e) || t;
}
let p = class extends z {
  constructor() {
    super(...arguments), this._loading = !1, this._busy = !1, this._syncPulse = !1, this._pressedRing = null, this._splitPreviewOn = {}, this._theme = "noir", this._view = "editor", this._wizardStep = "transfer", this._importMode = "merge", this._serviceYaml = "", this._sections = {
      profiles: !0,
      appearance: !0,
      buttons: !0,
      theme: !1,
      preview: !0,
      actions: !0,
      transfer: !0
    }, this._expandedButtons = {}, this._activeTab = "profiles", this._menuOpen = !1, this._automationOpen = !1, this._previewOpen = !0, this._panelNameDraft = "", this._radioGroupsOpen = !0;
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
    this._config = e, e.language && (this._uiLang = Y(e.language)), this._theme = Mt(e.theme, Dt());
  }
  connectedCallback() {
    var e;
    super.connectedCallback(), this._uiLang || (this._uiLang = Ge() || void 0), this._theme = Mt((e = this._config) == null ? void 0 : e.theme, Dt()), this._ensureFonts();
  }
  _stepLabel(e) {
    return this.t(`card.step_${e}`);
  }
  _goToStep(e) {
    this._wizardStep = e, this._notice = void 0;
  }
  _wizardIndex() {
    return C.indexOf(this._wizardStep);
  }
  _wizardNext() {
    const e = this._wizardIndex();
    e < C.length - 1 && this._goToStep(C[e + 1]);
  }
  _wizardBack() {
    const e = this._wizardIndex();
    e > 0 && this._goToStep(C[e - 1]);
  }
  _buildServiceYaml(e) {
    if (!this._panel || !this._config)
      return "";
    const t = e || Ue(this._panel.profiles, this._panel.active_profile_id);
    return je(
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
    return De({
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
    t.id = e, t.rel = "stylesheet", t.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Sora:wght@500;600;700&display=swap", document.head.appendChild(t);
  }
  updated(e) {
    var t;
    (e.has("hass") || e.has("_config")) && this.hass && ((t = this._config) != null && t.entry_id) && !this._panel && !this._loading && this._load();
  }
  get _language() {
    var e, t, r;
    return this._uiLang ? this._uiLang : Y(
      ((t = (e = this.hass) == null ? void 0 : e.locale) == null ? void 0 : t.language) || ((r = this.hass) == null ? void 0 : r.language) || "en"
    );
  }
  t(e) {
    return P(this._language, e);
  }
  get _dirty() {
    return !Te(this._draft || null, this._saved || null);
  }
  _setLanguage(e) {
    this._uiLang = e, We(e);
  }
  _setTheme(e) {
    this._theme = tt(e), Xe(this._theme), this._config && (this._config = { ...this._config, theme: this._theme }, this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: !0,
        composed: !0
      })
    ));
  }
  _openExportWizard() {
    this._view = "export", this._notice = void 0, this._refreshServiceYaml();
  }
  _backToEditor() {
    this._view = "editor", this._notice = void 0;
  }
  _isRadioMember(e) {
    var r;
    const t = (r = this._draft) == null ? void 0 : r.buttons.find((i) => i.index === e);
    return (t == null ? void 0 : t.radio_member) !== !1;
  }
  _ensureRadioGroups(e) {
    const r = (Array.isArray(e.radio_groups) ? e.radio_groups : []).map((i, a) => ({
      id: String((i == null ? void 0 : i.id) || `g${a + 1}`),
      buttons: Array.isArray(i == null ? void 0 : i.buttons) ? i.buttons.map((s) => Number(s)).filter((s, o, n) => s >= 1 && s <= 4 && n.indexOf(s) === o) : []
    }));
    for (; r.length < 2; )
      r.push({ id: `g${r.length + 1}`, buttons: [] });
    e.radio_groups = r;
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
      this._ensureRadioGroups(i), (i.radio_groups || []).forEach((s, o) => {
        o === e ? r && !s.buttons.includes(t) ? s.buttons = [...s.buttons, t] : r || (s.buttons = s.buttons.filter((n) => n !== t)) : r && (s.buttons = s.buttons.filter((n) => n !== t));
      });
    });
  }
  _ungroupedButtons() {
    var t;
    const e = /* @__PURE__ */ new Set();
    for (const r of ((t = this._draft) == null ? void 0 : t.radio_groups) || [])
      for (const i of r.buttons)
        e.add(i);
    return new Set([1, 2, 3, 4].filter((r) => !e.has(r)));
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
    ].filter(Boolean).join(" "), s = () => {
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
        @click=${s}
      >
        <span class="radio-member-label">L${e}</span>
      </button>
    `;
  }
  _renderRadioGroupsEditor() {
    if (!this._draft || this._draft.mode !== "radio_split")
      return l;
    const e = this._ungroupedButtons(), t = this._radioGroupsOpen;
    return d`
      <div class="radio-groups-section ${t ? "open" : ""}">
        <div class="radio-groups-head">
          <div class="radio-groups-head-main">
            <span class="menu-label">${this.t("card.radio_groups")}</span>
            ${t ? l : d`<div class="radio-groups-summary">
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
                    <div class="radio-group-members">
                      ${[1, 2, 3, 4].map(
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
                <div class="radio-group-members">
                  ${[1, 2, 3, 4].map(
      (r) => this._renderRadioMemberCell(
        r,
        e.has(r),
        { independent: !0 }
      )
    )}
                </div>
              </div>
            ` : l}
        ${this._radioGroupsOverlap() ? d`<div class="radio-groups-error">
              ${this.t("card.radio_groups_overlap")}
            </div>` : l}
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
        const t = await zt(this.hass, this._config.entry_id);
        this._applyPanel(t);
      } catch (t) {
        this._error = t instanceof Error ? t.message : String(t);
      } finally {
        this._loading = !1;
      }
    }
  }
  _applyPanel(e) {
    var i;
    this._panel = e, this._panelNameDraft = e.panel_name;
    const t = e.active_profile_id, r = t ? e.profiles[t] : void 0;
    this._saved = r ? M(r) : void 0, this._draft = r ? M(r) : void 0, ((i = this._draft) == null ? void 0 : i.mode) === "radio_split" && (this._radioGroupsOpen = tr() ?? !0);
  }
  _setRadioGroupsOpen(e) {
    this._radioGroupsOpen = e, er(e);
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
        [1, 2, 3, 4].filter((i) => e.has(i))
      )}`
    ), t.join(" · ");
  }
  _coverConfig(e) {
    var t;
    return X((t = e || this._draft) == null ? void 0 : t.cover);
  }
  _isCoverButton(e) {
    var r;
    if (((r = this._draft) == null ? void 0 : r.mode) !== "cover")
      return !1;
    const t = this._coverConfig();
    return t.open_button === e || t.close_button === e;
  }
  _coverDirectionFor(e) {
    var r;
    if (((r = this._draft) == null ? void 0 : r.mode) !== "cover")
      return null;
    const t = this._coverConfig();
    return t.open_button === e ? "open" : t.close_button === e ? "close" : null;
  }
  _patchCover(e) {
    this._patchDraft((t) => {
      const r = X(t.cover);
      e(r), t.cover = r;
    });
  }
  /**
   * Assign a panel button to a direction. Choosing the button already used by
   * the other direction swaps them, so the pair can never collapse onto one
   * button and leave the motor without a stop path.
   */
  _setCoverButton(e, t) {
    this._patchCover((r) => {
      const i = e === "open" ? r.open_button : r.close_button;
      e === "open" ? (r.close_button === t && (r.close_button = i), r.open_button = t) : (r.open_button === t && (r.open_button = i), r.close_button = t);
    });
  }
  _setCoverTime(e, t) {
    const r = Math.max(
      U,
      Math.min(K, Number.isFinite(t) ? t : U)
    );
    this._patchCover((i) => {
      e === "open" ? i.open_time_s = r : i.close_time_s = r;
    });
  }
  async _coverCommand(e) {
    if (!(!this.hass || !this._config)) {
      this._busy = !0, this._error = void 0;
      try {
        const t = await Pe(this.hass, this._config.entry_id, e);
        this._panel && (this._panel = { ...this._panel, cover_state: t });
      } catch (t) {
        this._error = t instanceof Error ? t.message : String(t);
      } finally {
        this._busy = !1;
      }
    }
  }
  _coverStateLabel() {
    var t, r;
    const e = ((r = (t = this._panel) == null ? void 0 : t.cover_state) == null ? void 0 : r.state) || "idle";
    return this.t(`card.cover_state_${e}`);
  }
  _renderCoverButtonPicker(e) {
    const t = this._coverConfig(), r = e === "open" ? t.open_button : t.close_button;
    return d`
      <div class="cover-buttons" role="radiogroup">
        ${[1, 2, 3, 4].map(
      (i) => d`
            <button
              type="button"
              class="radio-member ${r === i ? "on" : ""}"
              role="radio"
              aria-checked=${r === i ? "true" : "false"}
              ?disabled=${this._busy}
              @click=${() => this._setCoverButton(e, i)}
            >
              <span class="radio-member-label">L${i}</span>
            </button>
          `
    )}
      </div>
    `;
  }
  _renderCoverEditor() {
    var s;
    if (!this._draft || this._draft.mode !== "cover")
      return l;
    const e = this._coverConfig(), t = (s = this._panel) == null ? void 0 : s.capabilities.cover, r = (t == null ? void 0 : t.min_time_s) ?? U, i = (t == null ? void 0 : t.max_time_s) ?? K, a = this.t("card.cover_seconds");
    return d`
      <div class="cover-section" data-cover-editor>
        <div class="cover-head">
          <span class="menu-label">${this.t("card.cover")}</span>
        </div>
        <p class="radio-groups-hint">${this.t("card.cover_hint")}</p>
        <div class="cover-grid">
          <div class="cover-field">
            <span class="cover-label">${this.t("card.cover_open_button")}</span>
            ${this._renderCoverButtonPicker("open")}
          </div>
          <div class="cover-field">
            <span class="cover-label">${this.t("card.cover_close_button")}</span>
            ${this._renderCoverButtonPicker("close")}
          </div>
        </div>
        <div class="grid-2">
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
              @change=${(o) => this._setCoverTime("open", Number(o.target.value))}
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
              @change=${(o) => this._setCoverTime("close", Number(o.target.value))}
            />
          </label>
        </div>
        <label class="field">
          <span>${this.t("card.cover_settle")} (${a})</span>
          <input
            type="number"
            data-cover-settle
            min=${(t == null ? void 0 : t.min_settle_s) ?? dt}
            max=${(t == null ? void 0 : t.max_settle_s) ?? lt}
            step="0.1"
            .value=${String(e.direction_settle_s)}
            ?disabled=${this._busy}
            @change=${(o) => {
      const n = Number(o.target.value);
      this._patchCover((c) => {
        c.direction_settle_s = Math.max(
          dt,
          Math.min(lt, Number.isFinite(n) ? n : 0)
        );
      });
    }}
          />
        </label>
        <p class="radio-groups-hint">${this.t("card.cover_settle_hint")}</p>
        <label class="field">
          <span>${this.t("card.cover_opposite")}</span>
          <div class="select-wrap">
            <select
              data-cover-opposite
              .value=${e.opposite_press}
              ?disabled=${this._busy}
              @change=${(o) => {
      const n = o.target.value;
      this._patchCover((c) => {
        c.opposite_press = n === "stop_then_reverse" ? "stop_then_reverse" : "stop_only";
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
            </div>` : l}
        <p class="cover-safety">${this.t("card.cover_safety")}</p>
      </div>
    `;
  }
  /** Live open/close/stop, routed through the backend engine (never direct relays). */
  _renderCoverControl() {
    var t, r, i;
    if (((t = this._saved) == null ? void 0 : t.mode) !== "cover")
      return l;
    const e = ((i = (r = this._panel) == null ? void 0 : r.cover_state) == null ? void 0 : i.state) || "idle";
    return d`
      <div class="cover-control" data-cover-control>
        <div class="cover-control-head">
          <span class="menu-label">${this.t("card.cover_live")}</span>
          <span class="cover-state cover-state-${e}">${this._coverStateLabel()}</span>
        </div>
        <div class="cover-control-row">
          <button
            type="button"
            class="btn"
            data-cover-open
            ?disabled=${this._busy}
            @click=${() => this._coverCommand("open")}
          >
            ${this.t("card.cover_open")}
          </button>
          <button
            type="button"
            class="btn danger"
            data-cover-stop
            ?disabled=${this._busy}
            @click=${() => this._coverCommand("stop")}
          >
            ${this.t("card.cover_stop")}
          </button>
          <button
            type="button"
            class="btn"
            data-cover-close
            ?disabled=${this._busy}
            @click=${() => this._coverCommand("close")}
          >
            ${this.t("card.cover_close")}
          </button>
        </div>
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
        const t = await st(
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
        const e = await ye(
          this.hass,
          this._config.entry_id,
          this._draft.id,
          this._draft
        ), t = await zt(this.hass, this._config.entry_id);
        this._applyPanel(t), this._saved = M(e), this._draft = M(e);
      } catch (e) {
        this._error = e instanceof Error ? e.message : String(e);
      } finally {
        this._busy = !1;
      }
    }
  }
  _discard() {
    this._saved && (this._draft = M(this._saved));
  }
  async _sync() {
    if (!(!this.hass || !this._config)) {
      this._dirty && await this._saveDraft(), this._busy = !0, this._error = void 0, this._syncPulse = !0;
      try {
        const e = await Se(this.hass, this._config.entry_id);
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
        const e = await Ee(this.hass, this._config.entry_id);
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
      buttons: [1, 2, 3, 4].map((r) => ({
        index: r,
        name: `Button ${r}`,
        action: null,
        radio_member: !0
      }))
    };
    this._busy = !0;
    try {
      await $e(this.hass, this._config.entry_id, t);
      const r = await st(
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
    const e = `${this._draft.id}_copy_${Date.now()}`;
    this._busy = !0;
    try {
      await ke(
        this.hass,
        this._config.entry_id,
        this._draft.id,
        e,
        `${this._draft.name} copy`
      );
      const t = await st(
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
  _renameProfile() {
    if (!this._draft)
      return;
    const e = window.prompt(this.t("card.rename"), this._draft.name);
    e && (this._draft.name = e, this.requestUpdate());
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
          await we(this.hass, this._config.entry_id, this._draft.id), await this._load();
        } catch (e) {
          this._error = e instanceof Error ? e.message : String(e);
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
        const e = await Ae(this.hass, this._config.entry_id), t = this._panel.panel_name.replace(/[^\w.-]+/g, "_");
        Ne(`conx-profiles-${t}.json`, e), this._refreshServiceYaml(e), this._notice = this.t("card.export_ok");
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
        const r = await e.text(), i = Ie(JSON.parse(r));
        if (!i.ok)
          throw new Error(i.error || this.t("card.import_invalid"));
        const a = await Ce(
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
      const a = i.buttons.find((s) => s.index === e);
      a && (a.name = r);
    });
  }
  _onButtonActionInput(e, t) {
    const r = t.target.value.trim();
    this._patchDraft((i) => {
      var s, o;
      const a = i.buttons.find((n) => n.index === e);
      if (a) {
        if (!r) {
          a.action = null;
          return;
        }
        a.action = {
          action: r,
          target: ((s = a.action) == null ? void 0 : s.target) || {},
          data: ((o = a.action) == null ? void 0 : o.data) || {}
        };
      }
    });
  }
  _onButtonEntityInput(e, t) {
    const r = t.target.value.trim();
    this._patchDraft((i) => {
      var o, n;
      const a = i.buttons.find((c) => c.index === e);
      if (!a)
        return;
      const s = ((o = a.action) == null ? void 0 : o.action) || "";
      if (!s) {
        a.action = null;
        return;
      }
      a.action = {
        action: s,
        target: r ? { entity_id: r } : {},
        data: ((n = a.action) == null ? void 0 : n.data) || {}
      };
    });
  }
  _buttonEntityId(e) {
    var i, a, s;
    const t = (i = this._draft) == null ? void 0 : i.buttons.find((o) => o.index === e), r = (s = (a = t == null ? void 0 : t.action) == null ? void 0 : a.target) == null ? void 0 : s.entity_id;
    return (r == null ? void 0 : r.trim()) || null;
  }
  _entityIsOn(e) {
    var i, a, s;
    const t = (s = (a = (i = this.hass) == null ? void 0 : i.states) == null ? void 0 : a[e]) == null ? void 0 : s.state;
    if (t == null)
      return null;
    const r = String(t).toLowerCase();
    return ["unavailable", "unknown"].includes(r) ? null : ["on", "open", "home", "playing", "active"].includes(r);
  }
  _isRingOn(e) {
    var i;
    if (!this._draft)
      return !1;
    if (this._draft.mode === "cover") {
      const a = this._coverDirectionFor(e);
      if (a) {
        const s = (i = this._panel) == null ? void 0 : i.cover_state;
        return s != null && s.active ? s.direction === a : !!this._splitPreviewOn[e];
      }
    }
    if (this._draft.mode === "radio_split") {
      const a = this._buttonEntityId(e);
      if (a) {
        const s = this._entityIsOn(a);
        if (s !== null)
          return s;
      }
      return !!this._splitPreviewOn[e];
    }
    if (this._draft.mode !== "toggle" && this._isRadioMember(e))
      return this._draft.selected_button === e;
    const r = this._buttonEntityId(e);
    if (r) {
      const a = this._entityIsOn(r);
      if (a !== null)
        return a;
    }
    return e % 2 === 1;
  }
  _onRingPress(e) {
    if (this._pressedRing = e, window.setTimeout(() => {
      this._pressedRing === e && (this._pressedRing = null);
    }, 180), !(!this._draft || this._draft.mode === "toggle")) {
      if (this._draft.mode === "cover") {
        const t = this._coverDirectionFor(e);
        if (!t)
          return;
        const r = this._coverConfig(), i = t === "open" ? r.close_button : r.open_button;
        this._splitPreviewOn = {
          ...this._splitPreviewOn,
          [e]: !this._splitPreviewOn[e],
          [i]: !1
        };
        return;
      }
      if (this._draft.mode === "radio_split") {
        const t = this._radioGroupFor(e), r = { ...this._splitPreviewOn };
        if (!t)
          r[e] = !r[e];
        else {
          if (r[e])
            return;
          for (const i of t.buttons)
            r[i] = i === e;
        }
        this._splitPreviewOn = r;
        return;
      }
      this._isRadioMember(e) && this._draft.selected_button !== e && this._patchDraft((t) => {
        t.selected_button = e;
      });
    }
  }
  _ringOnColor() {
    var e;
    return J((e = this._draft) == null ? void 0 : e.color_on, qt);
  }
  _ringOffColor() {
    var e;
    return J((e = this._draft) == null ? void 0 : e.color_off, Qe);
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
          <div class="section-body-inner">${i ? r : l}</div>
        </div>
      </section>
    `;
  }
  _renderFaceplate() {
    if (!this._draft)
      return l;
    const e = this._ringOnColor(), t = this._ringOffColor();
    return d`
      <!--
        Faceplate topography matches Zemismart 4-gang: black label bar,
        white glass touch face, 4 LED rings L→R. Rings use profile
        color_on / color_off. Extension point for a future photo skin:
        set --conx-faceplate-skin on .faceplate.
      -->
      <div
        class="faceplate"
        dir="ltr"
        style="--ring-on:${e};--ring-off:${t}"
        role="img"
        aria-label=${this.t("card.preview")}
      >
        <div class="faceplate-bezel">
          <div class="faceplate-skin"></div>
          <div class="faceplate-glass">
            <div class="faceplate-labels">
              ${this._draft.buttons.map(
      (r) => d`
                  <div class="faceplate-label">
                    ${r.name || `L${r.index}`}
                  </div>
                `
    )}
            </div>
            <div class="faceplate-touch">
              <div class="faceplate-rings">
                ${this._draft.buttons.map((r) => {
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
      </div>
    `;
  }
  _renderWizardNav() {
    const e = this._wizardIndex();
    return d`
      <nav class="wizard-steps" aria-label=${this.t("card.wizard")}>
        ${C.map((t, r) => {
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
          ?disabled=${this._busy || e >= C.length - 1}
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
          ${mt.map(
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
        ${pt.map(
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
    return !this._panel || !this._draft ? l : d`
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
      const t = await Oe(
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
  _renderAppearanceFields() {
    return !this._panel || !this._draft ? l : d`
<label class="field">
            <span>${this.t("card.mode")}</span>
            <div class="select-wrap">
              <select
                .value=${this._draft.mode}
                ?disabled=${this._busy}
                @change=${(e) => this._patchDraft((t) => {
      var r;
      if (t.mode = e.target.value, t.mode === "cover")
        t.cover = X(t.cover);
      else if (t.mode === "radio_split")
        this._ensureRadioGroups(t), this._setRadioGroupsOpen(!0);
      else if (t.mode !== "toggle" && (t.selected_button == null || !t.buttons.some(
        (i) => i.index === t.selected_button && i.radio_member !== !1
      ))) {
        const i = ((r = t.buttons.find((a) => a.radio_member !== !1)) == null ? void 0 : r.index) ?? 1;
        t.selected_button = i;
      }
    })}
              >
                ${this._panel.capabilities.modes.map(
      (e) => d`<option value=${e}>${this.t(`mode.${e}`)}</option>`
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
                  style="background:${J(this._draft.color_on)}"
                ></span>
                <select
                  .value=${this._draft.color_on}
                  ?disabled=${this._busy}
                  @change=${(e) => this._patchDraft((t) => {
      t.color_on = e.target.value;
    })}
                >
                  ${this._panel.capabilities.colors.map(
      (e) => d`<option value=${e}>${e}</option>`
    )}
                </select>
              </div>
            </label>
            <label class="field">
              <span>${this.t("card.color_off")}</span>
              <div class="select-wrap color-select">
                <span
                  class="swatch"
                  style="background:${J(this._draft.color_off)}"
                ></span>
                <select
                  .value=${this._draft.color_off}
                  ?disabled=${this._busy}
                  @change=${(e) => this._patchDraft((t) => {
      t.color_off = e.target.value;
    })}
                >
                  ${this._panel.capabilities.colors.map(
      (e) => d`<option value=${e}>${e}</option>`
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
                @change=${(e) => this._patchDraft((t) => {
      t.radar = e.target.value;
    })}
              >
                ${this._panel.capabilities.radar.map(
      (e) => d`<option value=${e}>${e}</option>`
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
                  @change=${(e) => this._patchDraft((t) => {
      t.backlight = e.target.checked;
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
                  @change=${(e) => this._patchDraft((t) => {
      t.child_lock = e.target.checked;
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
              @input=${(e) => this._patchDraft((t) => {
      t.backlight_brightness = Number(
        e.target.value
      );
    })}
            />
          </label>
    `;
  }
  _renderButtonsFields() {
    return !this._panel || !this._draft ? l : d`
      ${this._renderRadioGroupsEditor()} ${this._renderCoverEditor()}
          <div class="buttons-accordion">
            ${this._draft.buttons.map((e) => {
      var g, h, m, b, $;
      const t = !!this._expandedButtons[e.index], r = String(
        ((h = (g = e.action) == null ? void 0 : g.target) == null ? void 0 : h.entity_id) || ""
      ), i = (e.name || "").trim() || "—", a = ((m = e.action) == null ? void 0 : m.action) || "", s = ((b = this._draft) == null ? void 0 : b.mode) === "radio_mandatory" || (($ = this._draft) == null ? void 0 : $.mode) === "radio_optional", o = e.radio_member !== !1, n = this._coverDirectionFor(e.index), c = n ? this.t(
        n === "open" ? "card.cover_open" : "card.cover_close"
      ) : s ? o ? this.t("card.radio_member") : this.t("card.radio_toggle") : "", _ = [a, r, c].filter(Boolean).join(" · ") || "—";
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
                                @input=${(w) => this._onButtonNameInput(e.index, w)}
                              />
                            </label>
                            <label class="field">
                              <span>${this.t("card.action")}</span>
                              <input
                                type="text"
                                .value=${a}
                                placeholder="light.toggle"
                                ?disabled=${this._busy}
                                @input=${(w) => this._onButtonActionInput(e.index, w)}
                              />
                            </label>
                            <label class="field">
                              <span>${this.t("card.entity_id")}</span>
                              <input
                                type="text"
                                .value=${r}
                                placeholder="light.living_room"
                                ?disabled=${this._busy}
                                @input=${(w) => this._onButtonEntityInput(e.index, w)}
                              />
                            </label>
                            ${s ? d`
                                  <label class="field">
                                    <span>${this.t("card.radio_participation")}</span>
                                    <div class="select-wrap">
                                      <select
                                        .value=${o ? "radio" : "toggle"}
                                        ?disabled=${this._busy}
                                        @change=${(w) => this._patchDraft((Kt) => {
        const vt = Kt.buttons.find(
          (Qt) => Qt.index === e.index
        );
        vt && (vt.radio_member = w.target.value === "radio");
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
                                ` : l}
                          ` : l}
                    </div>
                  </div>
                </div>
              `;
    })}
          </div>
    `;
  }
  _renderStepEdit() {
    return !this._panel || !this._draft ? l : d`
      ${this._renderAppearanceFields()}
      ${this._renderButtonsFields()}
    `;
  }
  _renderStepReview() {
    return !this._draft || !this._panel ? l : d`
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
              ${this.t("card.cover_open_button")} L${this._coverConfig().open_button} ·
              ${this.t("card.cover_close_button")} L${this._coverConfig().close_button} ·
              ${this._coverConfig().open_time_s}${this.t("card.cover_seconds")} /
              ${this._coverConfig().close_time_s}${this.t("card.cover_seconds")}
            </div>` : l}
      </div>
      ${this._renderFaceplate()} ${this._renderCoverControl()}
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
    `;
  }
  _renderStepTransfer() {
    if (!this._panel || !this._config)
      return l;
    const e = this._serviceYaml || this._buildServiceYaml();
    return d`
      <div class="schema-box">
        <div class="schema-title">${this.t("card.schema_title")}</div>
        <p>${this.t("card.schema_body")}</p>
        <pre class="schema-pre">{
  "schema_version": 1,
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
        {"index": 1, "name": "L1", "action": null, "radio_member": true}
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
        return l;
    }
  }
  render() {
    var r;
    const e = Vt(this._language);
    if (!((r = this._config) != null && r.entry_id))
      return d`<ha-card class="conx-card"><div class="pad">${this.t("card.missing_entry")}</div></ha-card>`;
    if (this._loading && !this._panel)
      return d`<ha-card class="conx-card"><div class="pad">${this.t("card.loading")}</div></ha-card>`;
    if (!this._panel || !this._draft)
      return d`<ha-card class="conx-card"><div class="pad error">${this._error || this.t("card.loading")}</div></ha-card>`;
    const t = !!this._config.compact;
    return d`
      <ha-card
        dir=${e ? "rtl" : "ltr"}
        data-theme=${this._theme}
        class="conx-card theme-${this._theme} ${this._view === "export" ? "export-open" : "editor-open"} ${this._menuOpen ? "menu-open" : ""} ${t ? "compact" : ""} ${this._syncPulse ? "syncing-pulse" : ""}"
      >
        <div class="atmosphere"></div>
        <div class="header" dir="ltr">
          <div class="header-side">
            <div class="badge status-${this._panel.sync_status}">
              ${this.t("card.status")}: ${this._panel.sync_status}
            </div>
            <button
              type="button"
              class="menu-btn"
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

        ${this._dirty ? d`<div class="warn">${this.t("card.unsaved")}</div>` : l}
        ${this._notice ? d`<div class="notice">${this._notice}</div>` : l}
        ${this._error || this._panel.last_error ? d`<div class="error">${this._error || this._panel.last_error}</div>` : l}

        ${this._renderMainEditor()}
        ${this._menuOpen ? this._renderSettingsMenu() : l}
        ${this._automationOpen ? this._renderAutomationExample() : l}
        ${this._view === "export" ? this._renderExportView() : l}
      </ha-card>
    `;
  }
  _renderSettingsMenu() {
    return d`
      <div
        class="conx-layer"
        @click=${(e) => {
      e.target === e.currentTarget && (this._menuOpen = !1);
    }}
      >
        <aside class="conx-panel compact" role="dialog" aria-modal="true">
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
          <div class="menu-section">
            <span class="menu-label">${this.t("card.language")}</span>
            <div class="lang-flags" role="group" aria-label=${this.t("card.language")}>
              ${pt.map(
      (e) => d`
                  <button
                    type="button"
                    class="lang-btn ${this._language === e.id ? "active" : ""}"
                    ?disabled=${this._busy}
                    title=${e.label}
                    @click=${() => this._setLanguage(e.id)}
                  >
                    ${this._renderFlag(e.flag)}
                    <span class="lang-code">${e.id.toUpperCase()}</span>
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
            <div class="menu-actions">
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
                class="btn primary"
                ?disabled=${this._busy}
                @click=${() => {
      this._menuOpen = !1, this._openExportWizard();
    }}
              >
                ${this.t("card.open_export_wizard")}
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
            <div class="menu-actions">
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
      return l;
    const e = [
      "profiles",
      "appearance",
      "buttons"
    ], t = {
      profiles: this.t("card.profiles"),
      appearance: this.t("card.editor"),
      buttons: this.t("card.buttons")
    };
    return d`
      <div class="layout single-layout">
        <section class="hero-preview ${this._previewOpen ? "open" : "closed"}">
          <header class="section-head">
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
          ${this._previewOpen ? d`<div class="hero-body">
                ${this._renderFaceplate()} ${this._renderCoverControl()}
              </div>` : l}
        </section>

        <p class="layout-hint">${this.t("card.tabs_hint")}</p>

        <div class="settings-tabs">
          <div class="tab-bar" role="tablist">
            ${e.map(
      (r, i) => d`
                <button
                  type="button"
                  class="tab-btn ${this._activeTab === r ? "active" : ""}"
                  role="tab"
                  aria-selected=${this._activeTab === r ? "true" : "false"}
                  ?disabled=${this._busy}
                  @click=${() => {
        this._activeTab = r;
      }}
                >
                  <span class="tab-step">${this.t(`card.step_${i + 1}`)}</span>
                  <span class="tab-label">${t[r]}</span>
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
          </div>
        </div>

        <div class="actions-dock">
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
      </div>
    `;
  }
  _renderExportView() {
    return d`
      <div
        class="conx-layer"
        @click=${(e) => {
      e.target === e.currentTarget && this._backToEditor();
    }}
      >
        <div class="conx-panel wide" role="dialog" aria-modal="true">
          <div class="menu-head">
            <div class="export-title">${this.t("card.step_transfer")}</div>
            <button type="button" class="menu-close" @click=${this._backToEditor}>
              ×
            </button>
          </div>
          <p class="export-hint">${this.t("card.step_transfer_hint")}</p>
          <div class="export-actions">
            <button
              type="button"
              class="btn success"
              ?disabled=${this._busy}
              @click=${this._export}
            >
              ${this.t("card.export")}
            </button>
            <button
              type="button"
              class="btn"
              ?disabled=${this._busy}
              @click=${() => {
      this._importMode = "merge", this._openImport();
    }}
            >
              ${this.t("card.import_merge")}
            </button>
            <button
              type="button"
              class="btn danger"
              ?disabled=${this._busy}
              @click=${() => {
      this._importMode = "replace", this._openImport();
    }}
            >
              ${this.t("card.import_replace")}
            </button>
          </div>
          <div class="export-details">${this._renderStepTransfer()}</div>
          <div class="export-footer">
            <button
              type="button"
              class="btn"
              ?disabled=${this._busy}
              @click=${this._backToEditor}
            >
              ← ${this.t("card.back_to_editor")}
            </button>
          </div>
        </div>
      </div>
    `;
  }
};
p.styles = It`
    :host {
      display: block;
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
      --conx-gap: 12px;
    }


    ha-card.conx-card {
      position: relative;
      overflow: hidden;
      font-family: var(--conx-font);
      color: var(--text);
      background:
        linear-gradient(180deg, rgba(255,255,255,.08) 0%, transparent 36%),
        linear-gradient(165deg, #262b34 0%, #1a1d22 44%, #15181e 100%);
      border: 1px solid var(--border);
      box-shadow: var(--card-shadow);
      padding: 18px;

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
      --accent-text: #ffffff;
      --danger: #b42318;
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
        radial-gradient(circle at 12% 0%, var(--conx-atm-1), transparent 42%),
        radial-gradient(circle at 88% 100%, var(--conx-atm-2), transparent 40%),
        repeating-linear-gradient(
          -18deg,
          transparent,
          transparent 10px,
          color-mix(in srgb, #0b1218 2.5%, transparent) 10px,
          color-mix(in srgb, #0b1218 2.5%, transparent) 11px
        );
      opacity: 0.55;
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
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }
    .theme-swatch {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 7px;
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
      min-width: 72px;
      font: inherit;
    }
    .theme-swatch:hover {
      color: var(--text);
    }
    .theme-swatch.active {
      color: var(--text);
    }
    .theme-swatch-face {
      display: block;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--swatch);
      border: 2px solid var(--border);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    }
    .theme-swatch.active .theme-swatch-face {
      border-color: var(--swatch-accent, var(--conx-accent));
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--swatch-accent, var(--conx-accent)) 40%, transparent);
    }
    .theme-swatch-name {
      font-size: 0.72rem;
      font-weight: 600;
      line-height: 1.25;
      text-align: start;
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

    .header,
    .warn,
    .error,
    .notice,
    .layout {
      position: relative;
      z-index: 1;
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
      gap: 5px;
      margin-bottom: 10px;
      font-size: 0.9rem;
    }

    .field > span {
      font-weight: 500;
      opacity: 0.85;
    }

    input[type="text"],
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
      margin: 4px 0 10px;
      padding: 12px;
      border-radius: 14px;
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
      margin: 8px 0 10px;
      font-size: 0.85rem;
      color: var(--text-muted);
      line-height: 1.45;
    }
    .radio-group-card {
      padding: 10px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: var(--input-bg, var(--surface));
      margin-bottom: 8px;
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
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
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
      background: var(--accent-soft);
      color: var(--text);
      box-shadow: inset 0 0 0 1px var(--accent);
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
      margin: 4px 0 10px;
      padding: 12px;
      border-radius: 14px;
      border: 1px solid var(--border);
      background: color-mix(in srgb, var(--surface-2, var(--surface)) 88%, transparent);
    }
    .cover-section .menu-label {
      display: block;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-muted);
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
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 6px;
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
      border-radius: 11px;
      border: 1px solid var(--border);
      background: var(--btn-bg);
      padding: 8px 12px;
      box-shadow:
        inset 0 1px 0 var(--bevel-light),
        0 2px 6px rgba(0, 0, 0, 0.18);
      transition: transform 120ms ease, filter 120ms ease;
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-1px);
      filter: brightness(1.04);
    }

    .btn:active:not(:disabled) {
      transform: translateY(1px);
    }

    .btn.primary {
      background: var(--btn-primary-bg);
      color: var(--btn-primary-text);
      border-color: color-mix(in srgb, var(--accent) 55%, #000);
      font-weight: 700;
    }

    .btn.danger {
      color: #ffffff;
      background: var(--danger);
      border-color: var(--danger);
    }

    .btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
      transform: none;
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

    .button-edit.open .button-edit-chevron {
      transform: rotate(45deg);
    }

    :host([dir="rtl"]) .button-edit.open .button-edit-chevron,
    ha-card[dir="rtl"] .button-edit.open .button-edit-chevron {
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

    /* Zemismart 4-gang faceplate recreation (labels top / rings bottom, 1×4). */
    .faceplate {
      padding: 14px;
      border-radius: 16px;
      background: var(--faceplate-well);
      box-shadow:
        inset 0 2px 8px rgba(0, 0, 0, 0.28),
        inset 0 1px 0 rgba(255, 255, 255, 0.06);
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

    .header {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 10px;
    }
    .header-side {
      display: flex;
      align-items: center;
      gap: 10px;
      direction: ltr;
    }
    .menu-btn {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      border: 1px solid var(--btn-border, var(--border));
      background: var(--btn-bg);
      display: inline-grid;
      place-items: center;
      gap: 4px;
      cursor: pointer;
      padding: 10px 9px;
    }
    .menu-btn span {
      display: block;
      width: 18px;
      height: 2px;
      border-radius: 2px;
      background: var(--text);
    }
    .conx-layer {
      position: absolute;
      inset: 0;
      z-index: 20;
      display: grid;
      place-items: center;
      padding: 16px;
      background: rgba(8, 12, 18, 0.55);
      backdrop-filter: blur(2px);
    }
    .conx-panel {
      width: min(100%, 420px);
      max-height: min(86vh, 720px);
      overflow: auto;
      border-radius: 18px;
      border: 1px solid var(--border);
      background: var(--surface-2, var(--surface));
      box-shadow: var(--card-shadow);
      padding: 14px;
    }
    .conx-panel.wide { width: min(100%, 560px); }
    .conx-panel.xwide { width: min(100%, 760px); max-height: min(90vh, 860px); }
    .automation-hint {
      margin: 0 0 12px;
      color: var(--text-muted);
      font-size: 0.9rem;
      line-height: 1.5;
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
    .lang-flags {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
    }
    .hero-preview {
      border-radius: 16px;
      border: 1px solid var(--border);
      background: var(--surface-2);
      overflow: hidden;
      margin-bottom: 10px;
    }
    .hero-preview .section-head {
      display: grid;
      grid-template-columns: 1fr auto auto;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-bottom: 1px solid var(--border);
    }
    .hero-profile-name {
      font-family: var(--conx-display);
      font-weight: 700;
      font-size: 1.05rem;
      text-align: center;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .hero-body {
      padding: 16px;
      background: var(--faceplate-well);
    }
    .layout-hint {
      margin: 0 0 10px;
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .tab-bar {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 6px;
      margin-bottom: 10px;
    }
    .tab-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      border-radius: 14px;
      border: 1px solid var(--btn-border, var(--border));
      background: var(--btn-bg);
      color: var(--text-muted);
      padding: 10px 8px;
      cursor: pointer;
      font: inherit;
    }
    .tab-btn.active {
      border-color: var(--accent);
      background: var(--accent-soft);
      color: var(--text);
    }
    .tab-step {
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .tab-label {
      font-family: var(--conx-display);
      font-size: 1.02rem;
      font-weight: 600;
    }
    .tab-panel { display: none; padding: 4px 0 8px; }
    .tab-panel.active { display: block; }
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
    .actions-dock { margin-top: 12px; }
    .actions-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
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
      min-width: 3.4em;
      text-align: end;
      font-variant-numeric: tabular-nums;
    }
    .dimmer-field input[type="range"] {
      width: 100%;
      height: 28px;
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
u([
  gt({ attribute: !1 })
], p.prototype, "hass", 2);
u([
  f()
], p.prototype, "_config", 2);
u([
  f()
], p.prototype, "_panel", 2);
u([
  f()
], p.prototype, "_draft", 2);
u([
  f()
], p.prototype, "_saved", 2);
u([
  f()
], p.prototype, "_error", 2);
u([
  f()
], p.prototype, "_notice", 2);
u([
  f()
], p.prototype, "_loading", 2);
u([
  f()
], p.prototype, "_busy", 2);
u([
  f()
], p.prototype, "_syncPulse", 2);
u([
  f()
], p.prototype, "_pressedRing", 2);
u([
  f()
], p.prototype, "_splitPreviewOn", 2);
u([
  f()
], p.prototype, "_uiLang", 2);
u([
  f()
], p.prototype, "_theme", 2);
u([
  f()
], p.prototype, "_view", 2);
u([
  f()
], p.prototype, "_wizardStep", 2);
u([
  f()
], p.prototype, "_importMode", 2);
u([
  f()
], p.prototype, "_serviceYaml", 2);
u([
  f()
], p.prototype, "_sections", 2);
u([
  f()
], p.prototype, "_expandedButtons", 2);
u([
  f()
], p.prototype, "_activeTab", 2);
u([
  f()
], p.prototype, "_menuOpen", 2);
u([
  f()
], p.prototype, "_automationOpen", 2);
u([
  f()
], p.prototype, "_previewOpen", 2);
u([
  f()
], p.prototype, "_panelNameDraft", 2);
u([
  f()
], p.prototype, "_radioGroupsOpen", 2);
p = u([
  Yt("conx-dynamic-panel-card")
], p);
var rr = Object.defineProperty, ir = Object.getOwnPropertyDescriptor, bt = (e, t, r, i) => {
  for (var a = i > 1 ? void 0 : i ? ir(t, r) : t, s = e.length - 1, o; s >= 0; s--)
    (o = e[s]) && (a = (i ? o(t, r, a) : o(a)) || a);
  return i && a && rr(t, r, a), a;
};
let G = class extends z {
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
    const e = Vt(this._language);
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
            .value=${Y(this._config.language || this._language)}
            @change=${(t) => this._valueChanged({
      language: t.target.value
    })}
          >
            ${pt.map(
      (t) => d`<option value=${t.id}>${t.label}</option>`
    )}
          </select>
        </label>
        <label>
          ${P(this._language, "card.theme")}
          <select
            .value=${tt(this._config.theme)}
            @change=${(t) => this._valueChanged({
      theme: t.target.value
    })}
          >
            ${mt.map(
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
G.styles = It`
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
bt([
  gt({ attribute: !1 })
], G.prototype, "hass", 2);
bt([
  f()
], G.prototype, "_config", 2);
G = bt([
  Yt("conx-dynamic-panel-card-editor")
], G);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "conx-dynamic-panel-card",
  name: "ConX Dynamic Panel Card",
  description: "Private ConX card for multi-profile smart panels",
  preview: !0
});
//# sourceMappingURL=conx-dynamic-panel-card.js.map
