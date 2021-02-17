const configs = {
    BASE_URL: 'http://localhost:3000',
    SECRET_KEY: '1(+89v5d#vrkc)9@jdka5rb5shkd(wa69zu9szi0xkevjp#o(-',
    GOOGLE_CLIENT_ID: '126285149230-imj9mil9cnkml1u838k3gdbq2d2vhunf.apps.googleusercontent.com',
    GOOGLE_CLIENT_SECRET: 'K_qF9g-GiS979MYvIoZaUQlD',
    FACEBOOK_CLIENT_ID: '436989470473660',
    FACEBOOK_CLIENT_SECRET: '393f9b7aa6f2b77e8924b4e187aad57f',
    FACEBOOK_URL: 'https://graph.facebook.com/v3.3/me?access_token=',
    FACEBOOK_FIELDS: '&fields=id%2Cname',
    rabbit_url: 'amqp://localhost:5672',
    mongo_url: 'mongodb://localhost:27017/xptrivia',
    MATCH_QUESTION_NUMBER: 5,
    MATCH_TURN_TIME: 10000,
    MATCH_TURN_BASE_SCORE: 100,
    GAME_MODE: ['dices', 'marbles', "rabbits_way", 'birds'],
    BASE_COIN: 1000,
    BASE_GEM: 100,
    BASE_WINNING_REWARD: 300,
    BASE_WINNING_EXPERIENCE: 500,
    BASE_TIME_SCORE: 10,
    BASE_SCORE_POWER: 1.5,
    MAX_TIMEOUT: 15000,
    USER_STATES: {
        offline: "OFFLINE",
        match_pending: "MATCH_PENDING",
        in_match: "IN_MATCH",
        free: "FREE"
    }
};
module.exports = configs;