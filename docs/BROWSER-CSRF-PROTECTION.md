# Browser mutation request protection

Imperial Novel's Worker rejects state-changing API methods (POST, PUT, PATCH, and DELETE) unless the request carries trustworthy same-origin browser metadata.

The current guard rejects a request when any of these conditions is true:

- An Origin header is present and does not exactly match the request URL origin.
- Sec-Fetch-Site is cross-site.
- Origin is absent and Sec-Fetch-Site is not explicitly same-origin.

When a browser sends an exact same-origin Origin, the request can proceed unless Fetch Metadata explicitly says cross-site. When Origin is omitted, explicit Sec-Fetch-Site: same-origin is required.

This is a fail-closed browser-oriented policy. Non-browser clients that legitimately call mutation endpoints must send an exact Origin matching the API origin or an explicit Sec-Fetch-Site: same-origin header. Do not weaken the guard to accommodate an untrusted client.

The session cookie is also HttpOnly, Secure, and SameSite=Lax. Cookie attributes are defense in depth, not a substitute for server-side origin checks.

## Verification

- Foreign Origin rejected with HTTP 403.
- Sec-Fetch-Site: cross-site rejected with HTTP 403.
- Missing Origin and missing Fetch Metadata rejected with HTTP 403.
- Missing Origin with Sec-Fetch-Site: same-origin passes the CSRF gate and continues through normal authentication and route authorization.
- Runtime checks use the disposable local Worker and D1 database only.

This protection does not replace authentication, authorization, rate limits, input validation, or XSS prevention. Any future API route that mutates state must remain behind the central guard.
