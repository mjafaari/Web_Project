var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var jwt = require('express-jwt');
const cfg = require('./utils/configs');
let db = require('./utils/database');
db = new db();

var indexRouter = require('./routes/index');

var app = express();
/**
 * to serve static files from server
 */
app.use('/uploads', express.static(__dirname + '/uploads'));

/**
 * json web token authentication middleware for rest api
 * @unless is used for specifying paths which do not need authentication
 */
app.use(
    jwt({secret: cfg.SECRET_KEY}).unless(
        {
            path: ['/auth/login/', '/create_question', '/say_hello', '/add_item', '/admin/create_question/']
        })
);


var cors = require('cors');
app.use(cors());

/**
 * jwt auth middleware error handler:
 *     can be customized to give preferred messages
 */
app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        res.status(401).send('invalid token...');
    }
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

module.exports = app;
