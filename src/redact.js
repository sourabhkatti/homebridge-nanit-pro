"use strict";
const PLACEHOLDER = '[redacted]';
const PATTERNS = [
    // Cloud stream URL: rtmps://media-secured.nanit.com/nanit/<baby_uid>.<access_token>
    [/(\/nanit\/[^.\s'"\/]+\.)[\w.~%+=-]+/gi, `$1${PLACEHOLDER}`],
    // access_token=..., refresh_token=..., token=... in a query string or any other key=value pair
    [/(\b[\w-]*token=)[^&\s'"]+/gi, `$1${PLACEHOLDER}`],
    // Authorization: Bearer <token>
    [/(\bBearer\s+)[\w.~+\/=-]+/gi, `$1${PLACEHOLDER}`],
];
// Strip credentials from text before it is logged: any URL the plugin prints and anything ffmpeg writes to
// stderr (ffmpeg echoes its input URL). `secrets` are literal values to remove as well, such as the RTMP stream key.
function redact(text, secrets = []) {
    let result = String(text);
    for (const [pattern, replacement] of PATTERNS) {
        result = result.replace(pattern, replacement);
    }
    for (const secret of secrets) {
        if (secret) result = result.split(secret).join(PLACEHOLDER);
    }
    return result;
}
module.exports = { redact };
