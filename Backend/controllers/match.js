let queue = require('../utils/rabbit_connection');
const cfg = require('../utils/configs');
const db = require('../utils/database');
var Redis = require('ioredis');
const redis = new Redis({
    host: 'localhost',
    port: 6379
});

/**
 * match event handler
 */
match = function () {
    this.rabbit_q = new queue(cfg.rabbit_url);
    this.rabbit_q.connect().then().catch(reason => {
        console.log("couldn't connect to rabbit queue:\n" + reason)
    });
};

/**
 * on connection established
 * @param socket
 * @returns {Promise<void>}
 */
match.prototype.onConnect = async function (socket) {
    console.log('connected');
    let player = socket.decoded_token.username;
    redis.set(player, cfg.USER_STATES.free);
    console.log('set ' + player + ' to status ' + cfg.USER_STATES.free);
    socket.emit('connection_confirm', {state: "stable"});
};

/**
 * main method for matching players in a match
 * @param io
 * @param socket
 * @param msg: sent parameters of client to server
 * @returns {Promise<void>}
 */
match.prototype.onMatchRequest = async function (io, socket, msg) {
    let _this = this;
    console.log('match request received: ' + msg);

    try {
        let player = socket.decoded_token.username;
        // choosing game mode
        let q = cfg.GAME_MODE[parseInt(msg.category) - 1];
        redis.get(player, function (err, result) {
            if (!err) {
                if (result === cfg.USER_STATES.free) {
                    _this.rabbit_q.ch()
                        .then(async ch => {
                                await ch.assertQueue(q);
                                await _this._queueHandler(io, socket, ch, player, q);
                            }
                        ).catch(reason => {
                        console.log("couldn't create rabbit channel:\n" + reason);
                    });
                    return;
                }
            }
            console.log("\nplayer " + player + " was not at state " + cfg.USER_STATES.free);
            socket.emit("bad request", {
                reason: 2,
                msg: "player is not free or offline"
            });
        });

    } catch (e) {
        
        socket.emit("bad request", {
            reason: 1,
            msg: "wrong event message format"
        })
    }
};

/**
 * matching through rabbitMQ
 * @param io
 * @param socket
 * @param ch
 * @param player
 * @param queue
 */
match.prototype._queueHandler = async function (io, socket, ch, player, queue) {
    let _this = this;
    ch.get(queue).then(msg => {
            if (!msg) {
                _this._addPlayerToQueue(player, queue).then(() => {
                        console.log("\ntrying to join to room-" + player);
                        io.adapter.remoteJoin(socket.id, 'room-' + player, (err) => {
                            console.log("join first player to room: " + err)
                        });
                        redis.set(player, cfg.USER_STATES.match_pending);
                        console.log("changed status of " + player + " to " + cfg.USER_STATES.match_pending);

                        socket.emit('match_request_answer', {state: "processing"});
                    }
                ).catch(err =>
                    socket.emit('match_request_answer', {state: "unhandled", error: err})
                );
                return
            }
            ch.ack(msg);
            redis.get(msg.content.toString(), async (err, result) => {
                if (!err) {
                    if (result === cfg.USER_STATES.match_pending) {
                        _this._matchOpponents(io, socket, msg.content.toString(), player)
                            .then()
                            .catch(reason => console.log("matching opponents failed:\n" + reason));
                        return;
                    }
                }
                console.log("\ncould not match player " + player + " to player " + msg.content.toString() + " cause the second one was not pending for match");
                await _this._queueHandler(io, socket, ch, player, queue);
            });
        }, {noAck: false}
    ).catch(reason => {
        console.log("\nqueue insert failed for player " + player + ":\n" + reason);
    })
};

/**
 * handles final state of matching two opponents
 * @param io
 * @param socket
 * @param first
 * @param second
 * @returns {Promise<void>}
 */
match.prototype._matchOpponents = async function (io, socket, first, second) {
    console.log("trying to join to room-" + first);
    io.adapter.remoteJoin(socket.id, 'room-' + first, (err) => {
        console.log("join second player to room: " + err)
    });

    redis.set(first, cfg.USER_STATES.in_match);
    redis.set(second, cfg.USER_STATES.in_match);
    console.log('set players ' + first + ', ' + second + ' to status ' + cfg.USER_STATES.in_match);

    db.get_random_question(cfg.MATCH_QUESTION_NUMBER).then(
        (questions) => {
            db.insert_room(first, second, questions);
            io.in('room-' + first).emit('match_opponent_ready', {
                players: [
                    {
                        username: first,
                        avatar: 1
                    },
                    {
                        username: second,
                        avatar: 1
                    }],
                question: {
                    image: questions[0].image.data,
                    url: questions[0].image.url,
                    desc: questions[0].desc + '__' + questions[0].answer
                }
            });
        }
    )
};


