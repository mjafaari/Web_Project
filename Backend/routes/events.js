const socket = require('socket.io');
const cfg = require('../utils/configs');
const matching = require('../controllers/match');
const socket_jwt = require('socketio-jwt');
const redisAdapter = require('socket.io-redis');
let match = new matching();


module.exports = function (server) {
    const socket_io = socket(server);
    // socket_io.adapter(redisAdapter({
    //     host: 'localhost',
    //     port: 6379
    // }));
    const io = socket_io.of('/');

    io.use(socket_jwt.authorize({
        secret: cfg.SECRET_KEY,
        handshake: true
    }));

    io.on('connection', async function (socket) {
        await match.onConnect(socket);

        socket.on('error', async (err) => {
            await match.onError(io, socket);
            return {state: "unstable", error: err}
        });

        socket.on('match_request', async function (msg) {
            await match.onMatchRequest(io, socket, msg);
        });

        socket.on('cancel_match', async function (msg) {
            await match.onCancelMatch(io, socket, msg);
        });

        socket.on('question_solved', async function (answer) {
            await match.answerReceived(io, socket, answer);
        });

        socket.on('on_timeout', async function (msg) {
            await match.answerReceived(io, socket, msg);
        });

        socket.on('disconnect', async function () {
            await match.onDisconnect(io, socket);
        });
    });

    return socket_io;
};