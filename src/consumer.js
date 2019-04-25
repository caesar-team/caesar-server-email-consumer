require('dotenv').config();
import { connect } from 'amqplib';

const mailer = require('./mailer').default;

const {RABBITMQ_DEFAULT_PASS, RABBITMQ_DEFAULT_USER, RABBITMQ_PORT, RABBITMQ_CHANNEL, RABBITMQ_HOST, RABBITMQ_VHOST} = process.env;
const RABBITMQ_URI = `amqp://${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS}@${RABBITMQ_HOST}/${RABBITMQ_VHOST}`;

const printError = (e) => console.error('ERROR: %s', e.message);
const printSuccess = (info) => console.error('Message #%s send frpm %s to %s', info.messageId, info.envelope.to, info.envelope.from);
const doWork = (msg, ch) => {
    if(msg == null) return;
    let body;
    try {
        body = JSON.parse(msg.content.toString());
    } catch (e) {
        printError(e);
    }
    if(!body) return;
    console.log(" [x] Received email for '%s'", JSON.stringify(body['recipients']));
    try {
        mailer.send({
            to: body['recipients'],
            from: body['senderAddress'],
            sender: body['senderName'],
            subject: body['subject'],
            html: body['body']
        }).then((info) => success(info)).catch(printError);
    } catch (e) {
        printError(e);
    }

    const success = (info) => {
        printSuccess(info);
        ch.ack(msg);
    };
}
connect(RABBITMQ_URI).then( async (conn) => {
  process.once('SIGINT', function() { conn.close(); });
  const ch = await conn.createChannel();
    var ok = ch.assertQueue(RABBITMQ_CHANNEL, { durable: true });
    ok = ok.then( () => ch.prefetch(1));
    ok = ok.then( () => {
        ch.consume(RABBITMQ_CHANNEL, (msg) => doWork(msg, ch));
        console.log(" [*] Waiting for messages. To exit press CTRL+C");
    });
    return ok;
}).catch(console.warn);