match.prototype.onCancelMatch = async function(io, socket, msg) {
    let _this = this;
    let player = socket.decoded_token.username;

    redis.get(player, async (err, result) => {
        if (!err) {
            if (result === cfg.USER_STATES.match_pending) {
                redis.set(player, cfg.USER_STATES.free);
                socket.emit("close_match", {result: 0});
                return;
            } else if (result === cfg.USER_STATES.in_match) {
                await _this._close_going_match(io, player);
                console.log("match closed based on request from player " + player);
                socket.emit("close_match", {result: 0});
                return;
            }
        }
        console.log("-err: match not able to be closed based on request from player " + player);
        socket.emit("close_match", {result: 1});
    });
};


/**
 * adds player to specified queue in rabbitMQ
 * @param player
 * @param queue
 * @returns {Promise<void>}
 */
match.prototype._addPlayerToQueue = async function (player, queue) {
    console.log('no match opponent in the queue');
    this.rabbit_q.produce(queue, player).then();
    console.log('added ' + player + ' to queue ' + queue)
};

/**
 * handles event if any of the players in the match submit a question
 * @param io
 * @param socket
 * @param ans
 * @returns {Promise<void>}
 */
match.prototype.answerReceived = async function (io, socket, ans) {
    let player = socket.decoded_token.username;
    let {validation: validation, roomDoc: roomDoc} = await this._validateAnswer(player, ans.answer);
    if (validation) {
        await this._resolveScore(roomDoc, player);
        io.in('room-' + roomDoc.first_player_info.username).emit('answer_validation', {
            validation: ans.validator,
            player: player
        });
    } else {
        let wrong_validator = Math.ceil(Math.random() * 100);
        while (ans.validator === wrong_validator)
            wrong_validator = Math.ceil(Math.random() * 100);
        io.in('room-' + roomDoc.first_player_info.username).emit('answer_validation', {
            validation: wrong_validator,
            player: player
        });
    }
    let result = await this._checkMatchEnd(roomDoc, player);
    if (result === 1) {
        await this._match_over(io, roomDoc)
    } else if (result === -1)
        socket.emit('question limit exceeded');
    else {
        let q = await db.get_question_from_room(player, roomDoc);
        socket.emit('next_question', {question: q});
    }
};

/**
 * resolves players scores after solving questions and sending the answers
 * @param roomDoc
 * @param player
 * @returns {Promise<void>}
 * @private
 */
match.prototype._resolveScore = async function (roomDoc, player) {
    if (player === roomDoc.first_player_info.username)
        roomDoc.first_player_info.score += this._calculateScore(roomDoc, roomDoc.first_player_info.last_admit);
    else
        roomDoc.second_player_info.score += this._calculateScore(roomDoc, roomDoc.second_player_info.last_admit);
    await roomDoc.save();
};

// TODO: resolve calculation formula
match.prototype._calculateScore = function (roomDoc, last_admit) {
    let diff = Date.now() - last_admit.getTime();
    return cfg.BASE_TIME_SCORE * Math.ceil(Math.pow(diff, cfg.BASE_SCORE_POWER)) + cfg.MATCH_TURN_BASE_SCORE;
};

/**
 * validate answer received from player
 * @param player_id
 * @param ans
 * @returns {Promise<{players: *, validation: boolean}>}
 */
match.prototype._validateAnswer = async function (player_id, ans) {
    let {answer: true_answer, roomDoc: roomDoc} = await db.get_answer_from_room(player_id);
    return {validation: (true_answer === ans), roomDoc: roomDoc}
};

/**
 *  checks end of the match on every question receiving from players
 * @param roomDoc
 * @param player
 * @returns {Promise<number>}
 */
