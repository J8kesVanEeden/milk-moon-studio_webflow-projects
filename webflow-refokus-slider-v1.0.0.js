!function(global, factory) {
    "object" == typeof exports && "object" == typeof module
        ? module.exports = factory()
        : "function" == typeof define && define.amd
        ? define([], factory)
        : "object" == typeof exports
        ? exports.WebflowTools = factory()
        : global.WebflowTools = factory();
}(self, (function() {
    return function() {
        "use strict";
        var e = {
            578: function(e, t) {
                Object.defineProperty(t, "__esModule", {
                    value: !0
                });
                t.SLICK_CSS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.8.1/slick.min.css";
                t.SLICK_JS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.8.1/slick.min.js";
                t.MOBILE_VARIABLE_WIDTH_ATTR = "mobile-variable-width";
                // ... (other attributes)
                t.SLIDER_ATTR = "r-slider";
            },
            170: function(e, t) {
                Object.defineProperty(t, "__esModule", {
                    value: !0
                });
                t.createScript = function(e) {
                    var t = document.createElement("script");
                    t.type = "text/javascript";
                    t.setAttribute("src", e);
                    return t;
                };
                t.createLink = function(e) {
                    var t = document.createElement("link");
                    t.rel = "stylesheet";
                    t.setAttribute("href", e);
                    return t;
                };
            },
        };
        var t = {};
        
        function T(r) {
            var o = t[r];
            if(void 0 !== o) return o.exports;
            var i = t[r] = { exports: {} };
            return e[r](i, i.exports, T), i.exports;
        }
        
        var r = {};
        return function() {
            var e = r;
            Object.defineProperty(e, "__esModule", { value: !0 });
            var t = T(578),
                o = T(170);
            
            if (!window.slick) {
                var i = o.createLink(t.SLICK_CSS_CDN),
                    _ = o.createScript(t.SLICK_JS_CDN),
                    l = document.getElementsByTagName("head")[0];
                
                l.appendChild(i);
                l.appendChild(_);
                
                _.addEventListener("load", (function() {
                    document.querySelectorAll("[" + t.SLIDER_ATTR + "]").forEach((function(e) {
                        // ... (slider initialization)
                        window.$(e).slick(S);
                    }));
                }));
            }
        }(), r;
    }();
}));


