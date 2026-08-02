/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const F = globalThis, at = F.ShadowRoot && (F.ShadyCSS === void 0 || F.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, nt = Symbol(), ht = /* @__PURE__ */ new WeakMap();
let Pt = class {
  constructor(t, r, i) {
    if (this._$cssResult$ = !0, i !== nt) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = r;
  }
  get styleSheet() {
    let t = this.o;
    const r = this.t;
    if (at && t === void 0) {
      const i = r !== void 0 && r.length === 1;
      i && (t = ht.get(r)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && ht.set(r, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const Gt = (e) => new Pt(typeof e == "string" ? e : e + "", void 0, nt), Ct = (e, ...t) => {
  const r = e.length === 1 ? e[0] : t.reduce((i, a, n) => i + ((s) => {
    if (s._$cssResult$ === !0) return s.cssText;
    if (typeof s == "number") return s;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + s + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(a) + e[n + 1], e[0]);
  return new Pt(r, e, nt);
}, Ft = (e, t) => {
  if (at) e.adoptedStyleSheets = t.map((r) => r instanceof CSSStyleSheet ? r : r.styleSheet);
  else for (const r of t) {
    const i = document.createElement("style"), a = F.litNonce;
    a !== void 0 && i.setAttribute("nonce", a), i.textContent = r.cssText, e.appendChild(i);
  }
}, ut = at ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((t) => {
  let r = "";
  for (const i of t.cssRules) r += i.cssText;
  return Gt(r);
})(e) : e;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Wt, defineProperty: Jt, getOwnPropertyDescriptor: Xt, getOwnPropertyNames: Vt, getOwnPropertySymbols: qt, getPrototypeOf: Zt } = Object, $ = globalThis, ft = $.trustedTypes, Kt = ft ? ft.emptyScript : "", q = $.reactiveElementPolyfillSupport, M = (e, t) => e, W = { toAttribute(e, t) {
  switch (t) {
    case Boolean:
      e = e ? Kt : null;
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
} }, st = (e, t) => !Wt(e, t), gt = { attribute: !0, type: String, converter: W, reflect: !1, useDefault: !1, hasChanged: st };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), $.litPropertyMetadata ?? ($.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let O = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, r = gt) {
    if (r.state && (r.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((r = Object.create(r)).wrapped = !0), this.elementProperties.set(t, r), !r.noAccessor) {
      const i = Symbol(), a = this.getPropertyDescriptor(t, i, r);
      a !== void 0 && Jt(this.prototype, t, a);
    }
  }
  static getPropertyDescriptor(t, r, i) {
    const { get: a, set: n } = Xt(this.prototype, t) ?? { get() {
      return this[r];
    }, set(s) {
      this[r] = s;
    } };
    return { get: a, set(s) {
      const o = a == null ? void 0 : a.call(this);
      n == null || n.call(this, s), this.requestUpdate(t, o, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? gt;
  }
  static _$Ei() {
    if (this.hasOwnProperty(M("elementProperties"))) return;
    const t = Zt(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(M("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(M("properties"))) {
      const r = this.properties, i = [...Vt(r), ...qt(r)];
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
      for (const a of i) r.unshift(ut(a));
    } else t !== void 0 && r.push(ut(t));
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
    return Ft(t, this.constructor.elementStyles), t;
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
    var n;
    const i = this.constructor.elementProperties.get(t), a = this.constructor._$Eu(t, i);
    if (a !== void 0 && i.reflect === !0) {
      const s = (((n = i.converter) == null ? void 0 : n.toAttribute) !== void 0 ? i.converter : W).toAttribute(r, i.type);
      this._$Em = t, s == null ? this.removeAttribute(a) : this.setAttribute(a, s), this._$Em = null;
    }
  }
  _$AK(t, r) {
    var n, s;
    const i = this.constructor, a = i._$Eh.get(t);
    if (a !== void 0 && this._$Em !== a) {
      const o = i.getPropertyOptions(a), c = typeof o.converter == "function" ? { fromAttribute: o.converter } : ((n = o.converter) == null ? void 0 : n.fromAttribute) !== void 0 ? o.converter : W;
      this._$Em = a;
      const h = c.fromAttribute(r, o.type);
      this[a] = h ?? ((s = this._$Ej) == null ? void 0 : s.get(a)) ?? h, this._$Em = null;
    }
  }
  requestUpdate(t, r, i, a = !1, n) {
    var s;
    if (t !== void 0) {
      const o = this.constructor;
      if (a === !1 && (n = this[t]), i ?? (i = o.getPropertyOptions(t)), !((i.hasChanged ?? st)(n, r) || i.useDefault && i.reflect && n === ((s = this._$Ej) == null ? void 0 : s.get(t)) && !this.hasAttribute(o._$Eu(t, i)))) return;
      this.C(t, r, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, r, { useDefault: i, reflect: a, wrapped: n }, s) {
    i && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(t) && (this._$Ej.set(t, s ?? r ?? this[t]), n !== !0 || s !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (r = void 0), this._$AL.set(t, r)), a === !0 && this._$Em !== t && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(t));
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
        for (const [n, s] of this._$Ep) this[n] = s;
        this._$Ep = void 0;
      }
      const a = this.constructor.elementProperties;
      if (a.size > 0) for (const [n, s] of a) {
        const { wrapped: o } = s, c = this[n];
        o !== !0 || this._$AL.has(n) || c === void 0 || this.C(n, void 0, s, c);
      }
    }
    let t = !1;
    const r = this._$AL;
    try {
      t = this.shouldUpdate(r), t ? (this.willUpdate(r), (i = this._$EO) == null || i.forEach((a) => {
        var n;
        return (n = a.hostUpdate) == null ? void 0 : n.call(a);
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
O.elementStyles = [], O.shadowRootOptions = { mode: "open" }, O[M("elementProperties")] = /* @__PURE__ */ new Map(), O[M("finalized")] = /* @__PURE__ */ new Map(), q == null || q({ ReactiveElement: O }), ($.reactiveElementVersions ?? ($.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const L = globalThis, _t = (e) => e, J = L.trustedTypes, mt = J ? J.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, zt = "$lit$", y = `lit$${Math.random().toFixed(9).slice(2)}$`, Rt = "?" + y, Qt = `<${Rt}>`, A = document, I = () => A.createComment(""), B = (e) => e === null || typeof e != "object" && typeof e != "function", ot = Array.isArray, te = (e) => ot(e) || typeof (e == null ? void 0 : e[Symbol.iterator]) == "function", Z = `[ 	
\f\r]`, T = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, bt = /-->/g, xt = />/g, w = RegExp(`>|${Z}(?:([^\\s"'>=/]+)(${Z}*=${Z}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), vt = /'/g, yt = /"/g, Tt = /^(?:script|style|textarea|title)$/i, ee = (e) => (t, ...r) => ({ _$litType$: e, strings: t, values: r }), d = ee(1), z = Symbol.for("lit-noChange"), l = Symbol.for("lit-nothing"), $t = /* @__PURE__ */ new WeakMap(), k = A.createTreeWalker(A, 129);
function Nt(e, t) {
  if (!ot(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return mt !== void 0 ? mt.createHTML(t) : t;
}
const re = (e, t) => {
  const r = e.length - 1, i = [];
  let a, n = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", s = T;
  for (let o = 0; o < r; o++) {
    const c = e[o];
    let h, _, u = -1, m = 0;
    for (; m < c.length && (s.lastIndex = m, _ = s.exec(c), _ !== null); ) m = s.lastIndex, s === T ? _[1] === "!--" ? s = bt : _[1] !== void 0 ? s = xt : _[2] !== void 0 ? (Tt.test(_[2]) && (a = RegExp("</" + _[2], "g")), s = w) : _[3] !== void 0 && (s = w) : s === w ? _[0] === ">" ? (s = a ?? T, u = -1) : _[1] === void 0 ? u = -2 : (u = s.lastIndex - _[2].length, h = _[1], s = _[3] === void 0 ? w : _[3] === '"' ? yt : vt) : s === yt || s === vt ? s = w : s === bt || s === xt ? s = T : (s = w, a = void 0);
    const x = s === w && e[o + 1].startsWith("/>") ? " " : "";
    n += s === T ? c + Qt : u >= 0 ? (i.push(h), c.slice(0, u) + zt + c.slice(u) + y + x) : c + y + (u === -2 ? o : x);
  }
  return [Nt(e, n + (e[r] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class U {
  constructor({ strings: t, _$litType$: r }, i) {
    let a;
    this.parts = [];
    let n = 0, s = 0;
    const o = t.length - 1, c = this.parts, [h, _] = re(t, r);
    if (this.el = U.createElement(h, i), k.currentNode = this.el.content, r === 2 || r === 3) {
      const u = this.el.content.firstChild;
      u.replaceWith(...u.childNodes);
    }
    for (; (a = k.nextNode()) !== null && c.length < o; ) {
      if (a.nodeType === 1) {
        if (a.hasAttributes()) for (const u of a.getAttributeNames()) if (u.endsWith(zt)) {
          const m = _[s++], x = a.getAttribute(u).split(y), b = /([.?@])?(.*)/.exec(m);
          c.push({ type: 1, index: n, name: b[2], strings: x, ctor: b[1] === "." ? ae : b[1] === "?" ? ne : b[1] === "@" ? se : X }), a.removeAttribute(u);
        } else u.startsWith(y) && (c.push({ type: 6, index: n }), a.removeAttribute(u));
        if (Tt.test(a.tagName)) {
          const u = a.textContent.split(y), m = u.length - 1;
          if (m > 0) {
            a.textContent = J ? J.emptyScript : "";
            for (let x = 0; x < m; x++) a.append(u[x], I()), k.nextNode(), c.push({ type: 2, index: ++n });
            a.append(u[m], I());
          }
        }
      } else if (a.nodeType === 8) if (a.data === Rt) c.push({ type: 2, index: n });
      else {
        let u = -1;
        for (; (u = a.data.indexOf(y, u + 1)) !== -1; ) c.push({ type: 7, index: n }), u += y.length - 1;
      }
      n++;
    }
  }
  static createElement(t, r) {
    const i = A.createElement("template");
    return i.innerHTML = t, i;
  }
}
function R(e, t, r = e, i) {
  var s, o;
  if (t === z) return t;
  let a = i !== void 0 ? (s = r._$Co) == null ? void 0 : s[i] : r._$Cl;
  const n = B(t) ? void 0 : t._$litDirective$;
  return (a == null ? void 0 : a.constructor) !== n && ((o = a == null ? void 0 : a._$AO) == null || o.call(a, !1), n === void 0 ? a = void 0 : (a = new n(e), a._$AT(e, r, i)), i !== void 0 ? (r._$Co ?? (r._$Co = []))[i] = a : r._$Cl = a), a !== void 0 && (t = R(e, a._$AS(e, t.values), a, i)), t;
}
class ie {
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
    k.currentNode = a;
    let n = k.nextNode(), s = 0, o = 0, c = i[0];
    for (; c !== void 0; ) {
      if (s === c.index) {
        let h;
        c.type === 2 ? h = new Y(n, n.nextSibling, this, t) : c.type === 1 ? h = new c.ctor(n, c.name, c.strings, this, t) : c.type === 6 && (h = new oe(n, this, t)), this._$AV.push(h), c = i[++o];
      }
      s !== (c == null ? void 0 : c.index) && (n = k.nextNode(), s++);
    }
    return k.currentNode = A, a;
  }
  p(t) {
    let r = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, r), r += i.strings.length - 2) : i._$AI(t[r])), r++;
  }
}
class Y {
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
    t = R(this, t, r), B(t) ? t === l || t == null || t === "" ? (this._$AH !== l && this._$AR(), this._$AH = l) : t !== this._$AH && t !== z && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : te(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== l && B(this._$AH) ? this._$AA.nextSibling.data = t : this.T(A.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    var n;
    const { values: r, _$litType$: i } = t, a = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = U.createElement(Nt(i.h, i.h[0]), this.options)), i);
    if (((n = this._$AH) == null ? void 0 : n._$AD) === a) this._$AH.p(r);
    else {
      const s = new ie(a, this), o = s.u(this.options);
      s.p(r), this.T(o), this._$AH = s;
    }
  }
  _$AC(t) {
    let r = $t.get(t.strings);
    return r === void 0 && $t.set(t.strings, r = new U(t)), r;
  }
  k(t) {
    ot(this._$AH) || (this._$AH = [], this._$AR());
    const r = this._$AH;
    let i, a = 0;
    for (const n of t) a === r.length ? r.push(i = new Y(this.O(I()), this.O(I()), this, this.options)) : i = r[a], i._$AI(n), a++;
    a < r.length && (this._$AR(i && i._$AB.nextSibling, a), r.length = a);
  }
  _$AR(t = this._$AA.nextSibling, r) {
    var i;
    for ((i = this._$AP) == null ? void 0 : i.call(this, !1, !0, r); t !== this._$AB; ) {
      const a = _t(t).nextSibling;
      _t(t).remove(), t = a;
    }
  }
  setConnected(t) {
    var r;
    this._$AM === void 0 && (this._$Cv = t, (r = this._$AP) == null || r.call(this, t));
  }
}
class X {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, r, i, a, n) {
    this.type = 1, this._$AH = l, this._$AN = void 0, this.element = t, this.name = r, this._$AM = a, this.options = n, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = l;
  }
  _$AI(t, r = this, i, a) {
    const n = this.strings;
    let s = !1;
    if (n === void 0) t = R(this, t, r, 0), s = !B(t) || t !== this._$AH && t !== z, s && (this._$AH = t);
    else {
      const o = t;
      let c, h;
      for (t = n[0], c = 0; c < n.length - 1; c++) h = R(this, o[i + c], r, c), h === z && (h = this._$AH[c]), s || (s = !B(h) || h !== this._$AH[c]), h === l ? t = l : t !== l && (t += (h ?? "") + n[c + 1]), this._$AH[c] = h;
    }
    s && !a && this.j(t);
  }
  j(t) {
    t === l ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class ae extends X {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === l ? void 0 : t;
  }
}
class ne extends X {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== l);
  }
}
class se extends X {
  constructor(t, r, i, a, n) {
    super(t, r, i, a, n), this.type = 5;
  }
  _$AI(t, r = this) {
    if ((t = R(this, t, r, 0) ?? l) === z) return;
    const i = this._$AH, a = t === l && i !== l || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, n = t !== l && (i === l || a);
    a && this.element.removeEventListener(this.name, this, i), n && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    var r;
    typeof this._$AH == "function" ? this._$AH.call(((r = this.options) == null ? void 0 : r.host) ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class oe {
  constructor(t, r, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = r, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    R(this, t);
  }
}
const K = L.litHtmlPolyfillSupport;
K == null || K(U, Y), (L.litHtmlVersions ?? (L.litHtmlVersions = [])).push("3.3.3");
const ce = (e, t, r) => {
  const i = (r == null ? void 0 : r.renderBefore) ?? t;
  let a = i._$litPart$;
  if (a === void 0) {
    const n = (r == null ? void 0 : r.renderBefore) ?? null;
    i._$litPart$ = a = new Y(t.insertBefore(I(), n), n, void 0, r ?? {});
  }
  return a._$AI(e), a;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const S = globalThis;
class C extends O {
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
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = ce(r, this.renderRoot, this.renderOptions);
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
    return z;
  }
}
var Ot;
C._$litElement$ = !0, C.finalized = !0, (Ot = S.litElementHydrateSupport) == null || Ot.call(S, { LitElement: C });
const Q = S.litElementPolyfillSupport;
Q == null || Q({ LitElement: C });
(S.litElementVersions ?? (S.litElementVersions = [])).push("4.2.2");
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
const de = { attribute: !0, type: String, converter: W, reflect: !1, hasChanged: st }, le = (e = de, t, r) => {
  const { kind: i, metadata: a } = r;
  let n = globalThis.litPropertyMetadata.get(a);
  if (n === void 0 && globalThis.litPropertyMetadata.set(a, n = /* @__PURE__ */ new Map()), i === "setter" && ((e = Object.create(e)).wrapped = !0), n.set(r.name, e), i === "accessor") {
    const { name: s } = r;
    return { set(o) {
      const c = t.get.call(this);
      t.set.call(this, o), this.requestUpdate(s, c, e, !0, o);
    }, init(o) {
      return o !== void 0 && this.C(s, void 0, e, o), o;
    } };
  }
  if (i === "setter") {
    const { name: s } = r;
    return function(o) {
      const c = this[s];
      t.call(this, o), this.requestUpdate(s, c, e, !0, o);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function ct(e) {
  return (t, r) => typeof r == "object" ? le(e, t, r) : ((i, a, n) => {
    const s = a.hasOwnProperty(n);
    return a.constructor.createProperty(n, i), s ? Object.getOwnPropertyDescriptor(a, n) : void 0;
  })(e, t, r);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function g(e) {
  return ct({ ...e, state: !0, attribute: !1 });
}
async function wt(e, t) {
  return e.callWS({
    type: "conx_dynamic_panel/get_config",
    entry_id: t
  });
}
async function pe(e, t, r, i) {
  return e.callWS({
    type: "conx_dynamic_panel/update_profile",
    entry_id: t,
    profile_id: r,
    profile: i
  });
}
async function he(e, t, r) {
  return e.callWS({
    type: "conx_dynamic_panel/create_profile",
    entry_id: t,
    profile: r
  });
}
async function ue(e, t, r) {
  await e.callWS({
    type: "conx_dynamic_panel/delete_profile",
    entry_id: t,
    profile_id: r
  });
}
async function fe(e, t, r, i, a) {
  return e.callWS({
    type: "conx_dynamic_panel/duplicate_profile",
    entry_id: t,
    profile_id: r,
    new_id: i,
    new_name: a
  });
}
async function tt(e, t, r, i = !1) {
  return e.callWS({
    type: "conx_dynamic_panel/set_active_profile",
    entry_id: t,
    profile_id: r,
    sync: i
  });
}
async function ge(e, t) {
  return e.callWS({
    type: "conx_dynamic_panel/sync",
    entry_id: t
  });
}
async function _e(e, t) {
  return e.callWS({
    type: "conx_dynamic_panel/pull",
    entry_id: t
  });
}
async function me(e, t) {
  return e.callWS({
    type: "conx_dynamic_panel/export_profiles",
    entry_id: t
  });
}
async function be(e, t, r, i = "merge") {
  return e.callWS({
    type: "conx_dynamic_panel/import_profiles",
    entry_id: t,
    payload: r,
    mode: i
  });
}
async function xe(e, t, r) {
  return e.callWS({
    type: "conx_dynamic_panel/update_panel_name",
    entry_id: t,
    panel_name: r
  });
}
function ve(e) {
  const t = structuredClone(e);
  typeof t.backlight_brightness != "number" || !Number.isFinite(t.backlight_brightness) ? t.backlight_brightness = 100 : t.backlight_brightness = Math.max(
    0,
    Math.min(100, Math.round(t.backlight_brightness))
  ), t.buttons = [1, 2, 3, 4].map((a) => {
    var s;
    const n = (s = t.buttons) == null ? void 0 : s.find((o) => o.index === a);
    return {
      index: a,
      name: (n == null ? void 0 : n.name) ?? `Button ${a}`,
      action: (n == null ? void 0 : n.action) ?? null,
      radio_member: (n == null ? void 0 : n.radio_member) !== !1
    };
  });
  const i = (Array.isArray(t.radio_groups) ? t.radio_groups : []).map((a, n) => ({
    id: String((a == null ? void 0 : a.id) || `g${n + 1}`),
    buttons: Array.isArray(a == null ? void 0 : a.buttons) ? a.buttons.map((s) => Number(s)).filter((s, o, c) => s >= 1 && s <= 4 && c.indexOf(s) === o) : []
  }));
  for (; i.length < 2; )
    i.push({ id: `g${i.length + 1}`, buttons: [] });
  return t.radio_groups = i, t;
}
function N(e) {
  return ve(e);
}
function ye(e, t) {
  return !e || !t ? e === t : JSON.stringify(e) === JSON.stringify(t);
}
function $e(e, t) {
  const r = new Blob([JSON.stringify(t, null, 2)], {
    type: "application/json"
  }), i = URL.createObjectURL(r), a = document.createElement("a");
  a.href = i, a.download = e, a.click(), URL.revokeObjectURL(i);
}
const we = "YOUR_ENTRY_ID", et = [
  { id: "morning", at: "06:30:00", profile: "morning" },
  { id: "evening", at: "18:00:00", profile: "evening" },
  { id: "night", at: "23:00:00", profile: "night" }
];
function kt(e, t) {
  const r = (e || "").trim();
  return r || t;
}
function rt(e) {
  return String(e).split(`
`).map((t) => `# ${t.trim()}`.trimEnd());
}
function ke(e) {
  const { comments: t } = e, r = kt(e.entryId, we), i = {
    morning: t.morning,
    evening: t.evening,
    night: t.night
  }, a = (s) => {
    var o;
    return kt((o = e.profileIds) == null ? void 0 : o[s], et[s].profile);
  }, n = [
    ...rt(t.header),
    ...rt(t.sync),
    ...rt(t.ids),
    `alias: ${t.alias}`,
    "mode: single",
    "triggers:"
  ];
  return et.forEach((s) => {
    n.push(`  # ${i[s.id]}`), n.push("  - trigger: time"), n.push(`    at: "${s.at}"`), n.push(`    id: ${s.id}`);
  }), n.push("actions:"), n.push("  - choose:"), et.forEach((s, o) => {
    n.push("      - conditions:"), n.push("          - condition: trigger"), n.push(`            id: ${s.id}`), n.push("        sequence:"), n.push("          - action: conx_dynamic_panel.activate_profile"), n.push("            data:"), n.push(`              entry_id: ${r}`), n.push(`              profile_id: ${a(o)}`), n.push("              sync: true");
  }), `${n.join(`
`)}
`;
}
const D = 1, Se = /* @__PURE__ */ new Set(["toggle", "radio_mandatory", "radio_optional", "radio_split"]);
function Ae(e) {
  const t = [];
  for (Array.isArray(e) && e.forEach((r, i) => {
    if (!v(r)) return;
    const a = [], n = Array.isArray(r.buttons) ? r.buttons : [];
    for (const s of n) {
      const o = Number(s);
      o >= 1 && o <= 4 && !a.includes(o) && a.push(o);
    }
    t.push({ id: String(r.id || `g${i + 1}`), buttons: a });
  }); t.length < 2; )
    t.push({ id: `g${t.length + 1}`, buttons: [] });
  return t;
}
function v(e) {
  return typeof e == "object" && e !== null && !Array.isArray(e);
}
function Ee(e) {
  if (v(e)) {
    const t = Object.entries(e);
    if (!t.length)
      return { ok: !1, error: "profiles must be a non-empty object or array" };
    const r = {};
    for (const [i, a] of t) {
      const n = St(a, i);
      if (!n.ok)
        return n;
      r[n.profile.id] = n.profile;
    }
    return { ok: !0, profiles: r };
  }
  if (Array.isArray(e)) {
    if (!e.length)
      return { ok: !1, error: "profiles must be a non-empty object or array" };
    const t = {};
    for (let r = 0; r < e.length; r += 1) {
      const i = St(e[r], void 0);
      if (!i.ok)
        return { ok: !1, error: `${i.error} (index ${r})` };
      t[i.profile.id] = i.profile;
    }
    return { ok: !0, profiles: t };
  }
  return { ok: !1, error: "profiles must be a non-empty object or array" };
}
function St(e, t) {
  if (!v(e))
    return { ok: !1, error: "each profile must be an object" };
  const r = String(e.id || t || "").trim();
  if (!r)
    return { ok: !1, error: "profile is missing id" };
  const i = String(e.mode || "toggle");
  if (!Se.has(i))
    return { ok: !1, error: `unsupported mode for profile ${r}: ${i}` };
  const a = Array.isArray(e.buttons) ? e.buttons : [], n = [1, 2, 3, 4].map((o) => {
    const c = a.find(
      (_) => v(_) && Number(_.index) === o
    );
    if (!v(c))
      return { index: o, name: `Button ${o}`, action: null };
    let h = null;
    return v(c.action) && typeof c.action.action == "string" && (h = {
      action: c.action.action,
      target: v(c.action.target) ? c.action.target : {},
      data: v(c.action.data) ? c.action.data : {}
    }), {
      index: o,
      name: String(c.name ?? `Button ${o}`),
      action: h,
      radio_member: c.radio_member === void 0 ? !0 : !!c.radio_member
    };
  });
  let s = 100;
  if (e.backlight_brightness !== void 0 && e.backlight_brightness !== null) {
    const o = Number(e.backlight_brightness);
    if (!Number.isFinite(o))
      return { ok: !1, error: `invalid backlight_brightness for profile ${r}` };
    s = Math.max(0, Math.min(100, Math.round(o)));
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
      backlight_brightness: s,
      child_lock: !!(e.child_lock ?? !1),
      selected_button: e.selected_button === null || e.selected_button === void 0 ? null : Number(e.selected_button),
      buttons: n,
      radio_groups: Ae(e.radio_groups)
    }
  };
}
function Oe(e) {
  if (!v(e))
    return { ok: !1, error: "Root must be a JSON object" };
  const t = e.schema_version ?? D, r = Number(t);
  if (!Number.isInteger(r) || r < 1)
    return { ok: !1, error: "schema_version must be a positive integer" };
  if (r > D)
    return {
      ok: !1,
      error: `Unsupported schema_version ${r}; current is ${D}`
    };
  const i = Ee(e.profiles);
  if (!i.ok)
    return i;
  let a = null;
  return typeof e.active_profile_id == "string" && e.active_profile_id && (a = e.active_profile_id, !(a in i.profiles)) ? {
    ok: !1,
    error: `active_profile_id "${a}" is not present in profiles`
  } : {
    ok: !0,
    payload: {
      schema_version: D,
      active_profile_id: a,
      profiles: i.profiles
    }
  };
}
function Pe(e, t) {
  return {
    schema_version: D,
    active_profile_id: t,
    profiles: structuredClone(e)
  };
}
function Ce(e, t, r = "YOUR_CONFIG_ENTRY_ID") {
  const i = JSON.stringify(e, null, 2).split(`
`).map((a, n) => n === 0 ? a : `    ${a}`).join(`
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
const Mt = "conx-dynamic-panel-lang", Lt = {}, It = {
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
  "card.radio_group": "Group",
  "card.radio_groups_overlap": "Each button can belong to only one radio group.",
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
  "mode.radio_split": "Radio split"
}, ze = {
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
  "card.radio_group": "קבוצה",
  "card.radio_groups_overlap": "כל כפתור יכול להשתייך לקבוצת רדיו אחת בלבד.",
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
  "mode.radio_split": "רדיו ספליט"
}, Re = {
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
  "card.radio_group": "Группа",
  "card.radio_groups_overlap": "Каждая кнопка может входить только в одну радиогруппу.",
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
  "mode.radio_split": "Радио сплит"
}, Te = {
  en: It,
  he: ze,
  ru: Re
}, it = [
  { id: "he", label: "עברית", flag: "IL" },
  { id: "en", label: "English", flag: "GB" },
  { id: "ru", label: "Русский", flag: "RU" }
];
function j(e) {
  const t = (e || "en").toLowerCase();
  return t.startsWith("he") || t.startsWith("iw") ? "he" : t.startsWith("ru") ? "ru" : "en";
}
function Ne() {
  var e, t;
  try {
    const r = (t = (e = globalThis.localStorage) == null ? void 0 : e.getItem) == null ? void 0 : t.call(e, Mt);
    if (r === "en" || r === "he" || r === "ru")
      return r;
  } catch {
  }
  return Lt.language || null;
}
function De(e) {
  var t, r;
  Lt.language = e;
  try {
    (r = (t = globalThis.localStorage) == null ? void 0 : t.setItem) == null || r.call(t, Mt, e);
  } catch {
  }
}
function P(e, t) {
  const r = j(e);
  return Te[r][t] || It[t] || t;
}
function Bt(e) {
  return j(e) === "he";
}
const Ut = "conx-dynamic-panel-theme", Me = {
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
}, dt = [
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
], Le = new Set(dt.map((e) => e.id));
function V(e) {
  return e ? Le.has(e) ? e : Me[e] || "noir" : "noir";
}
function At() {
  var e, t;
  try {
    const r = (t = (e = globalThis.localStorage) == null ? void 0 : e.getItem) == null ? void 0 : t.call(e, Ut);
    return r ? V(r) : null;
  } catch {
  }
  return null;
}
function Ie(e) {
  var t, r;
  try {
    (r = (t = globalThis.localStorage) == null ? void 0 : t.setItem) == null || r.call(t, Ut, e);
  } catch {
  }
}
function Et(e, t) {
  return e ? V(e) : t || "noir";
}
var Be = Object.defineProperty, Ue = Object.getOwnPropertyDescriptor, f = (e, t, r, i) => {
  for (var a = i > 1 ? void 0 : i ? Ue(t, r) : t, n = e.length - 1, s; n >= 0; n--)
    (s = e[n]) && (a = (i ? s(t, r, a) : s(a)) || a);
  return i && a && Be(t, r, a), a;
};
const E = [
  "language",
  "profiles",
  "edit",
  "preview",
  "review",
  "transfer"
], je = {
  red: "#ff1744",
  blue: "#2979ff",
  green: "#00e676",
  white: "#f5f7fa",
  yellow: "#ffea00",
  magenta: "#f50057",
  cyan: "#00e5ff",
  warm_white: "#ffe0b2",
  warm_yellow: "#ffc400"
}, jt = "#00e5ff", He = "#2979ff";
function G(e, t = jt) {
  return e && (je[e] || e) || t;
}
let p = class extends C {
  constructor() {
    super(...arguments), this._loading = !1, this._busy = !1, this._syncPulse = !1, this._pressedRing = null, this._splitPreviewOn = {}, this._theme = "noir", this._view = "editor", this._wizardStep = "transfer", this._importMode = "merge", this._serviceYaml = "", this._sections = {
      profiles: !0,
      appearance: !0,
      buttons: !0,
      theme: !1,
      preview: !0,
      actions: !0,
      transfer: !0
    }, this._expandedButtons = {}, this._activeTab = "profiles", this._menuOpen = !1, this._automationOpen = !1, this._previewOpen = !0, this._panelNameDraft = "", this._radioGroupOpen = {
      g0: !0,
      g1: !0,
      ungrouped: !0
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
  setConfig(e) {
    if (!e.entry_id)
      throw new Error("entry_id is required");
    this._config = e, e.language && (this._uiLang = j(e.language)), this._theme = Et(e.theme, At());
  }
  connectedCallback() {
    var e;
    super.connectedCallback(), this._uiLang || (this._uiLang = Ne() || void 0), this._theme = Et((e = this._config) == null ? void 0 : e.theme, At()), this._ensureFonts();
  }
  _stepLabel(e) {
    return this.t(`card.step_${e}`);
  }
  _goToStep(e) {
    this._wizardStep = e, this._notice = void 0;
  }
  _wizardIndex() {
    return E.indexOf(this._wizardStep);
  }
  _wizardNext() {
    const e = this._wizardIndex();
    e < E.length - 1 && this._goToStep(E[e + 1]);
  }
  _wizardBack() {
    const e = this._wizardIndex();
    e > 0 && this._goToStep(E[e - 1]);
  }
  _buildServiceYaml(e) {
    if (!this._panel || !this._config)
      return "";
    const t = e || Pe(this._panel.profiles, this._panel.active_profile_id);
    return Ce(
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
    return ke({
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
    return this._uiLang ? this._uiLang : j(
      ((t = (e = this.hass) == null ? void 0 : e.locale) == null ? void 0 : t.language) || ((r = this.hass) == null ? void 0 : r.language) || "en"
    );
  }
  t(e) {
    return P(this._language, e);
  }
  get _dirty() {
    return !ye(this._draft || null, this._saved || null);
  }
  _setLanguage(e) {
    this._uiLang = e, De(e);
  }
  _setTheme(e) {
    this._theme = V(e), Ie(this._theme), this._config && (this._config = { ...this._config, theme: this._theme }, this.dispatchEvent(
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
      buttons: Array.isArray(i == null ? void 0 : i.buttons) ? i.buttons.map((n) => Number(n)).filter((n, s, o) => n >= 1 && n <= 4 && o.indexOf(n) === s) : []
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
      this._ensureRadioGroups(i), (i.radio_groups || []).forEach((n, s) => {
        s === e ? r && !n.buttons.includes(t) ? n.buttons = [...n.buttons, t] : r || (n.buttons = n.buttons.filter((o) => o !== t)) : r && (n.buttons = n.buttons.filter((o) => o !== t));
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
    ].filter(Boolean).join(" "), n = () => {
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
        @click=${n}
      >
        <span class="radio-member-label">L${e}</span>
      </button>
    `;
  }
  _renderRadioGroupsEditor() {
    if (!this._draft || this._draft.mode !== "radio_split")
      return l;
    const e = this._ungroupedButtons(), t = [1, 2, 3, 4].filter((i) => e.has(i)), r = (i, a, n) => {
      const s = this._radioGroupOpen[a] !== !1;
      return d`
        <div class="radio-group-head">
          <div class="radio-group-head-main">
            <div class="radio-group-title">${i}</div>
            ${s ? l : d`<div class="radio-group-summary">${n}</div>`}
          </div>
          <label class="switch" title=${this.t("card.section_toggle")}>
            <input
              type="checkbox"
              .checked=${s}
              ?disabled=${this._busy}
              @change=${(o) => this._toggleRadioGroupOpen(
        a,
        o.target.checked
      )}
            />
            <span class="slider"></span>
          </label>
        </div>
      `;
    };
    return d`
      <div class="radio-groups-section">
        <span class="menu-label">${this.t("card.radio_groups")}</span>
        <p class="radio-groups-hint">${this.t("card.radio_groups_hint")}</p>
        ${(this._draft.radio_groups || []).map((i, a) => {
      const n = `g${a}`, s = this._radioGroupOpen[n] !== !1;
      return d`
            <div class="radio-group-card ${s ? "open" : ""}">
              ${r(
        `${this.t("card.radio_group")} ${a + 1}`,
        n,
        this._groupSummary(i.buttons)
      )}
              ${s ? d`
                    <div class="radio-group-members">
                      ${[1, 2, 3, 4].map(
        (o) => this._renderRadioMemberCell(
          o,
          i.buttons.includes(o),
          { groupIndex: a }
        )
      )}
                    </div>
                  ` : l}
            </div>
          `;
    })}
        <div
          class="radio-group-card is-summary ${this._radioGroupOpen.ungrouped !== !1 ? "open" : ""}"
        >
          ${r(
      this.t("card.radio_toggle"),
      "ungrouped",
      this._groupSummary(t)
    )}
          ${this._radioGroupOpen.ungrouped !== !1 ? d`
                <div class="radio-group-members">
                  ${[1, 2, 3, 4].map(
      (i) => this._renderRadioMemberCell(
        i,
        e.has(i),
        { independent: !0 }
      )
    )}
                </div>
              ` : l}
        </div>
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
        const t = await wt(this.hass, this._config.entry_id);
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
    this._saved = r ? N(r) : void 0, this._draft = r ? N(r) : void 0, ((i = this._draft) == null ? void 0 : i.mode) === "radio_split" && this._ensureRadioGroupOpenDefaults(!1);
  }
  _ensureRadioGroupOpenDefaults(e) {
    const t = { ...this._radioGroupOpen };
    for (const r of ["g0", "g1", "ungrouped"])
      (e || t[r] === void 0) && (t[r] = !0);
    this._radioGroupOpen = t;
  }
  _toggleRadioGroupOpen(e, t) {
    this._radioGroupOpen = { ...this._radioGroupOpen, [e]: t };
  }
  _groupSummary(e) {
    const t = [...e].sort((r, i) => r - i).map((r) => `L${r}`);
    return t.length ? t.join(", ") : "—";
  }
  async _guardDirty() {
    return this._dirty ? window.confirm(this.t("card.unsaved")) : !0;
  }
  async _selectProfile(e) {
    if (!(!await this._guardDirty() || !this.hass || !this._config)) {
      this._busy = !0;
      try {
        const t = await tt(
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
        const e = await pe(
          this.hass,
          this._config.entry_id,
          this._draft.id,
          this._draft
        ), t = await wt(this.hass, this._config.entry_id);
        this._applyPanel(t), this._saved = N(e), this._draft = N(e);
      } catch (e) {
        this._error = e instanceof Error ? e.message : String(e);
      } finally {
        this._busy = !1;
      }
    }
  }
  _discard() {
    this._saved && (this._draft = N(this._saved));
  }
  async _sync() {
    if (!(!this.hass || !this._config)) {
      this._dirty && await this._saveDraft(), this._busy = !0, this._error = void 0, this._syncPulse = !0;
      try {
        const e = await ge(this.hass, this._config.entry_id);
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
        const e = await _e(this.hass, this._config.entry_id);
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
      await he(this.hass, this._config.entry_id, t);
      const r = await tt(
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
      await fe(
        this.hass,
        this._config.entry_id,
        this._draft.id,
        e,
        `${this._draft.name} copy`
      );
      const t = await tt(
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
          await ue(this.hass, this._config.entry_id, this._draft.id), await this._load();
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
        const e = await me(this.hass, this._config.entry_id), t = this._panel.panel_name.replace(/[^\w.-]+/g, "_");
        $e(`conx-profiles-${t}.json`, e), this._refreshServiceYaml(e), this._notice = this.t("card.export_ok");
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
        const r = await e.text(), i = Oe(JSON.parse(r));
        if (!i.ok)
          throw new Error(i.error || this.t("card.import_invalid"));
        const a = await be(
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
      const a = i.buttons.find((n) => n.index === e);
      a && (a.name = r);
    });
  }
  _onButtonActionInput(e, t) {
    const r = t.target.value.trim();
    this._patchDraft((i) => {
      var n, s;
      const a = i.buttons.find((o) => o.index === e);
      if (a) {
        if (!r) {
          a.action = null;
          return;
        }
        a.action = {
          action: r,
          target: ((n = a.action) == null ? void 0 : n.target) || {},
          data: ((s = a.action) == null ? void 0 : s.data) || {}
        };
      }
    });
  }
  _onButtonEntityInput(e, t) {
    const r = t.target.value.trim();
    this._patchDraft((i) => {
      var s, o;
      const a = i.buttons.find((c) => c.index === e);
      if (!a)
        return;
      const n = ((s = a.action) == null ? void 0 : s.action) || "";
      if (!n) {
        a.action = null;
        return;
      }
      a.action = {
        action: n,
        target: r ? { entity_id: r } : {},
        data: ((o = a.action) == null ? void 0 : o.data) || {}
      };
    });
  }
  _buttonEntityId(e) {
    var i, a, n;
    const t = (i = this._draft) == null ? void 0 : i.buttons.find((s) => s.index === e), r = (n = (a = t == null ? void 0 : t.action) == null ? void 0 : a.target) == null ? void 0 : n.entity_id;
    return (r == null ? void 0 : r.trim()) || null;
  }
  _entityIsOn(e) {
    var i, a, n;
    const t = (n = (a = (i = this.hass) == null ? void 0 : i.states) == null ? void 0 : a[e]) == null ? void 0 : n.state;
    if (t == null)
      return null;
    const r = String(t).toLowerCase();
    return ["unavailable", "unknown"].includes(r) ? null : ["on", "open", "home", "playing", "active"].includes(r);
  }
  _isRingOn(e) {
    if (!this._draft)
      return !1;
    if (this._draft.mode === "radio_split") {
      const i = this._buttonEntityId(e);
      if (i) {
        const a = this._entityIsOn(i);
        if (a !== null)
          return a;
      }
      return !!this._splitPreviewOn[e];
    }
    if (this._draft.mode !== "toggle" && this._isRadioMember(e))
      return this._draft.selected_button === e;
    const r = this._buttonEntityId(e);
    if (r) {
      const i = this._entityIsOn(r);
      if (i !== null)
        return i;
    }
    return e % 2 === 1;
  }
  _onRingPress(e) {
    if (this._pressedRing = e, window.setTimeout(() => {
      this._pressedRing === e && (this._pressedRing = null);
    }, 180), !(!this._draft || this._draft.mode === "toggle")) {
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
    return G((e = this._draft) == null ? void 0 : e.color_on, jt);
  }
  _ringOffColor() {
    var e;
    return G((e = this._draft) == null ? void 0 : e.color_off, He);
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
        ${E.map((t, r) => {
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
          ?disabled=${this._busy || e >= E.length - 1}
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
          ${dt.map(
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
        ${it.map(
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
      const t = await xe(
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
      if (t.mode = e.target.value, t.mode === "radio_split")
        this._ensureRadioGroups(t), this._ensureRadioGroupOpenDefaults(!0);
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
                  style="background:${G(this._draft.color_on)}"
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
                  style="background:${G(this._draft.color_off)}"
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
      ${this._renderRadioGroupsEditor()}
          <div class="buttons-accordion">
            ${this._draft.buttons.map((e) => {
      var h, _, u, m, x;
      const t = !!this._expandedButtons[e.index], r = String(
        ((_ = (h = e.action) == null ? void 0 : h.target) == null ? void 0 : _.entity_id) || ""
      ), i = (e.name || "").trim() || "—", a = ((u = e.action) == null ? void 0 : u.action) || "", n = ((m = this._draft) == null ? void 0 : m.mode) === "radio_mandatory" || ((x = this._draft) == null ? void 0 : x.mode) === "radio_optional", s = e.radio_member !== !1, o = n ? s ? this.t("card.radio_member") : this.t("card.radio_toggle") : "", c = [a, r, o].filter(Boolean).join(" · ") || "—";
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
                      <span class="button-edit-meta">${c}</span>
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
                                @input=${(b) => this._onButtonNameInput(e.index, b)}
                              />
                            </label>
                            <label class="field">
                              <span>${this.t("card.action")}</span>
                              <input
                                type="text"
                                .value=${a}
                                placeholder="light.toggle"
                                ?disabled=${this._busy}
                                @input=${(b) => this._onButtonActionInput(e.index, b)}
                              />
                            </label>
                            <label class="field">
                              <span>${this.t("card.entity_id")}</span>
                              <input
                                type="text"
                                .value=${r}
                                placeholder="light.living_room"
                                ?disabled=${this._busy}
                                @input=${(b) => this._onButtonEntityInput(e.index, b)}
                              />
                            </label>
                            ${n ? d`
                                  <label class="field">
                                    <span>${this.t("card.radio_participation")}</span>
                                    <div class="select-wrap">
                                      <select
                                        .value=${s ? "radio" : "toggle"}
                                        ?disabled=${this._busy}
                                        @change=${(b) => this._patchDraft((Ht) => {
        const pt = Ht.buttons.find(
          (Yt) => Yt.index === e.index
        );
        pt && (pt.radio_member = b.target.value === "radio");
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
      </div>
      ${this._renderFaceplate()}
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
    const e = Bt(this._language);
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
              ${it.map(
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
          ${this._previewOpen ? d`<div class="hero-body">${this._renderFaceplate()}</div>` : l}
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
p.styles = Ct`
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
      margin-bottom: 6px;
    }
    .radio-groups-hint {
      margin: 0 0 10px;
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
    .menu-section .menu-label,
    .radio-groups-section .menu-label {
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
    .radio-group-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      min-height: 34px;
    }
    .radio-group-head-main {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      min-width: 0;
      flex: 1;
    }
    .radio-group-title {
      margin-bottom: 0 !important;
      line-height: 1.2;
    }
    .radio-group-summary {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }
    .radio-group-card.open .radio-group-members { margin-top: 8px; }
    .radio-group-card:not(.open) { padding-top: 8px; padding-bottom: 8px; }
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
f([
  ct({ attribute: !1 })
], p.prototype, "hass", 2);
f([
  g()
], p.prototype, "_config", 2);
f([
  g()
], p.prototype, "_panel", 2);
f([
  g()
], p.prototype, "_draft", 2);
f([
  g()
], p.prototype, "_saved", 2);
f([
  g()
], p.prototype, "_error", 2);
f([
  g()
], p.prototype, "_notice", 2);
f([
  g()
], p.prototype, "_loading", 2);
f([
  g()
], p.prototype, "_busy", 2);
f([
  g()
], p.prototype, "_syncPulse", 2);
f([
  g()
], p.prototype, "_pressedRing", 2);
f([
  g()
], p.prototype, "_splitPreviewOn", 2);
f([
  g()
], p.prototype, "_uiLang", 2);
f([
  g()
], p.prototype, "_theme", 2);
f([
  g()
], p.prototype, "_view", 2);
f([
  g()
], p.prototype, "_wizardStep", 2);
f([
  g()
], p.prototype, "_importMode", 2);
f([
  g()
], p.prototype, "_serviceYaml", 2);
f([
  g()
], p.prototype, "_sections", 2);
f([
  g()
], p.prototype, "_expandedButtons", 2);
f([
  g()
], p.prototype, "_activeTab", 2);
f([
  g()
], p.prototype, "_menuOpen", 2);
f([
  g()
], p.prototype, "_automationOpen", 2);
f([
  g()
], p.prototype, "_previewOpen", 2);
f([
  g()
], p.prototype, "_panelNameDraft", 2);
f([
  g()
], p.prototype, "_radioGroupOpen", 2);
p = f([
  Dt("conx-dynamic-panel-card")
], p);
var Ye = Object.defineProperty, Ge = Object.getOwnPropertyDescriptor, lt = (e, t, r, i) => {
  for (var a = i > 1 ? void 0 : i ? Ge(t, r) : t, n = e.length - 1, s; n >= 0; n--)
    (s = e[n]) && (a = (i ? s(t, r, a) : s(a)) || a);
  return i && a && Ye(t, r, a), a;
};
let H = class extends C {
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
    const e = Bt(this._language);
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
            .value=${j(this._config.language || this._language)}
            @change=${(t) => this._valueChanged({
      language: t.target.value
    })}
          >
            ${it.map(
      (t) => d`<option value=${t.id}>${t.label}</option>`
    )}
          </select>
        </label>
        <label>
          ${P(this._language, "card.theme")}
          <select
            .value=${V(this._config.theme)}
            @change=${(t) => this._valueChanged({
      theme: t.target.value
    })}
          >
            ${dt.map(
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
H.styles = Ct`
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
lt([
  ct({ attribute: !1 })
], H.prototype, "hass", 2);
lt([
  g()
], H.prototype, "_config", 2);
H = lt([
  Dt("conx-dynamic-panel-card-editor")
], H);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "conx-dynamic-panel-card",
  name: "ConX Dynamic Panel Card",
  description: "Private ConX card for multi-profile smart panels",
  preview: !0
});
//# sourceMappingURL=conx-dynamic-panel-card.js.map
