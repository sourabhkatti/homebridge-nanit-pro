"use strict";
const DEFAULT_MACOS_CA_FILE = '/etc/ssl/cert.pem';
// CA bundle used to verify Nanit's RTMPS certificate. Other platforms leave it unset so the TLS library in ffmpeg
// falls back to the system trust store.
function resolveCaFile(configuredCaFile) {
    if (configuredCaFile) return configuredCaFile;
    return process.platform === 'darwin' ? DEFAULT_MACOS_CA_FILE : undefined;
}
// Input options for an ffmpeg process that reads an rtmps:// URL. ffmpeg does not verify the server certificate
// unless it is told to, so verification is always requested here unless allowInsecureTls is set.
function getTlsArgs(url, allowInsecureTls, caFile) {
    if (allowInsecureTls) return ['-tls_verify', '0'];
    const args = ['-tls_verify', '1'];
    if (caFile) args.push('-ca_file', caFile);
    try {
        args.push('-verifyhost', new URL(url).hostname);
    }
    catch (_) { }
    return args;
}
module.exports = { resolveCaFile, getTlsArgs };
