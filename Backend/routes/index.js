var express = require('express');
var router = express.Router();
var database = require('../utils/database');
var {google} = require('googleapis');
var cfg = require('../utils/configs');
var axios = require('axios');
var jwt = require('jsonwebtoken');
var boom = require('@hapi/boom');
var multer = require('multer');
const { route } = require('../app');


var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + '.jpg')
    }
});
const upload = multer({
    storage: storage
});

function getGooglePlusApi(auth) {
    return google.plus({version: 'v1', auth});
}

async function googleStrategy(access_token) {
    try {
        let oauth = new google.auth.OAuth2(cfg.GOOGLE_CLIENT_ID, cfg.GOOGLE_CLIENT_SECRET);
        oauth.setCredentials({
            access_token: access_token
        });
        const plus = getGooglePlusApi(oauth);
        const me = await plus.people.get({userId: 'me'});
        return {id: me.data.id, name: me.data.displayName, type: 'google'};
    } catch (err) {
        throw err
    }
}

async function getOrCreatePlayer(prof) {
    return await database.create_or_find_player(prof);
}

router.post('/create_question', upload.single('photo'), function (req, res, next) {
    database.create_sample_questions(req);
    res.status(200).send('done');
});

router.post('/admin/create_question', upload.single('photo'), async function (req, res, next) {
    let isQuestionCreated = await database.create_question(req);
    if (isQuestionCreated)
        res.status(200).send('done');
    else
        res.status(400).send();
});

router.post('/admin/login', async function(req, res, next) {
   // database.
});

router.post('/auth/login', async function (req, res, next) {
    let login_type = req.body.login_type;
    let access_token;
    let prof;
    try {
        switch (login_type) {
            case 'google-oauth2':
                access_token = req.body.access_token;
                prof = await googleStrategy(access_token).catch((err) => {
                    res.status(401).send('a problem has happened during retrieving data from google, ' +
                        'it might be because of expired access token.')
                });
                break;
            case 'email':
                prof = {id: req.body.email, name: req.body.email,  type: 'email', password: req.body.password};
                break; 
            default:
            case 'guest':
                let count = await database.last_id();
                prof = {id: 'guest' + (count + 1), name: 'guest' + (count + 1), type: 'guest'};
                break;    
            
        }
        let payload = await getOrCreatePlayer(prof);
        if (payload === "err"){
            res.status(401).send("invalid username and password");
        }
        let token = await jwt.sign(payload, cfg.SECRET_KEY);
        res.status(200).send({username: payload.name, token: token});
    } catch (e) {

        res.status(500).send();
    }
});

router.get('/game/record', async function (req, res, next) {
    try {
        let profile = await database.get_player_record(req.user.username);
        res.status(200).send({
            coins: profile.coins,
            gems: profile.gem,
            avatar: profile.show.avatar,
            level: profile.level
        });
    } catch (err) {
        res.status(500).send();
    }
});

router.get('/game/profile', async function (req, res, next) {
    try {
        let profile = await database.get_player_record(req.user.username);
        res.status(200).send(profile);
    } catch (err) {
        res.status(500).send();
    }
});

router.get('/game/shop', async function (req, res, next) {
    try {
        let avatars = database.get_shop_avatars();
        res.send({avatars: avatars});
    } catch (err) {
        console.log(err.toString());
        res.status(500).send();
    }
});

router.post('/game/buy', async function (req, res, next) {
    try {
        let profile = await database.get_player_record(req.user.username);
        let avatar_id = req.body.avatar_id;
        let price = await database.get_avatar(avatar_id);
        if (price === -1)
            res.status(400).send({
                msg: "no avatar found with this id"
            });
        else {
            if (profile.coins < price) {
                res.status(203).send({
                    result: "failed"
                });
                return;
            }
            profile.coins -= price;
            await profile.save();
            res.status(200).send({
                result: "success"
            });
        }
    } catch (err) {
        res.status(500).send();
    }
});

router.get('/game/lucky_wheel', async function (req, res, next) {
    // try {
    let items = await database.getRandomWheelItems(req.user.username);
    res.status(200).send({
        items: items
    });
    // } catch (err) {
    //     res.status(500).send();
    // }
});

router.post('/game/lucky_wheel_result', async function (req, res, next) {
    let profile = await database.get_player_profile(req.user.username);
    let item = await database.getWheelItem(req.body.item_id);
    if (!item) {
        res.status(400).send();
    }
    switch (item.type) {
        case "coin":
            profile.coins += item.value;
            break;
        case "gem":
            profile.gem += item.value;
            break;
    }
    await profile.save();
    res.status(200).send();
});

router.get('/say_hello', function (req, res, next) {
    console.log('hello sir!!');
    res.status(200).send('hello');
});

router.get('/add_item', async function (req, res, next) {
    await database.addRandomWheelItem();
    res.status(200).send();
});

router.get('/check_auth', function (req, res, next) {
    if (req.isAuthenticated){
        res.status(200).send("is authenticated")
    } else {
        res.status(401).send("is not authenticated")
    }
})

module.exports = router;
