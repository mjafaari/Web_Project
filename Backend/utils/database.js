const mongoose = require('mongoose');
const cfg = require('./configs');
const question = require('../models/question');
const profile = require('../models/profile');
const room = require('../models/room');
const avatar = require('../models/avatar');
const fs = require('fs');
const to = require('./await_catcher');
const Wheel = require('../models/WheelItem');

/**
 * util for database connections and queries
 */
class database {
    constructor() {
        this._connect();
    }

    /**
     *
     * @private
     */
    async _connect() {
        try {
            await mongoose.connect(cfg.mongo_url, {useNewUrlParser: true, useCreateIndex: true});
            console.log('successfully established connection to ' + cfg.mongo_url);
        } catch (err) {
            console.log(err)
        }
    }

    static async login_admin(username, password) {

    }

    static async last_id() {
        try {
            let prof = await profile.findOne().sort({_id: -1}).limit(1);
            if (!prof)
                return 1;
            return prof.count;
        } catch (err) {
            console.log(err);
            return 1;
        }
    }

    static async get_player_record(player) {
        try {
            return await profile.findOne({
                'show.username': player
            }).lean()
        } catch (err) {
            console.log(err + ", couldn't find player's record");
            return null
        }
    }

    static async get_player_profile(player) {
        try {
            return await profile.findOne({
                'show.username': player
            })
        } catch (err) {
            console.log(err + ", couldn't find player's profile");
            return null
        }
    }

    static async create_or_find_player(prof) {
        try {
            let profile_result;
            if (prof.type !== 'guest')
                profile_result = await profile.findOne({
                    'show.username': prof.id
                });
            if (!profile_result) {
                let count = await this.last_id();
                profile_result = await new profile({
                    show: {
                        username: prof.id,
                        name: prof.name,
                        avatar: 1,
                    },
                    count: count + 1
                });
                await profile_result.save();
            }
            return {
                username: profile_result.show.username,
                name: profile_result.show.name,
                avatar: profile_result.show.avatar
            };
        } catch (err) {
            console.log(err);
            return null;
        }
    }

    /**
     * inserts question_id to players room
     * @param player_1
     * @param player_2
     * @param questions
     */
    static async insert_room(player_1, player_2, questions) {
        try {
            let qs = [], ans = [];
            questions.forEach((q, i) => {
                qs[i] = q._id;
                ans[i] = q.answer;
            });
            let now = Date.now();
            await new room({
                room_id: player_1 + '___' + player_2,
                first_player_info: {
                    username: player_1,
                    last_admit: now
                },
                second_player_info: {
                    username: player_2,
                    last_admit: now
                },
                questions: qs,
                answers: ans
            }).save();
            await this.increment_player_game_count(player_1);
            await this.increment_player_game_count(player_2);
        } catch (err) {
            err.print();
            return null;
        }
    }

    /**
     * Increment game number (number of games player played) at the beginning of the game
     * @param username
     * @returns {Promise<void>}
     */
    static async increment_player_game_count(username) {
        let player = await profile.findOne({
            'show.username': username
        });
        if (!player)
            return;
        player.game_number += 1;
        await player.save();
    }

    /**
     * for test purposes
     * @param req
     */
    static async create_sample_questions(req) {
        try {
            for (let i = 0; i < 100; i++) {
                let q = await new question({
                    answer: 6,
                    desc: Math.random().toString(36).substr(2, 10)
                });
                q.image.data = fs.readFileSync(req.file.path);
                q.image.url = req.file.path;
                q.image.contentType = 'img/png';
                q.save();
            }
        } catch (e) {

        }
    }

    static async create_question(req) {
        try{
            let q = await new question({
                answer: req.body.answer,
                desc: req.body.desc
            });
            q.image.data = fs.readFileSync(req.file.path);
            q.image.url = req.file.path;
            q.image.contentType = 'img/png';
            q.save();
            return true;
        } catch (e) {
            console.log('problem in creating new question');
            return false;
        }
    }

    /**
     * gets [limit] random questions from database, for the match
     * @param limit
     * @returns {Promise<any>}
     */
    static get_random_question(limit = 5) {
        return new Promise((resolve, reject) => {
            question.countDocuments().exec(async (err, count) => {
                let results = [];
                for (let i = 0; i < limit; i++) {
                    let randomOffset = Math.floor(Math.random() * count);
                    results[i] = await question.findOne().skip(randomOffset).exec()
                }
                resolve(results)
            });
        })
    }

    /**
     * gets the true answer of the question the player has answered from room
     * @param player_id
     * @returns {Promise<any>}
     */
    static get_answer_from_room(player_id) {
        return new Promise(async (resolve, reject) => {
            let roomDoc = await this.get_room(player_id);
            if (!roomDoc)
                reject("no room document in database");
            let answer = await this._get_answer_and_update(player_id, roomDoc);
            if (!answer)
                reject("wrong player_id; this player does not exist in the room");
            resolve({
                answer: answer,
                roomDoc: roomDoc
            });
        })
    }

