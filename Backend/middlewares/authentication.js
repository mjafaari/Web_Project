const jwt = require('jsonwebtoken');
const cfg = require('../utils/configs');

function authenticate(token, res) {
        jwt.verify(token, cfg.SECRET_KEY, (err, decode) => {
                if (!err) {
                    return decode;
                }
                res.status(401).send();
                return null;
            });
}