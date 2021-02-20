const configs = {
    BASE_URL: 'http://localhost:3000',
    SECRET_KEY: '1(+89v5d#vrkc)9@jdka5rb5shkd(wa69zu9szi0xkevjp#o(-',
    GOOGLE_CLIENT_ID: '126285149230-imj9mil9cnkml1u838k3gdbq2d2vhunf.apps.googleusercontent.com',
    GOOGLE_CLIENT_SECRET: 'K_qF9g-GiS979MYvIoZaUQlD',
    rabbit_url: 'amqp://localhost:5672',
    mongo_url: 'mongodb://localhost:27017/xptrivia',
    MATCH_QUESTION_NUMBER: 5,
    MATCH_TURN_TIME: 19000,
    MATCH_TURN_BASE_SCORE: 100,
    GAME_MODE: ['dices', 'marbles', "rabbits_way", 'birds'],
    BASE_COIN: 1000,
    BASE_GEM: 100,
    BASE_WINNING_REWARD: 300,
    BASE_WINNING_EXPERIENCE: 500,
    BASE_TIME_SCORE: 10,
    BASE_SCORE_POWER: 1.5,
    MAX_TIMEOUT: 27000,
    USER_STATES: {
        offline: "OFFLINE",
        match_pending: "MATCH_PENDING",
        in_match: "IN_MATCH",
        free: "FREE"
    }
};
module.exports = configs;
