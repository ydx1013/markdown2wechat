import {i as u, k as d, n as m, e as v, p as f, O as l, q as h, s as w, d as I, u as S} from "./log.d0ac6dbb.js";
var k = function(e) {
    return e && typeof e.length == "number" && typeof e != "function"
};
function A(e) {
    return u(e?.then)
}
function g(e) {
    return u(e[d])
}
function x(e) {
    return Symbol.asyncIterator && u(e?.[Symbol.asyncIterator])
}
function L(e) {
    return new TypeError("You provided " + (e !== null && typeof e == "object" ? "an invalid object" : "'" + e + "'") + " where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.")
}
function p() {
    return typeof Symbol != "function" || !Symbol.iterator ? "@@iterator" : Symbol.iterator
}
var O = p();
function R(e) {
    return u(e?.[O])
}
function T(e) {
    return m(this, arguments, function() {
        var r, a, o, c;
        return v(this, function(t) {
            switch (t.label) {
            case 0:
                r = e.getReader(),
                t.label = 1;
            case 1:
                t.trys.push([1, , 9, 10]),
                t.label = 2;
            case 2:
                return [4, f(r.read())];
            case 3:
                return a = t.sent(),
                o = a.value,
                c = a.done,
                c ? [4, f(void 0)] : [3, 5];
            case 4:
                return [2, t.sent()];
            case 5:
                return [4, f(o)];
            case 6:
                return [4, t.sent()];
            case 7:
                return t.sent(),
                [3, 2];
            case 8:
                return [3, 10];
            case 9:
                return r.releaseLock(),
                [7];
            case 10:
                return [2]
            }
        })
    })
}
function b(e) {
    return u(e?.getReader)
}
function V(e) {
    if (e instanceof l)
        return e;
    if (e != null) {
        if (g(e))
            return E(e);
        if (k(e))
            return P(e);
        if (A(e))
            return G(e);
        if (x(e))
            return y(e);
        if (R(e))
            return F(e);
        if (b(e))
            return Y(e)
    }
    throw L(e)
}
function E(e) {
    return new l(function(n) {
        var r = e[d]();
        if (u(r.subscribe))
            return r.subscribe(n);
        throw new TypeError("Provided object does not correctly implement Symbol.observable")
    }
    )
}
function P(e) {
    return new l(function(n) {
        for (var r = 0; r < e.length && !n.closed; r++)
            n.next(e[r]);
        n.complete()
    }
    )
}
function G(e) {
    return new l(function(n) {
        e.then(function(r) {
            n.closed || (n.next(r),
            n.complete())
        }, function(r) {
            return n.error(r)
        }).then(null, h)
    }
    )
}
function F(e) {
    return new l(function(n) {
        var r, a;
        try {
            for (var o = w(e), c = o.next(); !c.done; c = o.next()) {
                var t = c.value;
                if (n.next(t),
                n.closed)
                    return
            }
        } catch (i) {
            r = {
                error: i
            }
        } finally {
            try {
                c && !c.done && (a = o.return) && a.call(o)
            } finally {
                if (r)
                    throw r.error
            }
        }
        n.complete()
    }
    )
}
function y(e) {
    return new l(function(n) {
        q(e, n).catch(function(r) {
            return n.error(r)
        })
    }
    )
}
function Y(e) {
    return y(T(e))
}
function q(e, n) {
    var r, a, o, c;
    return I(this, void 0, void 0, function() {
        var t, i;
        return v(this, function(s) {
            switch (s.label) {
            case 0:
                s.trys.push([0, 5, 6, 11]),
                r = S(e),
                s.label = 1;
            case 1:
                return [4, r.next()];
            case 2:
                if (a = s.sent(),
                !!a.done)
                    return [3, 4];
                if (t = a.value,
                n.next(t),
                n.closed)
                    return [2];
                s.label = 3;
            case 3:
                return [3, 1];
            case 4:
                return [3, 11];
            case 5:
                return i = s.sent(),
                o = {
                    error: i
                },
                [3, 11];
            case 6:
                return s.trys.push([6, , 9, 10]),
                a && !a.done && (c = r.return) ? [4, c.call(r)] : [3, 8];
            case 7:
                s.sent(),
                s.label = 8;
            case 8:
                return [3, 10];
            case 9:
                if (o)
                    throw o.error;
                return [7];
            case 10:
                return [7];
            case 11:
                return n.complete(),
                [2]
            }
        })
    })
}
export {k as a, V as i};
