const mongo = require('mongodb');

mongo_client = function(url, options = {}) {
    this.url = url;
    this.options = options;
    this.client = mongo.MongoClient;
};

mongo_client.prototype.connect = async function () {
    let _this = this;
    return new Promise((resolve, reject) => {
        if (_this.db)
            resolve();
        else {
            _this.client.connect(_this.url)
                .then((db) => {
                    _this.db = db;
                    resolve()
                }, (err) => {
                    console.log("problem in connecting to database");
                    reject(err.message)
                });
        }
    })
};

mongo_client.prototype.close = async function () {
    if (this.db) {
        this.db.close().then(() => {}, (err) => {
            console.log("problem in closing the connection to database");
        })
    }
};