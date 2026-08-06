/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const se = globalThis, Ee = se.ShadowRoot && (se.ShadyCSS === void 0 || se.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Ae = Symbol(), Be = /* @__PURE__ */ new WeakMap();
let st = class {
  constructor(e, r, i) {
    if (this._$cssResult$ = !0, i !== Ae) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = r;
  }
  get styleSheet() {
    let e = this.o;
    const r = this.t;
    if (Ee && e === void 0) {
      const i = r !== void 0 && r.length === 1;
      i && (e = Be.get(r)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && Be.set(r, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const Ot = (t) => new st(typeof t == "string" ? t : t + "", void 0, Ae), ct = (t, ...e) => {
  const r = t.length === 1 ? t[0] : e.reduce((i, a, o) => i + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(a) + t[o + 1], t[0]);
  return new st(r, t, Ae);
}, Pt = (t, e) => {
  if (Ee) t.adoptedStyleSheets = e.map((r) => r instanceof CSSStyleSheet ? r : r.styleSheet);
  else for (const r of e) {
    const i = document.createElement("style"), a = se.litNonce;
    a !== void 0 && i.setAttribute("nonce", a), i.textContent = r.cssText, t.appendChild(i);
  }
}, De = Ee ? (t) => t : (t) => t instanceof CSSStyleSheet ? ((e) => {
  let r = "";
  for (const i of e.cssRules) r += i.cssText;
  return Ot(r);
})(t) : t;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Et, defineProperty: At, getOwnPropertyDescriptor: Rt, getOwnPropertyNames: zt, getOwnPropertySymbols: Mt, getPrototypeOf: Tt } = Object, C = globalThis, Ue = C.trustedTypes, Lt = Ue ? Ue.emptyScript : "", me = C.reactiveElementPolyfillSupport, X = (t, e) => t, le = { toAttribute(t, e) {
  switch (e) {
    case Boolean:
      t = t ? Lt : null;
      break;
    case Object:
    case Array:
      t = t == null ? t : JSON.stringify(t);
  }
  return t;
}, fromAttribute(t, e) {
  let r = t;
  switch (e) {
    case Boolean:
      r = t !== null;
      break;
    case Number:
      r = t === null ? null : Number(t);
      break;
    case Object:
    case Array:
      try {
        r = JSON.parse(t);
      } catch {
        r = null;
      }
  }
  return r;
} }, Re = (t, e) => !Et(t, e), je = { attribute: !0, type: String, converter: le, reflect: !1, useDefault: !1, hasChanged: Re };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), C.litPropertyMetadata ?? (C.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let M = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, r = je) {
    if (r.state && (r.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((r = Object.create(r)).wrapped = !0), this.elementProperties.set(e, r), !r.noAccessor) {
      const i = Symbol(), a = this.getPropertyDescriptor(e, i, r);
      a !== void 0 && At(this.prototype, e, a);
    }
  }
  static getPropertyDescriptor(e, r, i) {
    const { get: a, set: o } = Rt(this.prototype, e) ?? { get() {
      return this[r];
    }, set(n) {
      this[r] = n;
    } };
    return { get: a, set(n) {
      const s = a == null ? void 0 : a.call(this);
      o == null || o.call(this, n), this.requestUpdate(e, s, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? je;
  }
  static _$Ei() {
    if (this.hasOwnProperty(X("elementProperties"))) return;
    const e = Tt(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(X("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(X("properties"))) {
      const r = this.properties, i = [...zt(r), ...Mt(r)];
      for (const a of i) this.createProperty(a, r[a]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const r = litPropertyMetadata.get(e);
      if (r !== void 0) for (const [i, a] of r) this.elementProperties.set(i, a);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [r, i] of this.elementProperties) {
      const a = this._$Eu(r, i);
      a !== void 0 && this._$Eh.set(a, r);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const r = [];
    if (Array.isArray(e)) {
      const i = new Set(e.flat(1 / 0).reverse());
      for (const a of i) r.unshift(De(a));
    } else e !== void 0 && r.push(De(e));
    return r;
  }
  static _$Eu(e, r) {
    const i = r.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof e == "string" ? e.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var e;
    this._$ES = new Promise((r) => this.enableUpdating = r), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (e = this.constructor.l) == null || e.forEach((r) => r(this));
  }
  addController(e) {
    var r;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(e), this.renderRoot !== void 0 && this.isConnected && ((r = e.hostConnected) == null || r.call(e));
  }
  removeController(e) {
    var r;
    (r = this._$EO) == null || r.delete(e);
  }
  _$E_() {
    const e = /* @__PURE__ */ new Map(), r = this.constructor.elementProperties;
    for (const i of r.keys()) this.hasOwnProperty(i) && (e.set(i, this[i]), delete this[i]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return Pt(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    var e;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (e = this._$EO) == null || e.forEach((r) => {
      var i;
      return (i = r.hostConnected) == null ? void 0 : i.call(r);
    });
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    var e;
    (e = this._$EO) == null || e.forEach((r) => {
      var i;
      return (i = r.hostDisconnected) == null ? void 0 : i.call(r);
    });
  }
  attributeChangedCallback(e, r, i) {
    this._$AK(e, i);
  }
  _$ET(e, r) {
    var o;
    const i = this.constructor.elementProperties.get(e), a = this.constructor._$Eu(e, i);
    if (a !== void 0 && i.reflect === !0) {
      const n = (((o = i.converter) == null ? void 0 : o.toAttribute) !== void 0 ? i.converter : le).toAttribute(r, i.type);
      this._$Em = e, n == null ? this.removeAttribute(a) : this.setAttribute(a, n), this._$Em = null;
    }
  }
  _$AK(e, r) {
    var o, n;
    const i = this.constructor, a = i._$Eh.get(e);
    if (a !== void 0 && this._$Em !== a) {
      const s = i.getPropertyOptions(a), c = typeof s.converter == "function" ? { fromAttribute: s.converter } : ((o = s.converter) == null ? void 0 : o.fromAttribute) !== void 0 ? s.converter : le;
      this._$Em = a;
      const d = c.fromAttribute(r, s.type);
      this[a] = d ?? ((n = this._$Ej) == null ? void 0 : n.get(a)) ?? d, this._$Em = null;
    }
  }
  requestUpdate(e, r, i, a = !1, o) {
    var n;
    if (e !== void 0) {
      const s = this.constructor;
      if (a === !1 && (o = this[e]), i ?? (i = s.getPropertyOptions(e)), !((i.hasChanged ?? Re)(o, r) || i.useDefault && i.reflect && o === ((n = this._$Ej) == null ? void 0 : n.get(e)) && !this.hasAttribute(s._$Eu(e, i)))) return;
      this.C(e, r, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, r, { useDefault: i, reflect: a, wrapped: o }, n) {
    i && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(e) && (this._$Ej.set(e, n ?? r ?? this[e]), o !== !0 || n !== void 0) || (this._$AL.has(e) || (this.hasUpdated || i || (r = void 0), this._$AL.set(e, r)), a === !0 && this._$Em !== e && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (r) {
      Promise.reject(r);
    }
    const e = this.scheduleUpdate();
    return e != null && await e, !this.isUpdatePending;
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
    let e = !1;
    const r = this._$AL;
    try {
      e = this.shouldUpdate(r), e ? (this.willUpdate(r), (i = this._$EO) == null || i.forEach((a) => {
        var o;
        return (o = a.hostUpdate) == null ? void 0 : o.call(a);
      }), this.update(r)) : this._$EM();
    } catch (a) {
      throw e = !1, this._$EM(), a;
    }
    e && this._$AE(r);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    var r;
    (r = this._$EO) == null || r.forEach((i) => {
      var a;
      return (a = i.hostUpdated) == null ? void 0 : a.call(i);
    }), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
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
  shouldUpdate(e) {
    return !0;
  }
  update(e) {
    this._$Eq && (this._$Eq = this._$Eq.forEach((r) => this._$ET(r, this[r]))), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
M.elementStyles = [], M.shadowRootOptions = { mode: "open" }, M[X("elementProperties")] = /* @__PURE__ */ new Map(), M[X("finalized")] = /* @__PURE__ */ new Map(), me == null || me({ ReactiveElement: M }), (C.reactiveElementVersions ?? (C.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const q = globalThis, He = (t) => t, de = q.trustedTypes, Fe = de ? de.createPolicy("lit-html", { createHTML: (t) => t }) : void 0, lt = "$lit$", k = `lit$${Math.random().toFixed(9).slice(2)}$`, dt = "?" + k, Nt = `<${dt}>`, A = document, Z = () => A.createComment(""), Q = (t) => t === null || typeof t != "object" && typeof t != "function", ze = Array.isArray, Bt = (t) => ze(t) || typeof (t == null ? void 0 : t[Symbol.iterator]) == "function", ge = `[ 	
\f\r]`, G = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Ge = /-->/g, Ye = />/g, O = RegExp(`>|${ge}(?:([^\\s"'>=/]+)(${ge}*=${ge}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), We = /'/g, Ie = /"/g, pt = /^(?:script|style|textarea|title)$/i, Dt = (t) => (e, ...r) => ({ _$litType$: t, strings: e, values: r }), l = Dt(1), j = Symbol.for("lit-noChange"), p = Symbol.for("lit-nothing"), Je = /* @__PURE__ */ new WeakMap(), P = A.createTreeWalker(A, 129);
function ht(t, e) {
  if (!ze(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Fe !== void 0 ? Fe.createHTML(e) : e;
}
const Ut = (t, e) => {
  const r = t.length - 1, i = [];
  let a, o = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", n = G;
  for (let s = 0; s < r; s++) {
    const c = t[s];
    let d, u, h = -1, f = 0;
    for (; f < c.length && (n.lastIndex = f, u = n.exec(c), u !== null); ) f = n.lastIndex, n === G ? u[1] === "!--" ? n = Ge : u[1] !== void 0 ? n = Ye : u[2] !== void 0 ? (pt.test(u[2]) && (a = RegExp("</" + u[2], "g")), n = O) : u[3] !== void 0 && (n = O) : n === O ? u[0] === ">" ? (n = a ?? G, h = -1) : u[1] === void 0 ? h = -2 : (h = n.lastIndex - u[2].length, d = u[1], n = u[3] === void 0 ? O : u[3] === '"' ? Ie : We) : n === Ie || n === We ? n = O : n === Ge || n === Ye ? n = G : (n = O, a = void 0);
    const b = n === O && t[s + 1].startsWith("/>") ? " " : "";
    o += n === G ? c + Nt : h >= 0 ? (i.push(d), c.slice(0, h) + lt + c.slice(h) + k + b) : c + k + (h === -2 ? s : b);
  }
  return [ht(t, o + (t[r] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class ee {
  constructor({ strings: e, _$litType$: r }, i) {
    let a;
    this.parts = [];
    let o = 0, n = 0;
    const s = e.length - 1, c = this.parts, [d, u] = Ut(e, r);
    if (this.el = ee.createElement(d, i), P.currentNode = this.el.content, r === 2 || r === 3) {
      const h = this.el.content.firstChild;
      h.replaceWith(...h.childNodes);
    }
    for (; (a = P.nextNode()) !== null && c.length < s; ) {
      if (a.nodeType === 1) {
        if (a.hasAttributes()) for (const h of a.getAttributeNames()) if (h.endsWith(lt)) {
          const f = u[n++], b = a.getAttribute(h).split(k), y = /([.?@])?(.*)/.exec(f);
          c.push({ type: 1, index: o, name: y[2], strings: b, ctor: y[1] === "." ? Ht : y[1] === "?" ? Ft : y[1] === "@" ? Gt : he }), a.removeAttribute(h);
        } else h.startsWith(k) && (c.push({ type: 6, index: o }), a.removeAttribute(h));
        if (pt.test(a.tagName)) {
          const h = a.textContent.split(k), f = h.length - 1;
          if (f > 0) {
            a.textContent = de ? de.emptyScript : "";
            for (let b = 0; b < f; b++) a.append(h[b], Z()), P.nextNode(), c.push({ type: 2, index: ++o });
            a.append(h[f], Z());
          }
        }
      } else if (a.nodeType === 8) if (a.data === dt) c.push({ type: 2, index: o });
      else {
        let h = -1;
        for (; (h = a.data.indexOf(k, h + 1)) !== -1; ) c.push({ type: 7, index: o }), h += k.length - 1;
      }
      o++;
    }
  }
  static createElement(e, r) {
    const i = A.createElement("template");
    return i.innerHTML = e, i;
  }
}
function H(t, e, r = t, i) {
  var n, s;
  if (e === j) return e;
  let a = i !== void 0 ? (n = r._$Co) == null ? void 0 : n[i] : r._$Cl;
  const o = Q(e) ? void 0 : e._$litDirective$;
  return (a == null ? void 0 : a.constructor) !== o && ((s = a == null ? void 0 : a._$AO) == null || s.call(a, !1), o === void 0 ? a = void 0 : (a = new o(t), a._$AT(t, r, i)), i !== void 0 ? (r._$Co ?? (r._$Co = []))[i] = a : r._$Cl = a), a !== void 0 && (e = H(t, a._$AS(t, e.values), a, i)), e;
}
class jt {
  constructor(e, r) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = r;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: r }, parts: i } = this._$AD, a = ((e == null ? void 0 : e.creationScope) ?? A).importNode(r, !0);
    P.currentNode = a;
    let o = P.nextNode(), n = 0, s = 0, c = i[0];
    for (; c !== void 0; ) {
      if (n === c.index) {
        let d;
        c.type === 2 ? d = new ie(o, o.nextSibling, this, e) : c.type === 1 ? d = new c.ctor(o, c.name, c.strings, this, e) : c.type === 6 && (d = new Yt(o, this, e)), this._$AV.push(d), c = i[++s];
      }
      n !== (c == null ? void 0 : c.index) && (o = P.nextNode(), n++);
    }
    return P.currentNode = A, a;
  }
  p(e) {
    let r = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, r), r += i.strings.length - 2) : i._$AI(e[r])), r++;
  }
}
class ie {
  get _$AU() {
    var e;
    return ((e = this._$AM) == null ? void 0 : e._$AU) ?? this._$Cv;
  }
  constructor(e, r, i, a) {
    this.type = 2, this._$AH = p, this._$AN = void 0, this._$AA = e, this._$AB = r, this._$AM = i, this.options = a, this._$Cv = (a == null ? void 0 : a.isConnected) ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const r = this._$AM;
    return r !== void 0 && (e == null ? void 0 : e.nodeType) === 11 && (e = r.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, r = this) {
    e = H(this, e, r), Q(e) ? e === p || e == null || e === "" ? (this._$AH !== p && this._$AR(), this._$AH = p) : e !== this._$AH && e !== j && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Bt(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== p && Q(this._$AH) ? this._$AA.nextSibling.data = e : this.T(A.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    var o;
    const { values: r, _$litType$: i } = e, a = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = ee.createElement(ht(i.h, i.h[0]), this.options)), i);
    if (((o = this._$AH) == null ? void 0 : o._$AD) === a) this._$AH.p(r);
    else {
      const n = new jt(a, this), s = n.u(this.options);
      n.p(r), this.T(s), this._$AH = n;
    }
  }
  _$AC(e) {
    let r = Je.get(e.strings);
    return r === void 0 && Je.set(e.strings, r = new ee(e)), r;
  }
  k(e) {
    ze(this._$AH) || (this._$AH = [], this._$AR());
    const r = this._$AH;
    let i, a = 0;
    for (const o of e) a === r.length ? r.push(i = new ie(this.O(Z()), this.O(Z()), this, this.options)) : i = r[a], i._$AI(o), a++;
    a < r.length && (this._$AR(i && i._$AB.nextSibling, a), r.length = a);
  }
  _$AR(e = this._$AA.nextSibling, r) {
    var i;
    for ((i = this._$AP) == null ? void 0 : i.call(this, !1, !0, r); e !== this._$AB; ) {
      const a = He(e).nextSibling;
      He(e).remove(), e = a;
    }
  }
  setConnected(e) {
    var r;
    this._$AM === void 0 && (this._$Cv = e, (r = this._$AP) == null || r.call(this, e));
  }
}
class he {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, r, i, a, o) {
    this.type = 1, this._$AH = p, this._$AN = void 0, this.element = e, this.name = r, this._$AM = a, this.options = o, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = p;
  }
  _$AI(e, r = this, i, a) {
    const o = this.strings;
    let n = !1;
    if (o === void 0) e = H(this, e, r, 0), n = !Q(e) || e !== this._$AH && e !== j, n && (this._$AH = e);
    else {
      const s = e;
      let c, d;
      for (e = o[0], c = 0; c < o.length - 1; c++) d = H(this, s[i + c], r, c), d === j && (d = this._$AH[c]), n || (n = !Q(d) || d !== this._$AH[c]), d === p ? e = p : e !== p && (e += (d ?? "") + o[c + 1]), this._$AH[c] = d;
    }
    n && !a && this.j(e);
  }
  j(e) {
    e === p ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class Ht extends he {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === p ? void 0 : e;
  }
}
class Ft extends he {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== p);
  }
}
class Gt extends he {
  constructor(e, r, i, a, o) {
    super(e, r, i, a, o), this.type = 5;
  }
  _$AI(e, r = this) {
    if ((e = H(this, e, r, 0) ?? p) === j) return;
    const i = this._$AH, a = e === p && i !== p || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, o = e !== p && (i === p || a);
    a && this.element.removeEventListener(this.name, this, i), o && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var r;
    typeof this._$AH == "function" ? this._$AH.call(((r = this.options) == null ? void 0 : r.host) ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class Yt {
  constructor(e, r, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = r, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    H(this, e);
  }
}
const fe = q.litHtmlPolyfillSupport;
fe == null || fe(ee, ie), (q.litHtmlVersions ?? (q.litHtmlVersions = [])).push("3.3.3");
const Wt = (t, e, r) => {
  const i = (r == null ? void 0 : r.renderBefore) ?? e;
  let a = i._$litPart$;
  if (a === void 0) {
    const o = (r == null ? void 0 : r.renderBefore) ?? null;
    i._$litPart$ = a = new ie(e.insertBefore(Z(), o), o, void 0, r ?? {});
  }
  return a._$AI(t), a;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const E = globalThis;
class D extends M {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var r;
    const e = super.createRenderRoot();
    return (r = this.renderOptions).renderBefore ?? (r.renderBefore = e.firstChild), e;
  }
  update(e) {
    const r = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Wt(r, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    var e;
    super.connectedCallback(), (e = this._$Do) == null || e.setConnected(!0);
  }
  disconnectedCallback() {
    var e;
    super.disconnectedCallback(), (e = this._$Do) == null || e.setConnected(!1);
  }
  render() {
    return j;
  }
}
var nt;
D._$litElement$ = !0, D.finalized = !0, (nt = E.litElementHydrateSupport) == null || nt.call(E, { LitElement: D });
const be = E.litElementPolyfillSupport;
be == null || be({ LitElement: D });
(E.litElementVersions ?? (E.litElementVersions = [])).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ut = (t) => (e, r) => {
  r !== void 0 ? r.addInitializer(() => {
    customElements.define(t, e);
  }) : customElements.define(t, e);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const It = { attribute: !0, type: String, converter: le, reflect: !1, hasChanged: Re }, Jt = (t = It, e, r) => {
  const { kind: i, metadata: a } = r;
  let o = globalThis.litPropertyMetadata.get(a);
  if (o === void 0 && globalThis.litPropertyMetadata.set(a, o = /* @__PURE__ */ new Map()), i === "setter" && ((t = Object.create(t)).wrapped = !0), o.set(r.name, t), i === "accessor") {
    const { name: n } = r;
    return { set(s) {
      const c = e.get.call(this);
      e.set.call(this, s), this.requestUpdate(n, c, t, !0, s);
    }, init(s) {
      return s !== void 0 && this.C(n, void 0, t, s), s;
    } };
  }
  if (i === "setter") {
    const { name: n } = r;
    return function(s) {
      const c = this[n];
      e.call(this, s), this.requestUpdate(n, c, t, !0, s);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function Me(t) {
  return (e, r) => typeof r == "object" ? Jt(t, e, r) : ((i, a, o) => {
    const n = a.hasOwnProperty(o);
    return a.constructor.createProperty(o, i), n ? Object.getOwnPropertyDescriptor(a, o) : void 0;
  })(t, e, r);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function g(t) {
  return Me({ ...t, state: !0, attribute: !1 });
}
const T = 1, V = 600, W = 0, I = 5, ve = {
  open_time_s: 20,
  close_time_s: 20,
  direction_settle_s: 0.5
};
async function Xe(t, e) {
  return t.callWS({
    type: "conx_dynamic_panel/get_config",
    entry_id: e
  });
}
async function Xt(t, e, r, i) {
  return t.callWS({
    type: "conx_dynamic_panel/update_profile",
    entry_id: e,
    profile_id: r,
    profile: i
  });
}
async function qt(t, e, r) {
  return t.callWS({
    type: "conx_dynamic_panel/create_profile",
    entry_id: e,
    profile: r
  });
}
async function Vt(t, e, r) {
  await t.callWS({
    type: "conx_dynamic_panel/delete_profile",
    entry_id: e,
    profile_id: r
  });
}
async function Kt(t, e, r, i, a) {
  return t.callWS({
    type: "conx_dynamic_panel/duplicate_profile",
    entry_id: e,
    profile_id: r,
    new_id: i,
    new_name: a
  });
}
async function xe(t, e, r, i = !1) {
  return t.callWS({
    type: "conx_dynamic_panel/set_active_profile",
    entry_id: e,
    profile_id: r,
    sync: i
  });
}
async function Zt(t, e) {
  return t.callWS({
    type: "conx_dynamic_panel/sync",
    entry_id: e
  });
}
async function Qt(t, e) {
  return t.callWS({
    type: "conx_dynamic_panel/pull",
    entry_id: e
  });
}
async function er(t, e) {
  return t.callWS({
    type: "conx_dynamic_panel/export_profiles",
    entry_id: e
  });
}
async function tr(t, e, r, i = "merge") {
  return t.callWS({
    type: "conx_dynamic_panel/import_profiles",
    entry_id: e,
    payload: r,
    mode: i
  });
}
async function rr(t, e, r) {
  return t.callWS({
    type: "conx_dynamic_panel/update_panel_name",
    entry_id: e,
    panel_name: r
  });
}
async function ir(t, e, r, i) {
  const a = {
    type: "conx_dynamic_panel/cover_command",
    entry_id: e,
    command: r
  };
  return i && (a.cover_id = i), t.callWS(a);
}
async function ar(t, e, r) {
  return t.callWS({
    type: "conx_dynamic_panel/execute_button",
    entry_id: e,
    button: r
  });
}
async function or(t, e, r) {
  var i;
  return (i = t.connection) != null && i.subscribeMessage ? t.connection.subscribeMessage(r, {
    type: "conx_dynamic_panel/subscribe",
    entry_id: e
  }) : () => {
  };
}
function K(t, e, r, i) {
  const a = typeof t == "number" ? t : Number(t);
  return Number.isFinite(a) ? Math.max(e, Math.min(r, a)) : i;
}
function x(t) {
  return Math.round(K(t, 1, 4, 4));
}
const nr = /* @__PURE__ */ new Set([
  "radio_mandatory",
  "radio_optional",
  "radio_split",
  "cover"
]), _t = 0.1, mt = 600, L = 2, we = [
  "toggle",
  "momentary",
  "radio",
  "cover_open",
  "cover_close"
], sr = /* @__PURE__ */ new Set(["radio", "cover_open", "cover_close"]);
function ce(t, e = L) {
  return K(t, _t, mt, e);
}
function cr(t, e) {
  const r = String(t || "").trim().toLowerCase();
  return we.includes(r) ? r : String(e || "").trim().toLowerCase() === "momentary" ? "momentary" : "toggle";
}
function ke(t) {
  return x(t) > 1 ? [...we] : we.filter((e) => !sr.has(e));
}
function gt(t) {
  return nr.has(t);
}
function qe(t, e) {
  return x(e) > 1 ? [...t] : t.filter((r) => !gt(r));
}
function Se(t, e) {
  return x(e) === 1 && gt(t) ? "toggle" : t;
}
function Ce(t) {
  return Math.max(0, Math.floor(x(t) / 2));
}
function lr(t, e) {
  const r = t * 2 + 1, i = t * 2 + 2;
  return i > e ? [1, e >= 2 ? 2 : 1] : [r, i];
}
function Ve(t, e, r) {
  const i = Math.round(typeof t == "number" ? t : Number(t)), a = x(r);
  return !Number.isFinite(i) || i < 1 || i > a ? Math.min(e, a) : i;
}
function U(t, e = {}) {
  const r = x(e.gangCount ?? 4), i = e.slot ?? 0, a = e.defaultId ?? `cover_${i + 1}`, [o, n] = lr(i, r), s = t || {}, c = Ve(s.open_button, o, r);
  let d = Ve(s.close_button, n, r);
  return d === c && (d = Array.from({ length: r }, (u, h) => h + 1).find((u) => u !== c) ?? Math.min(c + 1, r)), {
    id: String(s.id || "").trim() || a,
    open_button: c,
    close_button: d,
    open_time_s: K(
      s.open_time_s,
      T,
      V,
      ve.open_time_s
    ),
    close_time_s: K(
      s.close_time_s,
      T,
      V,
      ve.close_time_s
    ),
    direction_settle_s: K(
      s.direction_settle_s,
      W,
      I,
      ve.direction_settle_s
    ),
    opposite_press: s.opposite_press === "stop_then_reverse" ? "stop_then_reverse" : "stop_only"
  };
}
function $(t) {
  const e = x((t == null ? void 0 : t.gang_count) ?? 4), r = Ce(e);
  let i = [];
  if (Array.isArray(t == null ? void 0 : t.covers) && t.covers.length ? i = t.covers.map(
    (o, n) => U(o, { gangCount: e, defaultId: `cover_${n + 1}`, slot: n })
  ) : t != null && t.cover ? i = [U(t.cover, { gangCount: e, defaultId: "cover_1", slot: 0 })] : r > 0 && (i = [U(void 0, { gangCount: e, defaultId: "cover_1", slot: 0 })]), r === 0)
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
function dr(t) {
  const e = structuredClone(t);
  e.gang_count = x(e.gang_count ?? 4);
  let r = String(e.mode || "toggle");
  r === "momentary_mix" && (r = "mixed"), e.mode = Se(r, e.gang_count), typeof e.backlight_brightness != "number" || !Number.isFinite(e.backlight_brightness) ? e.backlight_brightness = 100 : e.backlight_brightness = Math.max(
    0,
    Math.min(100, Math.round(e.backlight_brightness))
  );
  const i = new Set(ke(e.gang_count));
  e.buttons = [1, 2, 3, 4].map((s) => {
    var u;
    const c = (u = e.buttons) == null ? void 0 : u.find((h) => h.index === s);
    let d = cr(c == null ? void 0 : c.role, c == null ? void 0 : c.press_mode);
    return i.has(d) || (d = "toggle"), {
      index: s,
      name: (c == null ? void 0 : c.name) ?? `Button ${s}`,
      action: (c == null ? void 0 : c.action) ?? null,
      radio_member: (c == null ? void 0 : c.radio_member) !== !1,
      role: d,
      pulse_time_s: ce(c == null ? void 0 : c.pulse_time_s, L),
      cover_id: d === "cover_open" || d === "cover_close" ? String((c == null ? void 0 : c.cover_id) || "cover_1").trim() || "cover_1" : null
    };
  });
  const a = Array.isArray(e.radio_groups) ? e.radio_groups : [], o = new Set(
    e.buttons.filter((s) => s.role === "radio" && s.index <= e.gang_count).map((s) => s.index)
  ), n = a.map((s, c) => ({
    id: String((s == null ? void 0 : s.id) || `g${c + 1}`),
    buttons: Array.isArray(s == null ? void 0 : s.buttons) ? s.buttons.map((d) => Number(d)).filter(
      (d, u, h) => d >= 1 && d <= e.gang_count && h.indexOf(d) === u && (e.mode !== "mixed" || o.has(d))
    ) : []
  }));
  for (; n.length < 2; )
    n.push({ id: `g${n.length + 1}`, buttons: [] });
  return e.radio_groups = n, e.covers = $(e), delete e.cover, e.selected_button != null && (e.selected_button < 1 || e.selected_button > e.gang_count) && (e.selected_button = null), e;
}
function Y(t) {
  return dr(t);
}
function pr(t, e) {
  return !t || !e ? t === e : JSON.stringify(t) === JSON.stringify(e);
}
function hr(t, e) {
  const r = new Blob([JSON.stringify(e, null, 2)], {
    type: "application/json"
  }), i = URL.createObjectURL(r), a = document.createElement("a");
  a.href = i, a.download = t, a.click(), URL.revokeObjectURL(i);
}
const ur = "YOUR_ENTRY_ID", ye = [
  { id: "morning", at: "06:30:00", profile: "morning" },
  { id: "evening", at: "18:00:00", profile: "evening" },
  { id: "night", at: "23:00:00", profile: "night" }
];
function Ke(t, e) {
  const r = (t || "").trim();
  return r || e;
}
function $e(t) {
  return String(t).split(`
`).map((e) => `# ${e.trim()}`.trimEnd());
}
function _r(t) {
  const { comments: e } = t, r = Ke(t.entryId, ur), i = {
    morning: e.morning,
    evening: e.evening,
    night: e.night
  }, a = (n) => {
    var s;
    return Ke((s = t.profileIds) == null ? void 0 : s[n], ye[n].profile);
  }, o = [
    ...$e(e.header),
    ...$e(e.sync),
    ...$e(e.ids),
    `alias: ${e.alias}`,
    "mode: single",
    "triggers:"
  ];
  return ye.forEach((n) => {
    o.push(`  # ${i[n.id]}`), o.push("  - trigger: time"), o.push(`    at: "${n.at}"`), o.push(`    id: ${n.id}`);
  }), o.push("actions:"), o.push("  - choose:"), ye.forEach((n, s) => {
    o.push("      - conditions:"), o.push("          - condition: trigger"), o.push(`            id: ${n.id}`), o.push("        sequence:"), o.push("          - action: conx_dynamic_panel.activate_profile"), o.push("            data:"), o.push(`              entry_id: ${r}`), o.push(`              profile_id: ${a(s)}`), o.push("              sync: true");
  }), `${o.join(`
`)}
`;
}
const J = 2, mr = /* @__PURE__ */ new Set([
  "toggle",
  "radio_mandatory",
  "radio_optional",
  "radio_split",
  "mixed",
  "cover"
]);
function gr(t) {
  const e = [];
  for (Array.isArray(t) && t.forEach((r, i) => {
    if (!w(r)) return;
    const a = [], o = Array.isArray(r.buttons) ? r.buttons : [];
    for (const n of o) {
      const s = Number(n);
      s >= 1 && s <= 4 && !a.includes(s) && a.push(s);
    }
    e.push({ id: String(r.id || `g${i + 1}`), buttons: a });
  }); e.length < 2; )
    e.push({ id: `g${e.length + 1}`, buttons: [] });
  return e;
}
function w(t) {
  return typeof t == "object" && t !== null && !Array.isArray(t);
}
function fr(t) {
  if (w(t)) {
    const e = Object.entries(t);
    if (!e.length)
      return { ok: !1, error: "profiles must be a non-empty object or array" };
    const r = {};
    for (const [i, a] of e) {
      const o = Ze(a, i);
      if (!o.ok)
        return o;
      r[o.profile.id] = o.profile;
    }
    return { ok: !0, profiles: r };
  }
  if (Array.isArray(t)) {
    if (!t.length)
      return { ok: !1, error: "profiles must be a non-empty object or array" };
    const e = {};
    for (let r = 0; r < t.length; r += 1) {
      const i = Ze(t[r], void 0);
      if (!i.ok)
        return { ok: !1, error: `${i.error} (index ${r})` };
      e[i.profile.id] = i.profile;
    }
    return { ok: !0, profiles: e };
  }
  return { ok: !1, error: "profiles must be a non-empty object or array" };
}
function Ze(t, e) {
  if (!w(t))
    return { ok: !1, error: "each profile must be an object" };
  const r = String(t.id || e || "").trim();
  if (!r)
    return { ok: !1, error: "profile is missing id" };
  const i = String(t.mode || "toggle");
  if (!mr.has(i))
    return { ok: !1, error: `unsupported mode for profile ${r}: ${i}` };
  const a = Array.isArray(t.buttons) ? t.buttons : [], o = [1, 2, 3, 4].map((s) => {
    const c = a.find(
      (u) => w(u) && Number(u.index) === s
    );
    if (!w(c))
      return { index: s, name: `Button ${s}`, action: null };
    let d = null;
    return w(c.action) && typeof c.action.action == "string" && (d = {
      action: c.action.action,
      target: w(c.action.target) ? c.action.target : {},
      data: w(c.action.data) ? c.action.data : {}
    }), {
      index: s,
      name: String(c.name ?? `Button ${s}`),
      action: d,
      radio_member: c.radio_member === void 0 ? !0 : !!c.radio_member
    };
  });
  let n = 100;
  if (t.backlight_brightness !== void 0 && t.backlight_brightness !== null) {
    const s = Number(t.backlight_brightness);
    if (!Number.isFinite(s))
      return { ok: !1, error: `invalid backlight_brightness for profile ${r}` };
    n = Math.max(0, Math.min(100, Math.round(s)));
  }
  return {
    ok: !0,
    profile: {
      id: r,
      name: String(t.name || r),
      mode: i,
      color_on: String(t.color_on || "cyan"),
      color_off: String(t.color_off || "blue"),
      radar: String(t.radar || "30s"),
      backlight: !!(t.backlight ?? !0),
      backlight_brightness: n,
      child_lock: !!(t.child_lock ?? !1),
      selected_button: t.selected_button === null || t.selected_button === void 0 ? null : Number(t.selected_button),
      gang_count: Math.max(1, Math.min(4, Number(t.gang_count) || 4)),
      buttons: o,
      radio_groups: gr(t.radio_groups),
      covers: Array.isArray(t.covers) ? t.covers : t.cover ? [t.cover] : void 0
    }
  };
}
function br(t) {
  if (!w(t))
    return { ok: !1, error: "Root must be a JSON object" };
  const e = t.schema_version ?? J, r = Number(e);
  if (!Number.isInteger(r) || r < 1)
    return { ok: !1, error: "schema_version must be a positive integer" };
  if (r > J)
    return {
      ok: !1,
      error: `Unsupported schema_version ${r}; current is ${J}`
    };
  const i = fr(t.profiles);
  if (!i.ok)
    return i;
  let a = null;
  return typeof t.active_profile_id == "string" && t.active_profile_id && (a = t.active_profile_id, !(a in i.profiles)) ? {
    ok: !1,
    error: `active_profile_id "${a}" is not present in profiles`
  } : {
    ok: !0,
    payload: {
      schema_version: J,
      active_profile_id: a,
      profiles: i.profiles
    }
  };
}
function vr(t, e) {
  return {
    schema_version: J,
    active_profile_id: e,
    profiles: structuredClone(t)
  };
}
function xr(t, e, r = "YOUR_CONFIG_ENTRY_ID") {
  const i = JSON.stringify(t, null, 2).split(`
`).map((a, o) => o === 0 ? a : `    ${a}`).join(`
`);
  return [
    "service: conx_dynamic_panel.import_profiles",
    "data:",
    `  entry_id: ${r}`,
    `  mode: ${e}`,
    `  payload: ${i}`
  ].join(`
`);
}
function yr(t) {
  if (!t)
    return [];
  const e = [];
  for (const r of Object.keys(t).sort()) {
    const i = t[r];
    if (!(!i || typeof i != "object"))
      for (const a of Object.keys(i).sort())
        e.push(`${r}.${a}`);
  }
  return e;
}
function Qe(t) {
  if (!t)
    return null;
  const e = t.trim(), r = e.indexOf(".");
  return r <= 0 || r === e.length - 1 ? null : e.slice(0, r);
}
function $r(t, e) {
  if (!t)
    return [];
  const r = (e == null ? void 0 : e.trim()) || null;
  return Object.keys(t).filter((i) => r ? i.startsWith(`${r}.`) : !0).sort();
}
function Oe() {
  return typeof customElements < "u" && typeof customElements.get == "function" && !!customElements.get("ha-entity-picker");
}
async function wr() {
  var e, r, i;
  if (Oe())
    return !0;
  const t = globalThis.loadCardHelpers;
  if (typeof t != "function")
    return !1;
  try {
    const a = await t(), o = await ((e = a.createCardElement) == null ? void 0 : e.call(a, {
      type: "entities",
      entities: []
    }));
    await ((i = o == null ? void 0 : (r = o.constructor).getConfigElement) == null ? void 0 : i.call(r));
  } catch {
  }
  return Oe();
}
function et(t, e) {
  const r = (e == null ? void 0 : e.trim()) || "";
  return !r || t.includes(r) ? t : [r, ...t];
}
const ft = "conx-dynamic-panel-lang", bt = {}, vt = {
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
  "card.open_export_wizard": "Export wizard",
  "card.back_to_editor": "Back to editor",
  "card.button": "Button",
  "card.button_expand": "Expand button settings",
  "card.button_collapse": "Collapse button settings",
  "card.label": "Label",
  "card.action": "Action",
  "card.entity_id": "Entity ID",
  "card.action_none": "No Home Assistant action",
  "card.entity_none": "No entity (optional)",
  "card.action_picker_hint": "Choose a service from Home Assistant.",
  "card.entity_picker_hint": "Entities are filtered by the action domain when set.",
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
  "card.mixed_cover_hint": "Shutter motor: use Open/Close roles + travel times here. Domain and entity for Home Assistant actions are under Toggle/Momentary in the button expanders below.",
  "role.toggle": "Toggle",
  "role.momentary": "Momentary",
  "role.radio": "Radio group",
  "role.cover_open": "Cover open",
  "role.cover_close": "Cover close"
}, kr = {
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
  "card.open_export_wizard": "אשף ייצוא",
  "card.back_to_editor": "חזרה לעריכה",
  "card.button": "כפתור",
  "card.button_expand": "הרחב הגדרות כפתור",
  "card.button_collapse": "כווץ הגדרות כפתור",
  "card.label": "תווית",
  "card.action": "פעולה",
  "card.entity_id": "מזהה ישות",
  "card.action_none": "ללא פעולת Home Assistant",
  "card.entity_none": "ללא ישות (אופציונלי)",
  "card.action_picker_hint": "בחרו שירות מרשימת Home Assistant.",
  "card.entity_picker_hint": "הישויות מסוננות לפי דומיין הפעולה כשנבחרה.",
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
  "card.mixed_cover_hint": "מנוע תריס: תפקידי פתיחה/סגירה + זמני נסיעה כאן. דומיין וישות לפעולות Home Assistant נמצאים תחת טוגל/רגעי במרחיבי הכפתורים למטה.",
  "role.toggle": "טוגל",
  "role.momentary": "רגעי",
  "role.radio": "קבוצת רדיו",
  "role.cover_open": "פתיחת תריס",
  "role.cover_close": "סגירת תריס"
}, Sr = {
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
  "card.open_export_wizard": "Мастер экспорта",
  "card.back_to_editor": "Назад к редактору",
  "card.button": "Кнопка",
  "card.button_expand": "Развернуть настройки кнопки",
  "card.button_collapse": "Свернуть настройки кнопки",
  "card.label": "Название",
  "card.action": "Действие",
  "card.entity_id": "Entity ID",
  "card.action_none": "Без действия Home Assistant",
  "card.entity_none": "Без сущности (необязательно)",
  "card.action_picker_hint": "Выберите службу из списка Home Assistant.",
  "card.entity_picker_hint": "Сущности фильтруются по домену действия, если он выбран.",
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
  "card.mixed_cover_hint": "Мотор ролеты: роли Открыть/Закрыть + время хода здесь. Домен и сущность для действий Home Assistant — у Тоггл/Импульс в раскрывающихся кнопках ниже.",
  "role.toggle": "Тоггл",
  "role.momentary": "Импульс",
  "role.radio": "Радиогруппа",
  "role.cover_open": "Открыть ролету",
  "role.cover_close": "Закрыть ролету"
}, Cr = {
  en: vt,
  he: kr,
  ru: Sr
}, Pe = [
  { id: "he", label: "עברית", flag: "IL" },
  { id: "en", label: "English", flag: "GB" },
  { id: "ru", label: "Русский", flag: "RU" }
];
function te(t) {
  const e = (t || "en").toLowerCase();
  return e.startsWith("he") || e.startsWith("iw") ? "he" : e.startsWith("ru") ? "ru" : "en";
}
function Or() {
  var t, e;
  try {
    const r = (e = (t = globalThis.localStorage) == null ? void 0 : t.getItem) == null ? void 0 : e.call(t, ft);
    if (r === "en" || r === "he" || r === "ru")
      return r;
  } catch {
  }
  return bt.language || null;
}
function Pr(t) {
  var e, r;
  bt.language = t;
  try {
    (r = (e = globalThis.localStorage) == null ? void 0 : e.setItem) == null || r.call(e, ft, t);
  } catch {
  }
}
function S(t, e) {
  const r = te(t);
  return Cr[r][e] || vt[e] || e;
}
function xt(t) {
  return te(t) === "he";
}
const yt = "conx-dynamic-panel-operate", $t = {};
function Er() {
  var t, e;
  try {
    const r = (e = (t = globalThis.localStorage) == null ? void 0 : t.getItem) == null ? void 0 : e.call(t, yt);
    if (r === "1")
      return !0;
    if (r === "0")
      return !1;
  } catch {
  }
  return $t.operate === !0;
}
function Ar(t) {
  var e, r;
  $t.operate = t;
  try {
    (r = (e = globalThis.localStorage) == null ? void 0 : e.setItem) == null || r.call(
      e,
      yt,
      t ? "1" : "0"
    );
  } catch {
  }
}
const wt = "conx-dynamic-panel-theme", Rr = {
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
}, Te = [
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
], zr = new Set(Te.map((t) => t.id));
function ue(t) {
  return t ? zr.has(t) ? t : Rr[t] || "noir" : "noir";
}
function tt() {
  var t, e;
  try {
    const r = (e = (t = globalThis.localStorage) == null ? void 0 : t.getItem) == null ? void 0 : e.call(t, wt);
    return r ? ue(r) : null;
  } catch {
  }
  return null;
}
function Mr(t) {
  var e, r;
  try {
    (r = (e = globalThis.localStorage) == null ? void 0 : e.setItem) == null || r.call(e, wt, t);
  } catch {
  }
}
function rt(t, e) {
  return t ? ue(t) : e || "noir";
}
var Tr = Object.defineProperty, Lr = Object.getOwnPropertyDescriptor, m = (t, e, r, i) => {
  for (var a = i > 1 ? void 0 : i ? Lr(e, r) : e, o = t.length - 1, n; o >= 0; o--)
    (n = t[o]) && (a = (i ? n(e, r, a) : n(a)) || a);
  return i && a && Tr(e, r, a), a;
};
const z = [
  "language",
  "profiles",
  "edit",
  "preview",
  "review",
  "transfer"
], it = {
  red: "#ff1744",
  blue: "#00c8de",
  green: "#00e676",
  white: "#f5f7fa",
  yellow: "#ffea00",
  magenta: "#f50057",
  cyan: "#00e5ff",
  warm_white: "#ffe0b2",
  warm_yellow: "#ffc400"
}, at = /* @__PURE__ */ new Set([
  "warm_white",
  "warm_yellow",
  "warmwhite",
  "warmyellow"
]), kt = "#00e5ff", Nr = "#00c8de", St = "conx-dynamic-panel-radio-groups-open";
function Br() {
  var t, e;
  try {
    const r = (e = (t = globalThis.localStorage) == null ? void 0 : t.getItem) == null ? void 0 : e.call(t, St);
    if (r === "0")
      return !1;
    if (r === "1")
      return !0;
  } catch {
  }
  return null;
}
function Dr(t) {
  var e, r;
  try {
    (r = (e = globalThis.localStorage) == null ? void 0 : e.setItem) == null || r.call(e, St, t ? "1" : "0");
  } catch {
  }
}
function pe(t) {
  return t.trim().toLowerCase().replace(/[\s-./]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}
function N(t) {
  if (!t)
    return !1;
  const e = pe(t);
  return at.has(e) ? !0 : at.has(e.replace(/_/g, ""));
}
function B(t) {
  const e = pe(t);
  return e === "warm_white" || e === "warmwhite" ? "white" : e === "warm_yellow" || e === "warmyellow" ? "yellow" : t.trim();
}
function Ur(t) {
  return (t || []).filter((e) => !N(e));
}
function ne(t, e = kt) {
  if (!t)
    return e;
  const i = B(t).trim().toLowerCase().replace(/[\s-]+/g, "_");
  return it[i] || it[i.replace(/_/g, "")] || e;
}
function jr(t, ...e) {
  const r = Ur(t), i = new Set(r.map((a) => pe(a)));
  for (const a of e) {
    const o = String(a || "").trim();
    if (!o)
      continue;
    const n = N(o) ? B(o) : o, s = pe(n);
    !s || i.has(s) || (r.push(n), i.add(s));
  }
  return r;
}
function Hr(t, ...e) {
  const r = [...t || []], i = new Set(r);
  for (const a of e) {
    const o = String(a || "").trim();
    !o || i.has(o) || (r.push(o), i.add(o));
  }
  return r;
}
function ot(t, e) {
  const r = t.trim().toLowerCase().replace(/[\s-]+/g, "_"), i = S(e, `color.${r}`);
  return i !== `color.${r}` ? i : t;
}
function Fr(t, e) {
  const r = t.trim().toLowerCase().replace(/[\s-]+/g, "_"), i = S(e, `radar.${r}`);
  return i !== `radar.${r}` ? i : t;
}
let _ = class extends D {
  constructor() {
    super(...arguments), this._loading = !1, this._busy = !1, this._syncPulse = !1, this._pressedRing = null, this._splitPreviewOn = {}, this._runtimeRelayStates = [], this._momentaryPreviewTimers = {}, this._radioPreviewSelected = null, this._theme = "noir", this._operateMode = !1, this._view = "editor", this._wizardStep = "transfer", this._importMode = "merge", this._serviceYaml = "", this._sections = {
      profiles: !0,
      appearance: !0,
      buttons: !0,
      theme: !1,
      preview: !0,
      actions: !0,
      transfer: !0
    }, this._expandedButtons = {}, this._activeTab = "profiles", this._menuOpen = !1, this._automationOpen = !1, this._previewOpen = !0, this._panelNameDraft = "", this._radioGroupsOpen = !0, this._haEntityPickerReady = !1, this._haPickerLoadStarted = !1, this._lastLiveRelays = {};
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
  setConfig(t) {
    if (!t.entry_id)
      throw new Error("entry_id is required");
    this._config = t, t.language && (this._uiLang = te(t.language)), this._theme = rt(t.theme, tt());
  }
  connectedCallback() {
    var t;
    super.connectedCallback(), this._uiLang || (this._uiLang = Or() || void 0), this._theme = rt((t = this._config) == null ? void 0 : t.theme, tt()), this._operateMode = Er(), this._operateMode && (this._previewOpen = !0), this._ensureFonts(), this._ensureRuntimeSubscription(), this._ensureHaEntityPicker();
  }
  _toggleOperateMode() {
    this._setOperateMode(!this._operateMode);
  }
  _setOperateMode(t) {
    this._operateMode = t, Ar(this._operateMode), this._operateMode && (this._previewOpen = !0, this._menuOpen = !1, this._automationOpen = !1, this._view === "export" && (this._view = "editor"));
  }
  _exitOperateMode() {
    this._setOperateMode(!1), this._menuOpen = !1;
  }
  disconnectedCallback() {
    this._teardownRuntimeSubscription(), this._clearFaceplatePreview(), super.disconnectedCallback();
  }
  _stepLabel(t) {
    return this.t(`card.step_${t}`);
  }
  _goToStep(t) {
    this._wizardStep = t, this._notice = void 0;
  }
  _wizardIndex() {
    return z.indexOf(this._wizardStep);
  }
  _wizardNext() {
    const t = this._wizardIndex();
    t < z.length - 1 && this._goToStep(z[t + 1]);
  }
  _wizardBack() {
    const t = this._wizardIndex();
    t > 0 && this._goToStep(z[t - 1]);
  }
  _buildServiceYaml(t) {
    if (!this._panel || !this._config)
      return "";
    const e = t || vr(this._panel.profiles, this._panel.active_profile_id);
    return xr(
      e,
      this._importMode,
      this._config.entry_id
    );
  }
  _refreshServiceYaml(t) {
    this._serviceYaml = this._buildServiceYaml(t);
  }
  async _copyServiceYaml() {
    const t = this._buildServiceYaml();
    this._serviceYaml = t, await this._copyToClipboard(t);
  }
  async _copyToClipboard(t) {
    try {
      await navigator.clipboard.writeText(t), this._notice = this.t("card.copied") + " ✓";
    } catch {
      this._error = "Clipboard unavailable";
    }
  }
  _buildAutomationYaml() {
    var e;
    const t = this._panel ? Object.keys(this._panel.profiles) : [];
    return _r({
      entryId: (e = this._config) == null ? void 0 : e.entry_id,
      profileIds: t,
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
    const t = "conx-dynamic-panel-fonts";
    if (document.getElementById(t))
      return;
    const e = document.createElement("link");
    e.id = t, e.rel = "stylesheet", e.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap", document.head.appendChild(e);
  }
  updated(t) {
    var e;
    (t.has("hass") || t.has("_config")) && this.hass && ((e = this._config) != null && e.entry_id) && !this._panel && !this._loading && this._load(), (t.has("hass") || t.has("_config") || t.has("_panel")) && this._ensureRuntimeSubscription();
  }
  willUpdate(t) {
    var e, r;
    if ((t.has("hass") || t.has("_panel") || t.has("_runtimeRelayStates") || t.has("_draft")) && ((r = (e = this._panel) == null ? void 0 : e.relay_entities) != null && r.length)) {
      const i = this._previewAfterLiveReconcile();
      i && (this._splitPreviewOn = i);
    }
  }
  get _language() {
    var t, e, r;
    return this._uiLang ? this._uiLang : te(
      ((e = (t = this.hass) == null ? void 0 : t.locale) == null ? void 0 : e.language) || ((r = this.hass) == null ? void 0 : r.language) || "en"
    );
  }
  t(t) {
    return S(this._language, t);
  }
  get _dirty() {
    return !pr(this._draft || null, this._saved || null);
  }
  _setLanguage(t) {
    this._uiLang = t, Pr(t);
  }
  _setTheme(t) {
    this._theme = ue(t), Mr(this._theme), this._config && (this._config = { ...this._config, theme: this._theme }, this.dispatchEvent(
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
  _isRadioMember(t) {
    var r;
    const e = (r = this._draft) == null ? void 0 : r.buttons.find((i) => i.index === t);
    return (e == null ? void 0 : e.radio_member) !== !1;
  }
  _ensureRadioGroups(t) {
    const e = Array.isArray(t.radio_groups) ? t.radio_groups : [], r = x(t.gang_count ?? 4), i = t.mode === "mixed" ? new Set(
      (t.buttons || []).filter(
        (o) => o.role === "radio" && o.index <= r
      ).map((o) => o.index)
    ) : null, a = e.map((o, n) => ({
      id: String((o == null ? void 0 : o.id) || `g${n + 1}`),
      buttons: Array.isArray(o == null ? void 0 : o.buttons) ? o.buttons.map((s) => Number(s)).filter(
        (s, c, d) => s >= 1 && s <= r && d.indexOf(s) === c && (i == null || i.has(s))
      ) : []
    }));
    for (; a.length < 2; )
      a.push({ id: `g${a.length + 1}`, buttons: [] });
    t.radio_groups = a;
  }
  _radioGroupFor(t) {
    var e, r;
    return ((r = (e = this._draft) == null ? void 0 : e.radio_groups) == null ? void 0 : r.find(
      (i) => i.buttons.includes(t)
    )) ?? null;
  }
  _radioGroupsOverlap() {
    var e;
    const t = /* @__PURE__ */ new Map();
    for (const r of ((e = this._draft) == null ? void 0 : e.radio_groups) || [])
      for (const i of r.buttons) {
        if (t.has(i)) return !0;
        t.set(i, r.id);
      }
    return !1;
  }
  _toggleSplitGroupButton(t, e, r) {
    this._patchDraft((i) => {
      if (r && i.mode === "mixed") {
        const o = i.buttons.find((n) => n.index === e);
        o && o.role !== "radio" && (o.role = "radio", o.cover_id = null);
      }
      this._ensureRadioGroups(i), (i.radio_groups || []).forEach((o, n) => {
        n === t ? r && !o.buttons.includes(e) ? o.buttons = [...o.buttons, e] : r || (o.buttons = o.buttons.filter((s) => s !== e)) : r && (o.buttons = o.buttons.filter((s) => s !== e));
      });
    });
  }
  _ungroupedButtons() {
    var e;
    const t = /* @__PURE__ */ new Set();
    for (const r of ((e = this._draft) == null ? void 0 : e.radio_groups) || [])
      for (const i of r.buttons)
        t.add(i);
    return new Set(this._gangIndexes().filter((r) => !t.has(r)));
  }
  _makeButtonIndependent(t) {
    this._patchDraft((e) => {
      this._ensureRadioGroups(e);
      for (const r of e.radio_groups || [])
        r.buttons = r.buttons.filter((i) => i !== t);
    });
  }
  _renderRadioMemberCell(t, e, r = {}) {
    const i = !!r.independent, a = [
      "radio-member",
      e ? "on" : "",
      i ? "is-independent" : ""
    ].filter(Boolean).join(" "), o = () => {
      if (!this._busy) {
        if (i) {
          e || this._makeButtonIndependent(t);
          return;
        }
        this._toggleSplitGroupButton(
          r.groupIndex ?? 0,
          t,
          !e
        );
      }
    };
    return l`
      <button
        type="button"
        class=${a}
        role="switch"
        aria-checked=${e ? "true" : "false"}
        ?disabled=${this._busy || i && e}
        @click=${o}
      >
        <span class="radio-member-label">L${t}</span>
      </button>
    `;
  }
  _renderRadioGroupsEditor() {
    if (!this._draft)
      return p;
    if (this._draft.mode === "mixed") {
      if (!this._draft.buttons.some(
        (i) => i.index <= this._gangCount() && i.role === "radio"
      ))
        return p;
    } else if (this._draft.mode !== "radio_split")
      return p;
    const t = this._ungroupedButtons(), e = this._radioGroupsOpen;
    return l`
      <div class="radio-groups-section ${e ? "open" : ""}">
        <div class="radio-groups-head">
          <div class="radio-groups-head-main">
            <span class="menu-label">${this.t("card.radio_groups")}</span>
            ${e ? p : l`<div class="radio-groups-summary">
                  ${this._radioGroupsSummary()}
                </div>`}
          </div>
          <label class="switch" title=${this.t("card.radio_groups_toggle")}>
            <input
              type="checkbox"
              data-radio-groups-open
              .checked=${e}
              ?disabled=${this._busy}
              @change=${(r) => this._setRadioGroupsOpen(
      r.target.checked
    )}
            />
            <span class="slider"></span>
          </label>
        </div>
        ${e ? l`
              <p class="radio-groups-hint">
                ${this.t("card.radio_groups_hint")}
              </p>
              ${(this._draft.radio_groups || []).map(
      (r, i) => l`
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
        t.has(r),
        { independent: !0 }
      )
    )}
                </div>
              </div>
            ` : p}
        ${this._radioGroupsOverlap() ? l`<div class="radio-groups-error">
              ${this.t("card.radio_groups_overlap")}
            </div>` : p}
      </div>
    `;
  }
  _toggleSection(t) {
    this._sections = { ...this._sections, [t]: !this._sections[t] };
  }
  _toggleButtonEditor(t) {
    this._expandedButtons = {
      ...this._expandedButtons,
      [t]: !this._expandedButtons[t]
    };
  }
  async _load() {
    var t;
    if (!(!this.hass || !((t = this._config) != null && t.entry_id))) {
      this._loading = !0, this._error = void 0;
      try {
        const e = await Xe(this.hass, this._config.entry_id);
        this._applyPanel(e), this._ensureRuntimeSubscription();
      } catch (e) {
        this._error = e instanceof Error ? e.message : String(e);
      } finally {
        this._loading = !1;
      }
    }
  }
  _applyPanel(t) {
    var i;
    this._panel = t, this._panelNameDraft = t.panel_name, this._runtimeRelayStates = t.relay_states ? [...t.relay_states] : [];
    const e = t.active_profile_id, r = e ? t.profiles[e] : void 0;
    this._saved = r ? Y(r) : void 0, this._draft = r ? Y(r) : void 0, this._migrateBrokenWarmLedDraftColors(), this._clearFaceplatePreview(), ((i = this._draft) == null ? void 0 : i.mode) === "radio_split" && (this._radioGroupsOpen = Br() ?? !0), this._syncMomentaryFromRuntime(t.momentary_active);
  }
  /** Remap draft warm_white/warm_yellow → white/yellow (Z2M hang workaround). */
  _migrateBrokenWarmLedDraftColors() {
    if (!this._draft)
      return;
    let t = !1;
    N(this._draft.color_on) && (this._draft.color_on = B(this._draft.color_on), t = !0), N(this._draft.color_off) && (this._draft.color_off = B(this._draft.color_off), t = !0), t && this.requestUpdate();
  }
  /** Merge coordinator runtime push — never overwrites draft / saved profiles. */
  _applyRuntime(t) {
    this._panel && (t.entry_id && t.entry_id !== this._panel.entry_id || (this._panel = {
      ...this._panel,
      sync_status: t.sync_status ?? this._panel.sync_status,
      last_sync: t.last_sync !== void 0 ? t.last_sync : this._panel.last_sync,
      last_error: t.last_error !== void 0 ? t.last_error : this._panel.last_error,
      auto_sync: t.auto_sync ?? this._panel.auto_sync,
      relay_entities: t.relay_entities ?? this._panel.relay_entities,
      relay_states: t.relay_states ?? this._panel.relay_states,
      momentary_active: t.momentary_active ?? this._panel.momentary_active,
      cover_state: t.cover_state ?? this._panel.cover_state
    }, t.relay_states && (this._runtimeRelayStates = [...t.relay_states]), this._syncMomentaryFromRuntime(t.momentary_active), this._reconcilePreviewWithLiveRelays()));
  }
  _teardownRuntimeSubscription() {
    this._unsubRuntime && (this._unsubRuntime(), this._unsubRuntime = void 0), this._runtimeEntryId = void 0;
  }
  async _ensureRuntimeSubscription() {
    var e;
    const t = (e = this._config) == null ? void 0 : e.entry_id;
    if (!(!this.hass || !t || !this._panel) && !(this._unsubRuntime && this._runtimeEntryId === t)) {
      this._teardownRuntimeSubscription(), this._runtimeEntryId = t;
      try {
        this._unsubRuntime = await or(this.hass, t, (r) => {
          this._applyRuntime(r);
        });
      } catch {
        this._runtimeEntryId = void 0, this._unsubRuntime = void 0;
      }
    }
  }
  _isMomentaryButton(t) {
    var e;
    return ((e = this._draft) == null ? void 0 : e.mode) === "mixed" && this._buttonRole(t) === "momentary";
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
    const t = (i = this._panel) == null ? void 0 : i.relay_entities;
    if (!(t != null && t.length))
      return null;
    let e = !1;
    const r = { ...this._splitPreviewOn };
    for (let a = 1; a <= t.length; a++) {
      const o = this._liveRelayOn(a), n = Object.prototype.hasOwnProperty.call(this._lastLiveRelays, a) ? this._lastLiveRelays[a] : null;
      if (this._lastLiveRelays[a] = o, !(o === null || o === n)) {
        if (this._isMomentaryButton(a)) {
          o ? this._momentaryPreviewTimers[a] == null ? (r[a] = !0, this._armMomentaryUiPulse(a, r), e = !0) : r[a] || (r[a] = !0, e = !0) : (this._clearMomentaryPreviewTimer(a), r[a] && (r[a] = !1, e = !0));
          continue;
        }
        Object.prototype.hasOwnProperty.call(r, a) && (delete r[a], e = !0);
      }
    }
    return e ? r : null;
  }
  _reconcilePreviewWithLiveRelays() {
    const t = this._previewAfterLiveReconcile();
    t && (this._splitPreviewOn = t);
  }
  /** Backend armed a pulse — mirror with a UI timer if the ring is not pulsing yet. */
  _syncMomentaryFromRuntime(t) {
    if (!t || !this._draft)
      return;
    const e = new Set(t);
    for (const r of e)
      this._isMomentaryButton(r) && this._momentaryPreviewTimers[r] == null && (this._splitPreviewOn = {
        ...this._splitPreviewOn,
        [r]: !0
      }, this._armMomentaryUiPulse(r));
    for (const r of Object.keys(this._momentaryPreviewTimers).map(Number))
      e.has(r) || this._liveRelayOn(r) === !1 && (this._clearMomentaryPreviewTimer(r), this._splitPreviewOn[r] && (this._splitPreviewOn = {
        ...this._splitPreviewOn,
        [r]: !1
      }));
  }
  /** Reset local LED preview so presses never leak into draft dirty state. */
  _clearFaceplatePreview() {
    for (const t of Object.values(this._momentaryPreviewTimers))
      window.clearTimeout(t);
    this._momentaryPreviewTimers = {}, this._splitPreviewOn = {}, this._radioPreviewSelected = null, this._pressedRing = null, this._lastLiveRelays = {};
  }
  _clearMomentaryPreviewTimer(t) {
    const e = this._momentaryPreviewTimers[t];
    e != null && (window.clearTimeout(e), delete this._momentaryPreviewTimers[t]);
  }
  /**
   * Arm UI auto-OFF after pulse_time_s. Does not toggle-cancel.
   * Optional `preview` mutates an in-progress reconcile map instead of state.
   */
  _armMomentaryUiPulse(t, e) {
    var a;
    this._clearMomentaryPreviewTimer(t);
    const r = (a = this._draft) == null ? void 0 : a.buttons.find((o) => o.index === t), i = ce(r == null ? void 0 : r.pulse_time_s, L) * 1e3;
    e ? e[t] = !0 : this._splitPreviewOn = {
      ...this._splitPreviewOn,
      [t]: !0
    }, this._momentaryPreviewTimers[t] = window.setTimeout(() => {
      delete this._momentaryPreviewTimers[t], this._liveRelayOn(t) !== !0 && (this._splitPreviewOn = {
        ...this._splitPreviewOn,
        [t]: !1
      });
    }, i);
  }
  /** Local faceplate pulse: ON now, auto-OFF after pulse_time_s; re-press cancels. */
  _pulseMomentaryPreview(t) {
    if (this._clearMomentaryPreviewTimer(t), this._splitPreviewOn[t]) {
      this._splitPreviewOn = {
        ...this._splitPreviewOn,
        [t]: !1
      };
      return;
    }
    this._armMomentaryUiPulse(t);
  }
  _setRadioGroupsOpen(t) {
    this._radioGroupsOpen = t, Dr(t);
  }
  _groupSummary(t) {
    const e = [...t].sort((r, i) => r - i).map((r) => `L${r}`);
    return e.length ? e.join(", ") : "—";
  }
  /** One-line assignment recap shown while the radio groups block is collapsed. */
  _radioGroupsSummary() {
    var r;
    const t = this._ungroupedButtons(), e = (((r = this._draft) == null ? void 0 : r.radio_groups) || []).map(
      (i, a) => `${this.t("card.radio_group")} ${a + 1}: ${this._groupSummary(
        i.buttons
      )}`
    );
    return e.push(
      `${this.t("card.radio_toggle")}: ${this._groupSummary(
        [1, 2, 3, 4].filter((i) => i <= this._gangCount() && t.has(i))
      )}`
    ), e.join(" · ");
  }
  _gangCount(t) {
    var e;
    return x(((e = t || this._draft) == null ? void 0 : e.gang_count) ?? 4);
  }
  _gangIndexes(t) {
    const e = this._gangCount(t);
    return Array.from({ length: e }, (r, i) => i + 1);
  }
  _covers(t) {
    return $(t || this._draft || void 0);
  }
  _coverConfig(t, e) {
    const r = this._covers(t);
    return e ? r.find((i) => i.id === e) || r[0] || U(void 0) : r[0] || U(void 0);
  }
  _buttonRole(t) {
    var r;
    const e = (r = this._draft) == null ? void 0 : r.buttons.find((i) => i.index === t);
    return (e == null ? void 0 : e.role) || "toggle";
  }
  _isCoverButton(t) {
    return this._coverDirectionFor(t) != null;
  }
  _coverDirectionFor(t) {
    if (!this._draft)
      return null;
    if (this._draft.mode === "mixed") {
      const e = this._buttonRole(t);
      return e === "cover_open" ? "open" : e === "cover_close" ? "close" : null;
    }
    if (this._draft.mode !== "cover")
      return null;
    for (const e of this._covers()) {
      if (e.open_button === t) return "open";
      if (e.close_button === t) return "close";
    }
    return null;
  }
  _coverForButton(t) {
    var e;
    if (!this._draft)
      return null;
    if (this._draft.mode === "mixed") {
      const r = this._draft.buttons.find((o) => o.index === t), i = (r == null ? void 0 : r.role) || "toggle";
      if (i !== "cover_open" && i !== "cover_close")
        return null;
      const a = String((r == null ? void 0 : r.cover_id) || ((e = this._covers()[0]) == null ? void 0 : e.id) || "cover_1").trim() || "cover_1";
      return this._covers().find((o) => o.id === a) || this._covers().find(
        (o) => o.open_button === t || o.close_button === t
      ) || null;
    }
    return this._covers().find(
      (r) => r.open_button === t || r.close_button === t
    ) || null;
  }
  _patchCovers(t) {
    this._patchDraft((e) => {
      const r = $(e);
      t(r, e), e.covers = $({ ...e, covers: r }), delete e.cover;
    });
  }
  _setGangCount(t) {
    this._patchDraft((e) => {
      e.gang_count = x(t), e.mode = Se(e.mode, e.gang_count), e.covers = $(e), delete e.cover, e.radio_groups && (e.radio_groups = e.radio_groups.map((r) => ({
        ...r,
        buttons: r.buttons.filter((i) => i <= e.gang_count)
      }))), e.selected_button != null && (e.selected_button < 1 || e.selected_button > e.gang_count) && (e.selected_button = null);
    });
  }
  _setMode(t) {
    var e;
    !this._draft || !qe(
      ((e = this._panel) == null ? void 0 : e.capabilities.modes) || [t],
      this._gangCount()
    ).includes(t) || (this._clearFaceplatePreview(), this._patchDraft((r) => {
      var i;
      if (r.mode = t, r.mode === "cover") {
        const a = x(r.gang_count ?? 4);
        r.gang_count = a < 4 ? 4 : a, r.covers = $(r), delete r.cover;
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
  _setButtonRole(t, e) {
    this._patchDraft((r) => {
      const i = r.buttons.find((o) => o.index === t);
      if (!(!i || !ke(r.gang_count).includes(e))) {
        if (i.role = e, e === "momentary")
          i.pulse_time_s = ce(
            i.pulse_time_s,
            L
          ), i.cover_id = null;
        else if (e === "cover_open" || e === "cover_close") {
          i.cover_id = String(i.cover_id || "cover_1").trim() || "cover_1", r.covers = $(r);
          const o = r.covers.find((n) => n.id === i.cover_id);
          o && (e === "cover_open" ? o.open_button = t : o.close_button = t);
        } else
          i.cover_id = null;
        e === "radio" ? (this._ensureRadioGroups(r), this._setRadioGroupsOpen(!0)) : r.radio_groups && (r.radio_groups = r.radio_groups.map((o) => ({
          ...o,
          buttons: o.buttons.filter((n) => n !== t)
        })));
      }
    });
  }
  _setButtonCoverId(t, e) {
    this._patchDraft((r) => {
      var s;
      const i = r.buttons.find((c) => c.index === t);
      if (!i)
        return;
      const a = i.role || "toggle";
      if (a !== "cover_open" && a !== "cover_close")
        return;
      r.covers = $(r);
      const o = String(e || "").trim() || ((s = r.covers[0]) == null ? void 0 : s.id) || "cover_1";
      i.cover_id = o;
      let n = r.covers.find((c) => c.id === o);
      n || (r.covers = $({
        ...r,
        covers: [
          ...r.covers,
          {
            id: o,
            open_button: a === "cover_open" ? t : 1,
            close_button: a === "cover_close" ? t : 2,
            open_time_s: 20,
            close_time_s: 20,
            direction_settle_s: 0.5,
            opposite_press: "stop_only"
          }
        ]
      }), n = r.covers.find((c) => c.id === o)), n && (a === "cover_open" ? n.open_button = t : n.close_button = t);
    });
  }
  /**
   * Assign a panel button to a direction. Choosing the button already used by
   * the other direction swaps them, so the pair can never collapse onto one
   * button and leave the motor without a stop path. Buttons owned by another
   * cover are refused.
   */
  _setCoverButton(t, e, r) {
    this._patchCovers((i) => {
      const a = i.find((s) => s.id === t);
      if (!a || i.some(
        (s) => s.id !== t && (s.open_button === r || s.close_button === r)
      ))
        return;
      const n = e === "open" ? a.open_button : a.close_button;
      e === "open" ? (a.close_button === r && (a.close_button = n), a.open_button = r) : (a.open_button === r && (a.open_button = n), a.close_button = r);
    });
  }
  _setCoverTime(t, e, r) {
    const i = Math.max(
      T,
      Math.min(V, Number.isFinite(r) ? r : T)
    );
    this._patchCovers((a) => {
      const o = a.find((n) => n.id === t);
      o && (e === "open" ? o.open_time_s = i : o.close_time_s = i);
    });
  }
  _addCover() {
    this._patchCovers((t, e) => {
      const r = Ce(e.gang_count);
      if (t.length >= r)
        return;
      const i = new Set(
        t.flatMap((s) => [s.open_button, s.close_button])
      ), a = this._gangIndexes(e).filter((s) => !i.has(s)), o = a[0] ?? 1, n = a[1] ?? Math.min(o + 1, e.gang_count);
      t.push(
        U(
          { open_button: o, close_button: n },
          {
            gangCount: e.gang_count,
            defaultId: `cover_${t.length + 1}`,
            slot: t.length
          }
        )
      );
    });
  }
  _removeCover(t) {
    this._patchCovers((e) => {
      if (e.length <= 1)
        return;
      const r = e.filter((i) => i.id !== t);
      e.splice(0, e.length, ...r);
    });
  }
  async _coverCommand(t, e) {
    if (!(!this.hass || !this._config)) {
      this._busy = !0, this._error = void 0;
      try {
        const r = await ir(
          this.hass,
          this._config.entry_id,
          t,
          e
        );
        this._panel && (this._panel = { ...this._panel, cover_state: r });
      } catch (r) {
        this._error = r instanceof Error ? r.message : String(r);
      } finally {
        this._busy = !1;
      }
    }
  }
  _coverStateLabel(t) {
    var r, i;
    const e = (r = this._panel) == null ? void 0 : r.cover_state;
    if (t && ((i = e == null ? void 0 : e.covers) != null && i.length)) {
      const a = e.covers.find((o) => o.id === t);
      return this.t(`card.cover_state_${(a == null ? void 0 : a.state) || "idle"}`);
    }
    return this.t(`card.cover_state_${(e == null ? void 0 : e.state) || "idle"}`);
  }
  _renderGangPicker() {
    if (!this._draft)
      return p;
    const t = this._gangCount();
    return l`
      <label class="field">
        <span>${this.t("card.gang_count")}</span>
        <div class="gang-picker" role="radiogroup" dir="ltr" data-gang-picker>
          ${[1, 2, 3, 4].map(
      (e) => l`
              <button
                type="button"
                class="radio-member ${t === e ? "on" : ""}"
                role="radio"
                aria-checked=${t === e ? "true" : "false"}
                ?disabled=${this._busy}
                @click=${() => this._setGangCount(e)}
              >
                <span class="radio-member-label">${e}</span>
              </button>
            `
    )}
        </div>
        <p class="radio-groups-hint">${this.t("card.gang_count_hint")}</p>
      </label>
    `;
  }
  _renderCoverButtonPicker(t, e) {
    const r = e === "open" ? t.open_button : t.close_button, i = new Set(
      this._covers().filter((a) => a.id !== t.id).flatMap((a) => [a.open_button, a.close_button])
    );
    return l`
      <div
        class="cover-buttons"
        role="radiogroup"
        dir="ltr"
        style="--conx-gang-count:${this._gangCount()}"
      >
        ${this._gangIndexes().map(
      (a) => l`
            <button
              type="button"
              class="radio-member ${r === a ? "on" : ""}"
              role="radio"
              aria-checked=${r === a ? "true" : "false"}
              ?disabled=${this._busy || i.has(a)}
              @click=${() => this._setCoverButton(t.id, e, a)}
            >
              <span class="radio-member-label">L${a}</span>
            </button>
          `
    )}
      </div>
    `;
  }
  /** First cover-role button index that owns timing for a given motor slot. */
  _firstCoverRoleIndex(t) {
    if (!this._draft)
      return null;
    const e = String(t || "cover_1").trim() || "cover_1", r = this._draft.buttons.find(
      (i) => i.index <= this._gangCount() && (i.role === "cover_open" || i.role === "cover_close") && (String(i.cover_id || "cover_1").trim() || "cover_1") === e
    );
    return (r == null ? void 0 : r.index) ?? null;
  }
  _renderInlineCoverTimes(t) {
    var o;
    const e = (o = this._panel) == null ? void 0 : o.capabilities.cover, r = (e == null ? void 0 : e.min_time_s) ?? T, i = (e == null ? void 0 : e.max_time_s) ?? V, a = this.t("card.cover_seconds");
    return l`
      <div class="mixed-cover-times" data-inline-cover-times data-cover-id=${t.id}>
        <div class="cover-times cover-times-compact">
          <label class="field">
            <span>${this.t("card.cover_open_time")} (${a})</span>
            <input
              type="number"
              data-cover-open-time
              min=${r}
              max=${i}
              step="0.5"
              .value=${String(t.open_time_s)}
              ?disabled=${this._busy}
              @change=${(n) => this._setCoverTime(
      t.id,
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
              .value=${String(t.close_time_s)}
              ?disabled=${this._busy}
              @change=${(n) => this._setCoverTime(
      t.id,
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
              min=${(e == null ? void 0 : e.min_settle_s) ?? W}
              max=${(e == null ? void 0 : e.max_settle_s) ?? I}
              step="0.1"
              .value=${String(t.direction_settle_s)}
              ?disabled=${this._busy}
              @change=${(n) => {
      const s = Number(n.target.value);
      this._patchCovers((c) => {
        const d = c.find((u) => u.id === t.id);
        d && (d.direction_settle_s = Math.max(
          W,
          Math.min(
            I,
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
                .value=${t.opposite_press}
                ?disabled=${this._busy}
                @change=${(n) => {
      const s = n.target.value;
      this._patchCovers((c) => {
        const d = c.find((u) => u.id === t.id);
        d && (d.opposite_press = s === "stop_then_reverse" ? "stop_then_reverse" : "stop_only");
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
        </div>
      </div>
    `;
  }
  _renderOneCoverEditor(t, e) {
    var s;
    const r = (s = this._panel) == null ? void 0 : s.capabilities.cover, i = (r == null ? void 0 : r.min_time_s) ?? T, a = (r == null ? void 0 : r.max_time_s) ?? V, o = this.t("card.cover_seconds"), n = this._covers().length > 1;
    return l`
      <div class="cover-block" data-cover-id=${t.id}>
        <div class="cover-head">
          <span class="menu-label"
            >${this.t("card.cover")} ${e + 1}</span
          >
          ${n ? l`<button
                type="button"
                class="btn danger"
                ?disabled=${this._busy}
                @click=${() => this._removeCover(t.id)}
              >
                ${this.t("card.cover_remove")}
              </button>` : p}
        </div>
        <div class="cover-grid">
          <div class="cover-field">
            <span class="cover-label">${this.t("card.cover_open_button")}</span>
            ${this._renderCoverButtonPicker(t, "open")}
          </div>
          <div class="cover-field">
            <span class="cover-label">${this.t("card.cover_close_button")}</span>
            ${this._renderCoverButtonPicker(t, "close")}
          </div>
        </div>
        <div class="cover-times cover-times-compact">
          <label class="field">
            <span>${this.t("card.cover_open_time")} (${o})</span>
            <input
              type="number"
              data-cover-open-time
              min=${i}
              max=${a}
              step="0.5"
              .value=${String(t.open_time_s)}
              ?disabled=${this._busy}
              @change=${(c) => this._setCoverTime(
      t.id,
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
              .value=${String(t.close_time_s)}
              ?disabled=${this._busy}
              @change=${(c) => this._setCoverTime(
      t.id,
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
              min=${(r == null ? void 0 : r.min_settle_s) ?? W}
              max=${(r == null ? void 0 : r.max_settle_s) ?? I}
              step="0.1"
              .value=${String(t.direction_settle_s)}
              ?disabled=${this._busy}
              @change=${(c) => {
      const d = Number(c.target.value);
      this._patchCovers((u) => {
        const h = u.find((f) => f.id === t.id);
        h && (h.direction_settle_s = Math.max(
          W,
          Math.min(
            I,
            Number.isFinite(d) ? d : 0
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
              .value=${t.opposite_press}
              ?disabled=${this._busy}
              @change=${(c) => {
      const d = c.target.value;
      this._patchCovers((u) => {
        const h = u.find((f) => f.id === t.id);
        h && (h.opposite_press = d === "stop_then_reverse" ? "stop_then_reverse" : "stop_only");
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
        ${t.open_button === t.close_button ? l`<div class="radio-groups-error">
              ${this.t("card.cover_same_button")}
            </div>` : p}
      </div>
    `;
  }
  _renderEmptyCoverSlot(t) {
    return l`
      <div class="cover-block cover-block-empty" data-cover-slot=${t}>
        <div class="cover-head">
          <span class="menu-label"
            >${this.t("card.cover")} ${t + 1}</span
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
      return p;
    const t = this._covers(), e = Ce(this._gangCount()), r = Array.from(
      { length: Math.max(e, t.length) },
      (i, a) => t[a] ?? null
    );
    return l`
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
      return p;
    const t = (r = this._saved) == null ? void 0 : r.mode;
    if (t !== "cover" && t !== "mixed" || t === "mixed" && !((a = (i = this._saved) == null ? void 0 : i.buttons) != null && a.some(
      (o) => o.role === "cover_open" || o.role === "cover_close"
    )))
      return p;
    const e = this._covers(this._saved);
    return l`
      <div class="cover-control" data-cover-control>
        ${e.map((o) => {
      var c, d, u, h, f;
      const n = (u = (d = (c = this._panel) == null ? void 0 : c.cover_state) == null ? void 0 : d.covers) == null ? void 0 : u.find(
        (b) => b.id === o.id
      ), s = (n == null ? void 0 : n.state) || e.length === 1 && ((f = (h = this._panel) == null ? void 0 : h.cover_state) == null ? void 0 : f.state) || "idle";
      return l`
            <div class="cover-control-block" data-cover-id=${o.id}>
              <div class="cover-control-head">
                <span class="menu-label"
                  >${this.t("card.cover_live")}${e.length > 1 ? ` · ${o.id}` : ""}</span
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
  async _selectProfile(t) {
    if (!(!await this._guardDirty() || !this.hass || !this._config)) {
      this._busy = !0;
      try {
        const e = await xe(
          this.hass,
          this._config.entry_id,
          t,
          !1
        );
        this._applyPanel(e);
      } catch (e) {
        this._error = e instanceof Error ? e.message : String(e);
      } finally {
        this._busy = !1;
      }
    }
  }
  async _saveDraft() {
    if (!(!this.hass || !this._config || !this._draft)) {
      this._busy = !0, this._error = void 0;
      try {
        const t = await Xt(
          this.hass,
          this._config.entry_id,
          this._draft.id,
          this._draft
        ), e = await Xe(this.hass, this._config.entry_id);
        this._applyPanel(e), this._saved = Y(t), this._draft = Y(t), this._migrateBrokenWarmLedDraftColors();
      } catch (t) {
        this._error = t instanceof Error ? t.message : String(t);
      } finally {
        this._busy = !1;
      }
    }
  }
  _discard() {
    this._saved && (this._draft = Y(this._saved), this._migrateBrokenWarmLedDraftColors(), this._clearFaceplatePreview());
  }
  async _sync() {
    if (!(!this.hass || !this._config)) {
      this._dirty && await this._saveDraft(), this._busy = !0, this._error = void 0, this._syncPulse = !0;
      try {
        const t = await Zt(this.hass, this._config.entry_id);
        this._applyPanel(t);
      } catch (t) {
        this._error = t instanceof Error ? t.message : String(t), this._config && await this._load();
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
        const t = await Qt(this.hass, this._config.entry_id);
        this._applyPanel(t);
      } catch (t) {
        this._error = t instanceof Error ? t.message : String(t);
      } finally {
        this._busy = !1;
      }
    }
  }
  async _createProfile() {
    if (!this.hass || !this._config || !this._panel || !await this._guardDirty())
      return;
    const t = `profile_${Date.now()}`, e = {
      id: t,
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
      await qt(this.hass, this._config.entry_id, e);
      const r = await xe(
        this.hass,
        this._config.entry_id,
        t,
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
    const t = `${this._draft.id}_copy_${Date.now()}`;
    this._busy = !0;
    try {
      await Kt(
        this.hass,
        this._config.entry_id,
        this._draft.id,
        t,
        `${this._draft.name} copy`
      );
      const e = await xe(
        this.hass,
        this._config.entry_id,
        t,
        !1
      );
      this._applyPanel(e);
    } catch (e) {
      this._error = e instanceof Error ? e.message : String(e);
    } finally {
      this._busy = !1;
    }
  }
  _renameProfile() {
    if (!this._draft)
      return;
    const t = window.prompt(this.t("card.rename"), this._draft.name);
    t && (this._draft.name = t, this.requestUpdate());
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
          await Vt(this.hass, this._config.entry_id, this._draft.id), await this._load();
        } catch (t) {
          this._error = t instanceof Error ? t.message : String(t);
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
        const t = await er(this.hass, this._config.entry_id), e = this._panel.panel_name.replace(/[^\w.-]+/g, "_");
        hr(`conx-profiles-${e}.json`, t), this._refreshServiceYaml(t), this._notice = this.t("card.export_ok");
      } catch (t) {
        this._error = t instanceof Error ? t.message : String(t);
      } finally {
        this._busy = !1;
      }
    }
  }
  _openImport() {
    this._importInput || (this._importInput = document.createElement("input"), this._importInput.type = "file", this._importInput.accept = "application/json,.json", this._importInput.hidden = !0, this.renderRoot.appendChild(this._importInput)), this._importInput.onchange = () => {
      var e, r;
      const t = (r = (e = this._importInput) == null ? void 0 : e.files) == null ? void 0 : r[0];
      this._importInput.value = "", t && this._importFile(t, this._importMode);
    }, this._importInput.click();
  }
  async _importFile(t, e) {
    if (!(!this.hass || !this._config) && await this._guardDirty()) {
      this._busy = !0, this._error = void 0;
      try {
        const r = await t.text(), i = br(JSON.parse(r));
        if (!i.ok)
          throw new Error(i.error || this.t("card.import_invalid"));
        const a = await tr(
          this.hass,
          this._config.entry_id,
          i.payload,
          e
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
  _patchDraft(t) {
    this._draft && (t(this._draft), this.requestUpdate());
  }
  _onProfileNameInput(t) {
    const e = t.target.value;
    this._patchDraft((r) => {
      r.name = e;
    });
  }
  _onButtonNameInput(t, e) {
    const r = e.target.value;
    this._patchDraft((i) => {
      const a = i.buttons.find((o) => o.index === t);
      a && (a.name = r);
    });
  }
  async _ensureHaEntityPicker() {
    if (!this._haPickerLoadStarted) {
      if (this._haPickerLoadStarted = !0, Oe()) {
        this._haEntityPickerReady = !0;
        return;
      }
      this._haEntityPickerReady = await wr();
    }
  }
  _setButtonAction(t, e, r) {
    const i = e.trim();
    this._patchDraft((a) => {
      var d, u, h;
      const o = a.buttons.find((f) => f.index === t);
      if (!o)
        return;
      if (!i) {
        o.action = null;
        return;
      }
      const n = (u = (d = o.action) == null ? void 0 : d.target) == null ? void 0 : u.entity_id, s = Qe(i);
      let c = r === void 0 ? (n == null ? void 0 : n.trim()) || "" : (r ?? "").trim();
      s && c && !c.startsWith(`${s}.`) && (c = ""), o.action = {
        action: i,
        target: c ? { entity_id: c } : {},
        data: ((h = o.action) == null ? void 0 : h.data) || {}
      };
    });
  }
  _onButtonActionSelect(t, e) {
    const r = e.target.value.trim();
    this._setButtonAction(t, r);
  }
  _onButtonEntitySelect(t, e) {
    const r = e.target.value.trim();
    this._patchDraft((i) => {
      var n, s;
      const a = i.buttons.find((c) => c.index === t);
      if (!a)
        return;
      const o = ((n = a.action) == null ? void 0 : n.action) || "";
      if (!o) {
        a.action = null;
        return;
      }
      a.action = {
        action: o,
        target: r ? { entity_id: r } : {},
        data: ((s = a.action) == null ? void 0 : s.data) || {}
      };
    });
  }
  _onHaEntityPickerChanged(t, e) {
    e.stopPropagation();
    const r = e.detail, i = ((r == null ? void 0 : r.value) ?? "").trim();
    this._onButtonEntitySelect(t, {
      target: { value: i }
    });
  }
  _renderActionEntityPickers(t, e, r) {
    var s, c;
    const i = et(
      yr((s = this.hass) == null ? void 0 : s.services),
      e
    ), a = Qe(e), o = et(
      $r((c = this.hass) == null ? void 0 : c.states, a),
      r
    ), n = this._haEntityPickerReady && !!this.hass;
    return l`
      <label class="field">
        <span>${this.t("card.action")}</span>
        <div class="select-wrap select-wrap-wide">
          <select
            data-action-picker
            data-button=${t}
            .value=${e}
            ?disabled=${this._busy}
            @change=${(d) => this._onButtonActionSelect(t, d)}
          >
            <option value="">${this.t("card.action_none")}</option>
            ${i.map(
      (d) => l`<option value=${d}>${d}</option>`
    )}
          </select>
        </div>
        <span class="field-hint">${this.t("card.action_picker_hint")}</span>
      </label>
      <label class="field">
        <span>${this.t("card.entity_id")}</span>
        ${n ? l`
              <ha-entity-picker
                data-entity-picker
                data-button=${t}
                .hass=${this.hass}
                .value=${r || void 0}
                .includeDomains=${a ? [a] : void 0}
                allow-custom-entity
                ?disabled=${this._busy || !e}
                @value-changed=${(d) => this._onHaEntityPickerChanged(t, d)}
              ></ha-entity-picker>
            ` : l`
              <div class="select-wrap select-wrap-wide">
                <select
                  data-entity-picker
                  data-button=${t}
                  .value=${r}
                  ?disabled=${this._busy || !e}
                  @change=${(d) => this._onButtonEntitySelect(t, d)}
                >
                  <option value="">${this.t("card.entity_none")}</option>
                  ${o.map(
      (d) => l`<option value=${d}>${d}</option>`
    )}
                </select>
              </div>
            `}
        <span class="field-hint">${this.t("card.entity_picker_hint")}</span>
      </label>
    `;
  }
  _buttonEntityId(t) {
    var i, a, o;
    const e = (i = this._draft) == null ? void 0 : i.buttons.find((n) => n.index === t), r = (o = (a = e == null ? void 0 : e.action) == null ? void 0 : a.target) == null ? void 0 : o.entity_id;
    return (r == null ? void 0 : r.trim()) || null;
  }
  _relayEntityId(t) {
    var i;
    const e = (i = this._panel) == null ? void 0 : i.relay_entities;
    if (!e || t < 1 || t > e.length)
      return null;
    const r = e[t - 1];
    return (r == null ? void 0 : r.trim()) || null;
  }
  _entityIsOn(t) {
    var i, a, o;
    const e = (o = (a = (i = this.hass) == null ? void 0 : i.states) == null ? void 0 : a[t]) == null ? void 0 : o.state;
    if (e == null)
      return null;
    const r = String(e).toLowerCase();
    return ["unavailable", "unknown"].includes(r) ? null : ["on", "open", "home", "playing", "active"].includes(r);
  }
  /** Live mapped relay state for a 1-based button index, or null if unknown. */
  _liveRelayOn(t) {
    var i, a;
    const e = this._relayEntityId(t);
    if (e) {
      const o = this._entityIsOn(e);
      if (o !== null)
        return o;
    }
    const r = this._runtimeRelayStates[t - 1] ?? ((a = (i = this._panel) == null ? void 0 : i.relay_states) == null ? void 0 : a[t - 1]);
    return r === void 0 ? null : r;
  }
  _hasOptimisticRing(t) {
    return Object.prototype.hasOwnProperty.call(this._splitPreviewOn, t);
  }
  _toggleLocalRing(t) {
    this._splitPreviewOn = {
      ...this._splitPreviewOn,
      [t]: !this._splitPreviewOn[t]
    };
  }
  _isRingOn(t) {
    var s, c, d;
    if (!this._draft)
      return !1;
    const e = this._liveRelayOn(t), r = this._hasOptimisticRing(t), i = !!this._splitPreviewOn[t], a = this._momentaryPreviewTimers[t] != null, o = this._coverDirectionFor(t);
    if (o) {
      if (e !== null)
        return e;
      const u = this._coverForButton(t), h = (s = this._panel) == null ? void 0 : s.cover_state;
      if (h != null && h.active && u) {
        const f = (c = h.covers) == null ? void 0 : c.find((b) => b.id === u.id);
        return f ? f.direction === o : h.cover_id === u.id || !((d = h.covers) != null && d.length) ? h.direction === o : !1;
      }
      return r ? i : !1;
    }
    if (this._isMomentaryButton(t))
      return e === !0 || a || r && i ? !0 : e === !1 ? !1 : r ? i : !1;
    if (e !== null && !r)
      return e;
    if (r)
      return i;
    if (e !== null)
      return e;
    if (this._draft.mode === "radio_split" || this._draft.mode === "mixed" && this._buttonRole(t) === "radio") {
      const u = this._buttonEntityId(t);
      if (u) {
        const h = this._entityIsOn(u);
        if (h !== null)
          return h;
      }
      return !1;
    }
    if ((this._draft.mode === "radio_mandatory" || this._draft.mode === "radio_optional") && this._isRadioMember(t))
      return (this._radioPreviewSelected ?? this._draft.selected_button) === t;
    const n = this._buttonEntityId(t);
    if (n) {
      const u = this._entityIsOn(n);
      if (u !== null)
        return u;
    }
    return t % 2 === 1;
  }
  _onRingPress(t) {
    if (this._pressedRing = t, window.setTimeout(() => {
      this._pressedRing === t && (this._pressedRing = null);
    }, 180), !this._draft)
      return;
    const e = this._coverDirectionFor(t);
    if (e) {
      const i = this._coverForButton(t);
      if (!i)
        return;
      const a = e === "open" ? i.close_button : i.open_button;
      this._splitPreviewOn = {
        ...this._splitPreviewOn,
        [t]: !this._splitPreviewOn[t],
        [a]: !1
      }, this._dispatchButtonPress(t);
      return;
    }
    if (this._draft.mode === "radio_split") {
      const i = this._radioGroupFor(t), a = { ...this._splitPreviewOn };
      if (!i)
        a[t] = !a[t];
      else {
        if (a[t])
          return;
        for (const o of i.buttons)
          a[o] = o === t;
      }
      this._splitPreviewOn = a, this._dispatchButtonPress(t);
      return;
    }
    if (this._draft.mode === "mixed") {
      const i = this._buttonRole(t);
      if (i === "radio") {
        const a = this._radioGroupFor(t), o = { ...this._splitPreviewOn };
        if (!a)
          o[t] = !o[t];
        else {
          if (o[t])
            return;
          for (const n of a.buttons)
            o[n] = n === t;
        }
        this._splitPreviewOn = o, this._dispatchButtonPress(t);
        return;
      }
      if (i === "momentary") {
        this._pulseMomentaryPreview(t), this._dispatchButtonPress(t);
        return;
      }
      this._toggleLocalRing(t), this._dispatchButtonPress(t);
      return;
    }
    if (this._draft.mode === "toggle") {
      this._toggleLocalRing(t), this._dispatchButtonPress(t);
      return;
    }
    if (!this._isRadioMember(t)) {
      this._toggleLocalRing(t), this._dispatchButtonPress(t);
      return;
    }
    (this._radioPreviewSelected ?? this._draft.selected_button) !== t && (this._radioPreviewSelected = t, this._dispatchButtonPress(t));
  }
  /**
   * Drive physical relays + HA actions through the integration.
   * Uses the saved active profile on the backend; never marks the draft dirty.
   */
  async _dispatchButtonPress(t) {
    var r;
    const e = (r = this._config) == null ? void 0 : r.entry_id;
    if (!(!this.hass || !e || this._busy))
      try {
        const i = await ar(this.hass, e, t);
        this._applyRuntime(i);
      } catch (i) {
        this._error = i instanceof Error ? i.message : this.t("card.error"), this.requestUpdate();
      }
  }
  _ringOnColor() {
    var t;
    return ne((t = this._draft) == null ? void 0 : t.color_on, kt);
  }
  _ringOffColor() {
    var t;
    return ne((t = this._draft) == null ? void 0 : t.color_off, Nr);
  }
  _renderFlag(t) {
    return t === "IL" ? l`
        <span class="flag flag-il" aria-hidden="true">
          <span class="flag-il-bar"></span>
          <span class="flag-il-star">✦</span>
          <span class="flag-il-bar"></span>
        </span>
      ` : t === "GB" ? l`<span class="flag flag-gb" aria-hidden="true"></span>` : l`<span class="flag flag-ru" aria-hidden="true"></span>`;
  }
  _renderSection(t, e, r) {
    const i = this._sections[t];
    return l`
      <section class="panel-section ${i ? "open" : "closed"}">
        <header class="section-head">
          <div class="section-title">${e}</div>
          <label class="switch" title=${this.t("card.section_toggle")}>
            <input
              type="checkbox"
              .checked=${i}
              @change=${() => this._toggleSection(t)}
            />
            <span class="slider"></span>
          </label>
        </header>
        <div class="section-body">
          <div class="section-body-inner">${i ? r : p}</div>
        </div>
      </section>
    `;
  }
  _renderFaceplate() {
    if (!this._draft)
      return p;
    const t = this._ringOnColor(), e = this._ringOffColor();
    return l`
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
        style="--ring-on:${t};--ring-off:${e};--conx-gang-count:${this._gangCount()}"
        role="img"
        aria-label=${this.t("card.preview")}
      >
        <div class="faceplate-bezel">
          ${this._operateMode ? l`
                <button
                  type="button"
                  class="faceplate-menu-btn"
                  data-operate-menu
                  aria-label=${this.t("card.menu")}
                  aria-expanded=${this._menuOpen ? "true" : "false"}
                  ?disabled=${this._busy}
                  @click=${(r) => {
      r.stopPropagation(), this._menuOpen = !this._menuOpen;
    }}
                >
                  <span></span><span></span><span></span>
                </button>
              ` : p}
          <div class="faceplate-skin"></div>
          <div class="faceplate-glass">
            <div class="faceplate-labels">
              ${this._draft.buttons.filter((r) => r.index <= this._gangCount()).map(
      (r) => l`
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
      return l`
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
    const t = this._wizardIndex();
    return l`
      <nav class="wizard-steps" aria-label=${this.t("card.wizard")}>
        ${z.map((e, r) => {
      const i = e === this._wizardStep, a = r < t;
      return l`
            <button
              type="button"
              class="wizard-step ${i ? "active" : ""} ${a ? "done" : ""}"
              ?disabled=${this._busy}
              @click=${() => this._goToStep(e)}
            >
              <span class="wizard-index">${r + 1}</span>
              <span class="wizard-label">${this._stepLabel(e)}</span>
            </button>
          `;
    })}
      </nav>
      <p class="wizard-hint">${this.t(`card.step_${this._wizardStep}_hint`)}</p>
    `;
  }
  _renderWizardFooter() {
    const t = this._wizardIndex();
    return l`
      <div class="wizard-footer">
        <button
          type="button"
          class="btn"
          ?disabled=${this._busy || t <= 0}
          @click=${this._wizardBack}
        >
          ${this.t("card.wizard_back")}
        </button>
        <button
          type="button"
          class="btn primary"
          ?disabled=${this._busy || t >= z.length - 1}
          @click=${this._wizardNext}
        >
          ${this.t("card.wizard_next")}
        </button>
      </div>
    `;
  }
  _renderThemePicker() {
    return l`
      <div class="theme-picker" role="group" aria-label=${this.t("card.theme")}>
        <div class="theme-picker-label">${this.t("card.theme")}</div>
        <div class="theme-swatches">
          ${Te.map(
      (t) => l`
              <button
                type="button"
                class="theme-swatch ${this._theme === t.id ? "active" : ""}"
                style="--swatch:${t.swatch};--swatch-accent:${t.accent}"
                title=${this.t(`theme.${t.id}`)}
                ?disabled=${this._busy}
                @click=${() => this._setTheme(t.id)}
              >
                <span class="theme-swatch-face" aria-hidden="true"></span>
                <span class="theme-swatch-name">${this.t(`theme.${t.id}`)}</span>
              </button>
            `
    )}
        </div>
      </div>
    `;
  }
  _renderStepLanguage() {
    return l`
      <div class="lang-hero" role="group" aria-label=${this.t("card.language")}>
        ${Pe.map(
      (t) => l`
            <button
              type="button"
              class="lang-hero-btn ${this._language === t.id ? "active" : ""}"
              ?disabled=${this._busy}
              @click=${() => this._setLanguage(t.id)}
            >
              ${this._renderFlag(t.flag)}
              <span class="lang-hero-code">${t.id.toUpperCase()}</span>
              <span class="lang-hero-name">${t.label}</span>
            </button>
          `
    )}
      </div>
    `;
  }
  _renderStepProfiles() {
    return !this._panel || !this._draft ? p : l`
      <div class="profile-list">
        ${Object.values(this._panel.profiles).map(
      (t) => {
        var e;
        return l`
            <button
              type="button"
              class="profile-chip ${t.id === ((e = this._draft) == null ? void 0 : e.id) ? "active" : ""}"
              ?disabled=${this._busy}
              @click=${() => this._selectProfile(t.id)}
            >
              <span class="chip-name">${t.name}</span>
              <span class="chip-id">${t.id}</span>
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
            @input=${(t) => {
      this._panelNameDraft = t.target.value;
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
    const t = this._panelNameDraft.trim();
    if (!t || t === this._panel.panel_name) {
      this._panelNameDraft = this._panel.panel_name;
      return;
    }
    this._busy = !0, this._error = void 0;
    try {
      const e = await rr(
        this.hass,
        this._config.entry_id,
        t
      );
      this._applyPanel(e), this._notice = this.t("card.panel_name_ok");
    } catch (e) {
      this._error = e instanceof Error ? e.message : String(e), this._panelNameDraft = this._panel.panel_name;
    } finally {
      this._busy = !1;
    }
  }
  _renderModePicker() {
    if (!this._panel || !this._draft)
      return p;
    const t = qe(
      this._panel.capabilities.modes,
      this._gangCount()
    ), e = Se(
      this._draft.mode,
      this._gangCount()
    );
    return l`
      <label class="field">
        <span>${this.t("card.mode")}</span>
        <div class="mode-picker" role="radiogroup" data-mode-picker>
          ${t.map(
      (r) => l`
              <button
                type="button"
                class="radio-member ${e === r ? "on" : ""}"
                role="radio"
                aria-checked=${e === r ? "true" : "false"}
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
      return p;
    const t = jr(
      this._panel.capabilities.colors,
      this._draft.color_on,
      this._draft.color_off
    ), e = N(this._draft.color_on) ? B(this._draft.color_on) : this._draft.color_on, r = N(this._draft.color_off) ? B(this._draft.color_off) : this._draft.color_off, i = Hr(
      this._panel.capabilities.radar,
      this._draft.radar
    );
    return l`
          <div class="grid-2">
            <label class="field">
              <span>${this.t("card.color_on")}</span>
              <div class="select-wrap color-select">
                <span
                  class="swatch"
                  style="background:${ne(e)}"
                ></span>
                <select
                  .value=${e}
                  ?disabled=${this._busy}
                  @change=${(a) => this._patchDraft((o) => {
      o.color_on = a.target.value;
    })}
                >
                  ${t.map(
      (a) => l`<option value=${a}>${ot(
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
                  style="background:${ne(r)}"
                ></span>
                <select
                  .value=${r}
                  ?disabled=${this._busy}
                  @change=${(a) => this._patchDraft((o) => {
      o.color_off = a.target.value;
    })}
                >
                  ${t.map(
      (a) => l`<option value=${a}>${ot(
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
      (a) => l`<option value=${a}>${Fr(
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
      return p;
    const t = ke(this._gangCount()), e = this._covers(), r = e.length > 1, i = this._draft.buttons.filter(
      (a) => a.index <= this._gangCount()
    );
    return l`
      <div class="mixed-roles-section" data-mixed-roles>
        <div class="mixed-roles-head">
          <span class="menu-label">${this.t("card.mixed_roles")}</span>
        </div>
        <p class="radio-groups-hint" data-mixed-hint>
          ${this.t("card.mixed_hint")}
        </p>
        ${i.map((a) => {
      var F;
      const o = a.role || "toggle", n = a.pulse_time_s ?? L, s = String(a.cover_id || ((F = e[0]) == null ? void 0 : F.id) || "cover_1").trim() || "cover_1", c = (a.name || "").trim() || "—", d = o === "cover_open" || o === "cover_close", u = o === "momentary" || o === "radio" || d, h = e.find((v) => v.id === s) || e[0], f = d ? this._firstCoverRoleIndex(s) : null, b = d && h && f === a.index, y = d && h && f != null && f !== a.index;
      return l`
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
                  ${t.map(
        (v) => l`
                      <button
                        type="button"
                        class="radio-member ${o === v ? "on" : ""}"
                        role="radio"
                        aria-checked=${o === v ? "true" : "false"}
                        data-role=${v}
                        ?disabled=${this._busy}
                        @click=${() => this._setButtonRole(a.index, v)}
                      >
                        <span class="radio-member-label"
                          >${this.t(`role.${v}`)}</span
                        >
                      </button>
                    `
      )}
                </div>
              </div>
              ${u ? l`
                    <div class="mixed-role-extras">
                      ${o === "momentary" ? l`
                            <label class="field field-inline mixed-pulse">
                              <span
                                >${this.t("card.pulse_time")} (${this.t(
        "card.cover_seconds"
      )})</span
                              >
                              <input
                                type="number"
                                data-pulse-time
                                min=${_t}
                                max=${mt}
                                step="0.1"
                                .value=${String(n)}
                                ?disabled=${this._busy}
                                @change=${(v) => {
        const ae = Number(
          v.target.value
        );
        this._patchDraft((oe) => {
          const R = oe.buttons.find(
            (_e) => _e.index === a.index
          );
          R && (R.pulse_time_s = ce(
            ae,
            L
          ));
        });
      }}
                              />
                            </label>
                          ` : p}
                      ${o === "radio" ? l`<p
                            class="radio-groups-hint"
                            data-mixed-radio-hint
                          >
                            ${this.t("card.mixed_radio_hint")}
                          </p>` : p}
                      ${d ? l`
                            ${r ? l`
                                  <label
                                    class="field field-inline mixed-cover-id"
                                  >
                                    <span>${this.t("card.cover_id")}</span>
                                    <div class="select-wrap">
                                      <select
                                        data-cover-id
                                        .value=${s}
                                        ?disabled=${this._busy || e.length === 0}
                                        @change=${(v) => this._setButtonCoverId(
        a.index,
        v.target.value
      )}
                                      >
                                        ${e.map(
        (v) => l`
                                            <option value=${v.id}
                                              >${v.id}</option
                                            >
                                          `
      )}
                                      </select>
                                    </div>
                                  </label>
                                ` : l`<span
                                  class="mixed-cover-slot"
                                  data-cover-id
                                  data-cover-slot=${s}
                                  >${this.t("card.cover_id")}:
                                  ${s}</span
                                >`}
                            <p
                              class="radio-groups-hint"
                              data-mixed-cover-hint
                            >
                              ${this.t("card.mixed_cover_hint")}
                            </p>
                            ${b && h ? this._renderInlineCoverTimes(h) : p}
                            ${y && f != null ? l`<p
                                  class="radio-groups-hint"
                                  data-mixed-cover-times-on
                                >
                                  ${this.t("card.mixed_cover_times_on").replace(
        "{n}",
        String(f)
      )}
                                </p>` : p}
                          ` : p}
                    </div>
                  ` : p}
            </div>
          `;
    })}
      </div>
    `;
  }
  _renderButtonsFields() {
    return !this._panel || !this._draft ? p : l`
      ${this._renderModePicker()} ${this._renderMixedRolesSection()}
      ${this._renderRadioGroupsEditor()}
      ${this._renderCoverEditor()}
          <div class="buttons-accordion">
            ${this._draft.buttons.filter((t) => t.index <= this._gangCount()).map((t) => {
      var b, y, F, v, ae, oe;
      const e = !!this._expandedButtons[t.index], r = String(
        ((y = (b = t.action) == null ? void 0 : b.target) == null ? void 0 : y.entity_id) || ""
      ), i = (t.name || "").trim() || "—", a = ((F = t.action) == null ? void 0 : F.action) || "", o = ((v = this._draft) == null ? void 0 : v.mode) === "radio_mandatory" || ((ae = this._draft) == null ? void 0 : ae.mode) === "radio_optional", n = t.radio_member !== !1, s = this._coverDirectionFor(t.index), c = ((oe = this._draft) == null ? void 0 : oe.mode) === "mixed" ? t.role || "toggle" : null, d = c === "cover_open" || c === "cover_close", u = c ? this.t(`role.${c}`) : s ? this.t(
        s === "open" ? "card.cover_open" : "card.cover_close"
      ) : o ? n ? this.t("card.radio_member") : this.t("card.radio_toggle") : "", h = !d && !a, f = [
        d ? "" : a,
        d ? "" : r,
        u,
        h ? this.t("card.missing_action") : ""
      ].filter(Boolean).join(" · ") || "—";
      return l`
                <div
                  class="button-edit ${e ? "open" : ""}"
                  data-button=${t.index}
                >
                  <button
                    type="button"
                    class="button-edit-toggle"
                    aria-expanded=${e ? "true" : "false"}
                    title=${e ? this.t("card.button_collapse") : this.t("card.button_expand")}
                    ?disabled=${this._busy}
                    @click=${() => this._toggleButtonEditor(t.index)}
                  >
                    <span class="button-edit-chevron" aria-hidden="true"></span>
                    <span class="button-edit-summary">
                      <span class="button-edit-title">
                        ${this.t("card.button")} ${t.index} · ${i}
                      </span>
                      <span class="button-edit-meta">${f}</span>
                    </span>
                  </button>
                  <div class="button-edit-body">
                    <div class="button-edit-fields">
                      ${e ? l`
                            <label class="field">
                              <span>${this.t("card.label")}</span>
                              <input
                                type="text"
                                .value=${t.name}
                                ?disabled=${this._busy}
                                @input=${(R) => this._onButtonNameInput(t.index, R)}
                              />
                            </label>
                            ${d ? p : l`
                                  ${h ? l`<p
                                        class="radio-groups-hint"
                                        data-missing-action
                                      >
                                        ${this.t("card.missing_action")}
                                      </p>` : p}
                                  ${this._renderActionEntityPickers(
        t.index,
        a,
        r
      )}
                                `}
                            ${o ? l`
                                  <label class="field">
                                    <span>${this.t("card.radio_participation")}</span>
                                    <div class="select-wrap">
                                      <select
                                        .value=${n ? "radio" : "toggle"}
                                        ?disabled=${this._busy}
                                        @change=${(R) => this._patchDraft((_e) => {
        const Ne = _e.buttons.find(
          (Ct) => Ct.index === t.index
        );
        Ne && (Ne.radio_member = R.target.value === "radio");
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
                                ` : p}
                          ` : p}
                    </div>
                  </div>
                </div>
              `;
    })}
          </div>
    `;
  }
  _renderStepEdit() {
    return !this._panel || !this._draft ? p : l`
      ${this._renderAppearanceFields()}
      ${this._renderButtonsFields()}
    `;
  }
  _renderStepReview() {
    return !this._draft || !this._panel ? p : l`
      <div class="review-grid">
        <div><strong>${this.t("card.profile_name")}</strong> ${this._draft.name}</div>
        <div><strong>${this.t("card.mode")}</strong> ${this.t(`mode.${this._draft.mode}`)}</div>
        <div><strong>${this.t("card.color_on")}</strong> ${this._draft.color_on}</div>
        <div><strong>${this.t("card.color_off")}</strong> ${this._draft.color_off}</div>
        <div><strong>${this.t("card.radar")}</strong> ${this._draft.radar}</div>
        <div>
          <strong>${this.t("card.buttons")}</strong>
          ${this._draft.buttons.map((t) => t.name).join(" · ")}
        </div>
        ${this._draft.mode === "cover" ? l`<div data-cover-review>
              <strong>${this.t("card.cover")}</strong>
              ${this._covers().map(
      (t) => `${t.id}: L${t.open_button}/${t.close_button} (${t.open_time_s}/${t.close_time_s}${this.t("card.cover_seconds")})`
    ).join(" · ")}
            </div>` : p}
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
      return p;
    const t = this._serviceYaml || this._buildServiceYaml();
    return l`
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
            @change=${(e) => {
      this._importMode = e.target.value, this._refreshServiceYaml();
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
        <textarea class="yaml-box" readonly rows="12" .value=${t}></textarea>
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
        return p;
    }
  }
  render() {
    var i;
    const t = xt(this._language);
    if (!((i = this._config) != null && i.entry_id))
      return l`<ha-card class="conx-card"><div class="pad">${this.t("card.missing_entry")}</div></ha-card>`;
    if (this._loading && !this._panel)
      return l`<ha-card class="conx-card"><div class="pad">${this.t("card.loading")}</div></ha-card>`;
    if (!this._panel || !this._draft)
      return l`<ha-card class="conx-card"><div class="pad error">${this._error || this.t("card.loading")}</div></ha-card>`;
    const e = !!this._config.compact, r = this._operateMode;
    return l`
      <ha-card
        dir=${t ? "rtl" : "ltr"}
        data-theme=${this._theme}
        data-operate=${r ? "true" : "false"}
        class="conx-card theme-${this._theme} ${this._view === "export" ? "export-open" : "editor-open"} ${this._menuOpen ? "menu-open" : ""} ${e ? "compact" : ""} ${r ? "operate-mode" : ""} ${this._syncPulse ? "syncing-pulse" : ""}"
      >
        <div class="atmosphere"></div>
        ${r ? p : l`
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
                ${this._dirty ? l`<div class="warn unsaved-draft" role="status">${this.t("card.unsaved")}</div>` : p}
                ${!this._dirty && (this._panel.sync_status === "pending" || this._panel.sync_status === "out_of_sync") ? l`<div class="notice sync-needed" role="status" data-sync-needed>
                      ${this.t("card.sync_needed")}
                    </div>` : p}
                ${this._notice ? l`<div class="notice">${this._notice}</div>` : p}
                ${this._error || this._panel.last_error ? l`<div class="error">${this._error || this._panel.last_error}</div>` : p}
                ${this._renderActionButtons("top")}
              </div>
            `}

        ${this._renderMainEditor()}
        ${this._menuOpen ? this._renderSettingsMenu() : p}
        ${this._automationOpen ? this._renderAutomationExample() : p}
        ${this._view === "export" ? this._renderExportView() : p}
      </ha-card>
    `;
  }
  _renderSettingsMenu() {
    const t = this._operateMode;
    return l`
      <div
        class="conx-layer"
        @click=${(e) => {
      e.target === e.currentTarget && (this._menuOpen = !1);
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
          ${t ? l`
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
              ` : p}
          <div class="menu-section">
            <span class="menu-label">${this.t("card.language")}</span>
            <div class="lang-flags" role="group" aria-label=${this.t("card.language")}>
              ${Pe.map(
      (e) => l`
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
    const t = this._buildAutomationYaml();
    return l`
      <div
        class="conx-layer"
        @click=${(e) => {
      e.target === e.currentTarget && (this._automationOpen = !1);
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
          <pre class="automation-yaml" dir="ltr" lang="en">${t}</pre>
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
      return p;
    const t = this._operateMode, e = t || this._previewOpen, r = [
      "profiles",
      "appearance",
      "buttons"
    ], i = {
      profiles: this.t("card.profiles"),
      appearance: this.t("card.editor"),
      buttons: this.t("card.buttons")
    };
    return l`
      <div class="layout single-layout ${t ? "operate-layout" : ""}">
        <section
          class="hero-preview ${e ? "open" : "closed"} ${t ? "operate-hero" : ""}"
          data-hero-preview
        >
          ${t ? l`
                <header class="section-head operate-profile-only" data-operate-profile>
                  <div class="hero-profile-name" aria-live="polite">${this._draft.name}</div>
                </header>
              ` : l`
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
          ${e ? l`<div class="hero-body">
                ${this._renderFaceplate()} ${this._renderCoverControl()}
              </div>` : p}
        </section>

        ${t ? p : l`
              <p class="layout-hint">${this.t("card.tabs_hint")}</p>

              <div class="settings-tabs" data-editor-chrome>
                <div class="tab-bar" role="tablist">
                  ${r.map(
      (a, o) => l`
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
                </div>
              </div>
            `}
      </div>
    `;
  }
  _renderActionButtons(t = "top") {
    return l`
      <div
        class="actions-dock ${t === "top" ? "actions-dock-top" : ""}"
        data-actions=${t}
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
  _renderExportView() {
    return l`
      <div
        class="conx-layer"
        @click=${(t) => {
      t.target === t.currentTarget && this._backToEditor();
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
_.styles = ct`
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
    ha-entity-picker {
      display: block;
      width: 100%;
      --mdc-theme-primary: var(--conx-accent, #d4af61);
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
      grid-template-columns: repeat(auto-fit, minmax(5.5rem, 1fr));
      gap: 4px 8px;
      margin-bottom: 0;
      width: 100%;
    }
    .cover-times-compact .field {
      margin-bottom: 0;
      gap: 2px;
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
      max-width: 6.5rem;
    }
    .cover-times-compact .field-compact-select .select-wrap {
      max-width: 9rem;
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
      flex-wrap: wrap;
      align-items: center;
      gap: 3px 8px;
      min-width: 0;
    }
    .mixed-role-card .radio-groups-hint {
      margin: 0;
      font-size: 0.62rem;
      line-height: 1.15;
      flex: 1 1 8rem;
    }
    .mixed-pulse,
    .mixed-cover-id {
      width: max-content;
      max-width: 100%;
      margin-top: 0;
      margin-bottom: 0;
      gap: 3px;
    }
    .mixed-pulse span,
    .mixed-cover-id span {
      font-size: 0.62rem;
      color: var(--text-muted);
    }
    .mixed-pulse input[type="number"] {
      width: 3.8rem;
      min-height: 24px;
      padding: 2px 4px;
      font-size: 0.72rem;
    }
    .mixed-cover-id .select-wrap {
      min-width: 5.5rem;
      max-width: 9rem;
    }
    .mixed-cover-id select {
      min-height: 24px;
      padding: 2px 4px;
      font-size: 0.72rem;
    }
    .mixed-cover-slot {
      font-size: 0.62rem;
      font-weight: 650;
      color: var(--text-muted);
      line-height: 1.15;
    }
    .mixed-cover-times {
      flex: 1 1 100%;
      width: 100%;
      margin-top: 2px;
    }
    .mixed-cover-times .cover-times-compact {
      grid-template-columns: repeat(auto-fit, minmax(5.2rem, 1fr));
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

    .faceplate-menu-btn {
      position: absolute;
      top: 6px;
      z-index: 5;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      border: 1px solid rgba(0, 0, 0, 0.28);
      background: rgba(26, 29, 34, 0.78);
      color: #f0f2f5;
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.18) inset, 0 2px 6px rgba(0, 0, 0, 0.28);
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      cursor: pointer;
      padding: 0;
      backdrop-filter: blur(4px);
      /* Faceplate itself is dir=ltr for ring columns; pin to card reading-start. */
      left: 6px;
      right: auto;
    }
    ha-card.conx-card[dir="rtl"] .faceplate-menu-btn {
      left: auto;
      right: 6px;
    }
    .faceplate-menu-btn:hover {
      border-color: var(--accent);
      color: var(--accent);
    }
    .faceplate-menu-btn span {
      display: block;
      width: 12px;
      height: 1.5px;
      border-radius: 1px;
      background: currentColor;
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
      gap: 0;
      padding: 4px 8px 10px;
      border-bottom: 0;
      background: transparent;
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
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0;
      border-bottom: 1px solid var(--border);
      background: color-mix(in srgb, var(--surface) 70%, var(--surface-2));
      margin-bottom: 0;
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
m([
  Me({ attribute: !1, hasChanged: () => !0 })
], _.prototype, "hass", 2);
m([
  g()
], _.prototype, "_config", 2);
m([
  g()
], _.prototype, "_panel", 2);
m([
  g()
], _.prototype, "_draft", 2);
m([
  g()
], _.prototype, "_saved", 2);
m([
  g()
], _.prototype, "_error", 2);
m([
  g()
], _.prototype, "_notice", 2);
m([
  g()
], _.prototype, "_loading", 2);
m([
  g()
], _.prototype, "_busy", 2);
m([
  g()
], _.prototype, "_syncPulse", 2);
m([
  g()
], _.prototype, "_pressedRing", 2);
m([
  g()
], _.prototype, "_splitPreviewOn", 2);
m([
  g()
], _.prototype, "_runtimeRelayStates", 2);
m([
  g()
], _.prototype, "_radioPreviewSelected", 2);
m([
  g()
], _.prototype, "_uiLang", 2);
m([
  g()
], _.prototype, "_theme", 2);
m([
  g()
], _.prototype, "_operateMode", 2);
m([
  g()
], _.prototype, "_view", 2);
m([
  g()
], _.prototype, "_wizardStep", 2);
m([
  g()
], _.prototype, "_importMode", 2);
m([
  g()
], _.prototype, "_serviceYaml", 2);
m([
  g()
], _.prototype, "_sections", 2);
m([
  g()
], _.prototype, "_expandedButtons", 2);
m([
  g()
], _.prototype, "_activeTab", 2);
m([
  g()
], _.prototype, "_menuOpen", 2);
m([
  g()
], _.prototype, "_automationOpen", 2);
m([
  g()
], _.prototype, "_previewOpen", 2);
m([
  g()
], _.prototype, "_panelNameDraft", 2);
m([
  g()
], _.prototype, "_radioGroupsOpen", 2);
m([
  g()
], _.prototype, "_haEntityPickerReady", 2);
_ = m([
  ut("conx-dynamic-panel-card")
], _);
var Gr = Object.defineProperty, Yr = Object.getOwnPropertyDescriptor, Le = (t, e, r, i) => {
  for (var a = i > 1 ? void 0 : i ? Yr(e, r) : e, o = t.length - 1, n; o >= 0; o--)
    (n = t[o]) && (a = (i ? n(e, r, a) : n(a)) || a);
  return i && a && Gr(e, r, a), a;
};
let re = class extends D {
  setConfig(t) {
    this._config = t;
  }
  get _language() {
    var t, e, r, i;
    return ((t = this._config) == null ? void 0 : t.language) || ((r = (e = this.hass) == null ? void 0 : e.locale) == null ? void 0 : r.language) || ((i = this.hass) == null ? void 0 : i.language) || "en";
  }
  _valueChanged(t) {
    if (!this._config)
      return;
    const e = { ...this._config, ...t };
    this._config = e, this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: e },
        bubbles: !0,
        composed: !0
      })
    );
  }
  render() {
    if (!this._config)
      return l``;
    const t = xt(this._language);
    return l`
      <div class="editor" dir=${t ? "rtl" : "ltr"}>
        <label>
          ${S(this._language, "editor.entry_id")}
          <input
            .value=${this._config.entry_id || ""}
            @input=${(e) => this._valueChanged({
      entry_id: e.target.value.trim()
    })}
          />
        </label>
        <label>
          ${S(this._language, "card.language")}
          <select
            .value=${te(this._config.language || this._language)}
            @change=${(e) => this._valueChanged({
      language: e.target.value
    })}
          >
            ${Pe.map(
      (e) => l`<option value=${e.id}>${e.label}</option>`
    )}
          </select>
        </label>
        <label>
          ${S(this._language, "card.theme")}
          <select
            .value=${ue(this._config.theme)}
            @change=${(e) => this._valueChanged({
      theme: e.target.value
    })}
          >
            ${Te.map(
      (e) => l`<option value=${e.id}>
                ${S(this._language, `theme.${e.id}`)}
              </option>`
    )}
          </select>
        </label>
        <label class="check">
          <input
            type="checkbox"
            .checked=${!!this._config.compact}
            @change=${(e) => this._valueChanged({
      compact: e.target.checked
    })}
          />
          ${S(this._language, "card.compact")}
        </label>
      </div>
    `;
  }
};
re.styles = ct`
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
Le([
  Me({ attribute: !1 })
], re.prototype, "hass", 2);
Le([
  g()
], re.prototype, "_config", 2);
re = Le([
  ut("conx-dynamic-panel-card-editor")
], re);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "conx-dynamic-panel-card",
  name: "ConX Dynamic Panel Card",
  description: "Private ConX card for multi-profile smart panels",
  preview: !0
});
//# sourceMappingURL=conx-dynamic-panel-card.js.map