    static async get_room(player_id) {
        try {
            return await room.findOne({
                $or: [{
                    "first_player_info.username": player_id
                }, {
                    "second_player_info.username": player_id
                }]
            }).sort({_id: -1}).limit(1);
        } catch (e) {

            return null;
        }
    }

    static async _get_answer_and_update(player_id, roomDoc) {
        try {
            let id;
            if (player_id === roomDoc.first_player_info.username) {
                id = roomDoc.questions[roomDoc.first_player_info.index];
                if (roomDoc.first_player_info.index < cfg.MATCH_QUESTION_NUMBER) {
                    roomDoc.first_player_info.index += 1;
                    await roomDoc.save();
                }
            } else if (player_id === roomDoc.second_player_info.username) {
                id = roomDoc.questions[roomDoc.second_player_info.index];
                if (roomDoc.second_player_info.index < cfg.MATCH_QUESTION_NUMBER) {
                    roomDoc.second_player_info.index += 1;
                    await roomDoc.save();
                }
            } else
                return null;

            if (!id)
                return '__ END __';
            let q = await question.findOne({
                _id: id
            });
            return q.answer;
        } catch (e) {

            return null;
        }
    }

    /**
     *
     * @param player_id
     * @param roomDoc
     * @returns {Promise<{image: (*|image|{data, contentType}|string|SVGImageElement), desc: string | * | desc | {unique, index, type} | SVGDescElement}>}
     */
    static
    async get_question_from_room(player_id, roomDoc) {
        try {
            let idx;
            if (player_id === roomDoc.first_player_info.username) {
                idx = roomDoc.first_player_info.index;

            } else {
                idx = roomDoc.second_player_info.index;
            }
            let id = roomDoc.questions[idx];
            let q = await question.findOne({
                _id: id
            });
            return {image: q.image.data, url: q.image.url, desc: q.desc + '__' + q.answer};
        } catch (e) {
            console.log("problem in getting next question from room");

            return null;
        }
    }

    static async add_reward_to_winner(username) {
        try {
            let user_profile = await profile.findOne({
                'show.username': username
            }).sort({_id: -1}).limit(1);
            if (!user_profile)
                return null;
            user_profile.coins += cfg.BASE_WINNING_REWARD;
            user_profile.experience += cfg.BASE_WINNING_EXPERIENCE;
            user_profile.won_number += 1;
            user_profile.win_strike += 1;
            await user_profile.save();
        } catch (e) {
            console.log("could not add reward to winner");

        }
    }

    static async zero_win_strike(username) {
        let user_profile = await profile.findOne({
            'show.username': username
        });
        if (!user_profile)
            return null;
        user_profile.win_strike = 0;
        await user_profile.save();
    }

    static
    async is_match_going(player1) {
        try {
            let current_room = await room.findOne({
                $and: [
                    {
                        $or: [
                            {
                                "first_player_info.username": player1
                            },
                            {
                                "second_player_info.username": player1
                            }
                        ]
                    },
                    {
                        result: ''
                    }
                ]
            }).sort({_id: -1}).limit(1);
            if (!current_room)
                return null;
            return current_room;
        } catch (e) {

            return null;
        }
    }

    static async get_shop_avatars() {
        return await avatar.find().lean();
    }

    static
    async get_avatar(id) {
        try {
            let ava = await avatar.findOne({
                avatar_id: id
            });
            if (!ava)
                return -1;
            return ava.price;
        } catch (e) {

            return -1;
        }
    }

    static
    async getRandomWheelItems(user) {
        try {
            let items = await Wheel.find({
                owner: user
            }).limit(16);
            if (!items || items.length < 16) {
                items = await this.get_random_items()
            }
            return items;
        } catch (e) {

            return null;
        }
    }

    static get_random_items(limit = 16) {
        return new Promise((resolve, reject) => {
            Wheel.countDocuments().exec(async (err, count) => {
                let results = [];
                for (let i = 0; i < limit; i++) {
                    let randomOffset = Math.floor(Math.random() * count);
                    results[i] = await Wheel.findOne().skip(randomOffset).exec()
                }
                resolve(results)
            });
        })
    }


    static async addRandomWheelItem() {
        for (let i = 0; i < 20; i ++) {
            let item = await new Wheel({
                type: "coin",
                value: Math.random() * 1000,
                owner: "_"
            });
            item.save();
        }
        for (let i = 0; i < 20; i++) {
            let item = await new Wheel({
                type: "gem",
                value: Math.random() * 100,
                owner: "_"
            });
            item.save();
        }
    }

    static async getWheelItem(id) {
        try {
            return await Wheel.findOne({
                _id: id
            });
        } catch (e) {
            return null;
        }
    }
}

module
    .exports = database;