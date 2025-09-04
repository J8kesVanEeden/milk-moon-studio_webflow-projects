Here’s the combined, end‑to‑end record of what you configured (and what should be in place) to allow Webflow SSL renewals while keeping Cloudflare proxy enabled.
 • DNS setup (Cloudflare, proxied):
 ▫ A records at apex pointing to Webflow IPs shown in Site settings (e.g., 75.2.70.75 and 99.83.190.102).
 ▫ CNAME for www → proxy-ssl.webflow.com.
 ▫ Proxy status for Webflow hostnames set to Proxied (orange cloud).
 ▫ Do not add _acme-challenge TXT records (not used for this flow).
 • Cloudflare SSL/TLS baseline:
 ▫ SSL/TLS mode: Full (Strict) for normal operation.
 ▫ Consider temporarily switching to Full if renewal ever struggles (optional fallback during the renewal window).
 ▫ HSTS: Off until you confirm renewals are working reliably (HSTS can force HTTPS before rules apply).
 • Redirect Rules (Rules > Redirect Rules):
 ▫ “Always Use HTTPS” custom rule with ACME exemption:
 ⁃ Expression: (http.host contains “milkmoonstudio.com” and not ssl and not starts_with(http.request.uri.path, “/.well-known/acme-challenge/”))
 ⁃ Redirect to https with 301 otherwise.
 ▫ Apex to www redirect with ACME exemption:
 ⁃ Expression: (http.host eq “milkmoonstudio.com” and not starts_with(http.request.uri.path, “/.well-known/acme-challenge/”))
 ⁃ Redirect to https://www.milkmoonstudio.com$PATH.
 ▫ Keep both rules ordered above broader redirects, as you have.
 • Page Rules (legacy) for ACME path (top priority):
 ▫ milkmoonstudio.com/.well-known/acme-challenge/*
 ▫ .milkmoonstudio.com/.well-known/acme-challenge/
 ▫ www.milkmoonstudio.com/.well-known/acme-challenge/*
 ▫ Settings on each: SSL: Off, Cache Level: Bypass, Disable Security (Browser Integrity Check Off, WAF Off), Automatic HTTPS Rewrites: Off, Opportunistic Encryption: Off, Cache Deception Armor: Off, Disable Zaraz/Apps/Performance where available.
 ▫ These ensure no HTTPS forcing, no caching, no security challenges on the ACME path across apex and subdomains.
 • Cache Rules (Rules > Cache Rules):
 ▫ Bypass cache for URI Path wildcard /.well-known/acme-challenge/*.
 ▫ Scope to path only (host-agnostic) so it applies for apex and all subdomains.
 • Configuration Rules (Rules > Configuration):
 ▫ Global rule that applies to everything except the ACME path:
 ⁃ Expression: not starts_with(http.request.uri.path, “/.well-known/acme-challenge/”)
 ▫ Ensure any features you enable here won’t re-apply to ACME. If needed, create a dedicated positive‑match rule for the ACME path to explicitly set SSL: Off (optional duplicate of Page Rules in the modern rules engine).
 • Security/WAF & Bots:
 ▫ ACME path exempted via Page Rules’ “Disable Security.” If you use WAF custom rules or Bot Fight Mode elsewhere, confirm they don’t match the ACME path.
 ▫ No JS challenges, captchas, rate limits, or IP blocking on /.well-known/acme-challenge/*.
 • Zone-level “Always Use HTTPS” and rewrites:
 ▫ Turn OFF the zone-level Always Use HTTPS (Edge Certificates).
 ▫ You’re enforcing HTTPS via Redirect Rules with an ACME exemption (the preferred pattern here).
 ▫ Automatic HTTPS Rewrites disabled on the ACME path (via Page Rules).
 • Webflow settings:
 ▫ In Site settings > Publishing, both apex and www added; www typically set as default (recommended for stability).
 ▫ SSL enabled in Webflow.
 ▫ Publish the site after DNS changes.
 • Rule ordering hygiene:
 ▫ ACME Page Rules at the top.
 ▫ Redirect Rules evaluated before broader catch-alls; your “Always Use HTTPS” + “apex→www” rules already exclude ACME.
 ▫ Cache & Configuration rules placed so exemptions apply before generic performance/security rules.
 • Verification tests (done):
 ▫ curl -I http://milkmoonstudio.com/.well-known/acme-challenge/test → 200/404, no redirect.
 ▫ curl -I http://www.milkmoonstudio.com/.well-known/acme-challenge/test → 200/404, no redirect.
 ▫ No CF challenge headers; cache MISS/DYNAMIC is fine.
 • Monitoring & fallback:
 ▫ Track certificate “Not After” date; Webflow/LE reportedly renew 4–10 days before expiry.
 ▫ If renewal hasn’t occurred ~7 days prior, temporarily switch SSL mode to Full and/or briefly toggle proxy off as a backstop, then re-enable after renewal.
 ▫ Consider a simple monitor (e.g., cron + API) to alert on cert expiry window and verify renewal success.
 • Optional hardening (nice-to-haves):
 ▫ Create a modern Configuration Rule with a positive match starts_with “/.well-known/acme-challenge/” setting SSL: Off (mirrors Page Rules in Rulesets).
 ▫ Add explicit Security rules to Bypass for the ACME path (WAF phase) in case future security tuning is added elsewhere.
 ▫ Keep HSTS off until you’ve seen at least one successful renewal with this setup; then re-enable if you require it.

That’s the complete, unified playbook you’ve implemented. With these in place, the HTTP‑01 challenge should reach Webflow cleanly and certificates should renew without proxy toggling. Keep the monitoring in place to confirm the first renewal under this configuration.
