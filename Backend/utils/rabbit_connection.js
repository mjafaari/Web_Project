const ampq = require('amqplib');

queue =  function(url) {
    this.url = url;
};

/**
 *
 * @returns {Promise<void>}
 */
queue.prototype.connect = async function() {
    ampq.connect(this.url)
        .then(con => {
            this.conn = con;
            console.log('successfully connected to rabbit message broker');
            con.on('close', function () {
                console.log('rabbit connection closed')
            })
        })
        .catch(con => setTimeout(this.connect, 1000));
};

/**
 *
 * @returns {Promise<void>}
 */
queue.prototype.createChannel = async function() {
    if (!this.conn)
        await this.connect();
    this.channel = await this.conn.createChannel();
};

/**
 *
 * @param q_name
 * @param msg
 * @returns {Promise<void>}
 */
queue.prototype.produce = async function(q_name, msg) {
    if (!this.channel)
        await this.createChannel();
    this.channel.assertQueue(q_name).then(ok => this.channel.sendToQueue(q_name, Buffer.from(msg)));
};

/**
 *
 * @returns {Promise<*|null>}
 */
queue.prototype.ch = async function() {
    if (!this.channel)
        await this.createChannel();
    return this.channel
};

/**
 *
 * @param q_name
 * @param noAck
 * @returns {Promise<Promise|*|PromiseLike<*>|Promise<*>>}
 */
queue.prototype.consume = async function(q_name, noAck = false) {
    if (!this.channel)
        await this.createChannel();
    let ch = this.ch();
    return ch.assertQueue(q_name).then(ok => {
        return ch.get(q_name,
            {noAck: noAck}
        )
    });
};

/**
 *
 * @returns {Promise<void>}
 */
queue.prototype.close = async function() {
    if (this.conn)
        this.channel.close()
            .then(() => this.channel = null)
};

module.exports = queue;
