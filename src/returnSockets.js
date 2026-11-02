"use strict";
const dgram = require("dgram");
// HomeKit sends RTCP to the return ports an accessory advertises in its SetupEndpoints response, and ends the
// stream after about 30 seconds when nothing is listening there. These helpers hold one UDP socket each for video
// and audio on an ephemeral port that accepts and ignores whatever arrives.
// A prepared session that never receives its start request releases the sockets after this long.
const PREPARE_TIMEOUT_MS = 120000;
function openSocket(ipv6, log, name) {
    return new Promise((resolve, reject) => {
        const socket = dgram.createSocket(ipv6 ? 'udp6' : 'udp4');
        socket.once('error', reject);
        socket.on('message', () => { });
        socket.bind(0, () => {
            socket.removeListener('error', reject);
            socket.on('error', (error) => log.debug(`[${name}] RTCP return socket error: ${error.message}`));
            resolve(socket);
        });
    });
}
async function openReturnSockets(ipv6, log, name) {
    const results = await Promise.allSettled([openSocket(ipv6, log, name), openSocket(ipv6, log, name)]);
    const failure = results.find(result => result.status === 'rejected');
    if (failure) {
        for (const result of results) {
            if (result.status === 'fulfilled') result.value.close();
        }
        throw failure.reason;
    }
    return { video: results[0].value, audio: results[1].value, timer: undefined };
}
function closeReturnSockets(session) {
    const sockets = session && session.returnSockets;
    if (!sockets) return;
    if (sockets.timer) clearTimeout(sockets.timer);
    for (const socket of [sockets.video, sockets.audio]) {
        try { socket.close(); } catch (_) {}
    }
    session.returnSockets = undefined;
}
// Release the sockets of a prepared session whose ffmpeg process was never started.
function expireReturnSockets(session) {
    const sockets = session.returnSockets;
    sockets.timer = setTimeout(() => {
        if (!session.process) closeReturnSockets(session);
    }, PREPARE_TIMEOUT_MS);
    sockets.timer.unref();
}
module.exports = { openReturnSockets, closeReturnSockets, expireReturnSockets };