match.prototype._checkMatchEnd = async function (roomDoc, player) {
    let now = Date.now();
    let diff = now - roomDoc.first_player_info.last_admit.getTime();
    if (diff > cfg.MAX_TIMEOUT) {
        roomDoc.result = roomDoc.second_player_info.username;
        await roomDoc.save();
        await db.add_reward_to_winner(roomDoc.second_player_info.username);
        await db.zero_win_strike(roomDoc.first_player_info.username);
        return 1
    }
    roomDoc.first_player_info.last_admit = now;
    diff = now - roomDoc.second_player_info.last_admit.getTime();
    if (diff > cfg.MAX_TIMEOUT) {
        roomDoc.result = roomDoc.first_player_info.username;
        await roomDoc.save();
        await db.add_reward_to_winner(roomDoc.first_player_info.username);
        await db.zero_win_strike(roomDoc.second_player_info.username);
        return 1
    }
    roomDoc.second_player_info.last_admit = now;
    await roomDoc.save();

    if (roomDoc.first_player_info.index >= cfg.MATCH_QUESTION_NUMBER && roomDoc.second_player_info.index >= cfg.MATCH_QUESTION_NUMBER) {
        if (roomDoc.first_player_info.score > roomDoc.second_player_info.score) {
            roomDoc.result = roomDoc.first_player_info.username;
            await db.add_reward_to_winner(roomDoc.first_player_info.username);
            await db.zero_win_strike(roomDoc.second_player_info.username);
        } else if (roomDoc.first_player_info.score < roomDoc.second_player_info.score) {
            roomDoc.result = roomDoc.second_player_info.username;
            await db.add_reward_to_winner(roomDoc.second_player_info.username);
            await db.zero_win_strike(roomDoc.first_player_info.username);
        } else {
            roomDoc.result = '__ EQUAL __'
        }
        await roomDoc.save();
        return 1;
    } else if (player === roomDoc.first_player_info.username && roomDoc.first_player_info.index >= cfg.MATCH_QUESTION_NUMBER)
        return -1;
    else if (player === roomDoc.second_player_info.username && roomDoc.second_player_info.index >= cfg.MATCH_QUESTION_NUMBER)
        return -1;
    else
        return null;
};

/**
 * onDisconnect
 * @param socket
 * @returns {Promise<void>}
 */
match.prototype.onDisconnect = async function (io, socket) {
    console.log('disconnected');

    let player = socket.decoded_token.username;
    redis.del(player);
    console.log("deleted player status " + player);
    // await this._close_going_match(io, socket.decoded_token.username)
};

/**
 *
 * @param io
 * @param socket
 * @returns {Promise<void>}
 */
match.prototype.onError = async function (io, socket) {
    let player = socket.decoded_token.username;
    redis.del(player);
    console.log("deleted player status " + player);
    // await this._close_going_match(io, socket.decoded_token.username)
};

/**
 *
 * @param io
 * @param player
 * @returns {Promise<void>}
 * @private
 */
match.prototype._close_going_match = async function (io, player) {
    let current_room = await db.is_match_going(player);
    if (!current_room)
        return;
    if (current_room.first_player_info.username === player) {
        current_room.result = current_room.second_player_info.username;
        await db.add_reward_to_winner(current_room.second_player_info.username);
        await db.zero_win_strike(roomDoc.first_player_info.username);
    }
    else {
        current_room.result = current_room.first_player_info.username;
        await db.add_reward_to_winner(current_room.first_player_info.username);
        await db.zero_win_strike(roomDoc.second_player_info.username);
    }
    await current_room.save();
    await this._match_over(io, current_room);
};

match.prototype._match_over = async function (io, roomDoc) {
    io.in('room-' + roomDoc.first_player_info.username).emit('match_over', {
        result: roomDoc.result,
        answers: roomDoc.answers
    });
    io.in('room-' + roomDoc.first_player_info.username).clients((err, clients) => {
            console.log(clients);
            clients.forEach((client) => {
                io.adapter.remoteLeave(client, 'room-' + roomDoc.first_player_info.username, (err) => {
                    console.log('client ' + client + ' has left room ' + roomDoc.first_player_info.username);
                });
            })
        }
    );

    redis.set(roomDoc.first_player_info.username, cfg.USER_STATES.free);
    redis.set(roomDoc.second_player_info.username, cfg.USER_STATES.free);
    console.log("set players " + roomDoc.first_player_info.username + ', ' + roomDoc.second_player_info.username +
        ' to status ' + cfg.USER_STATES.free + ' after match over');
};

module.exports = match;