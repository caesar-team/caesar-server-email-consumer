"use strict";
require('dotenv').config();
import { createTransport } from "nodemailer";
const url = require('url');
const {MAILER_TLS, MAILER_HOST, MAILER_PORT, MAILER_USER, MAILER_PASSWORD} = process.env;

const transporter = createTransport({
  host: MAILER_HOST,
  port: MAILER_PORT,
  secureConnection: MAILER_TLS,
  secure: MAILER_PORT === 465, // true for 465, false for other ports
  auth: {
    user: MAILER_USER,
    pass: MAILER_PASSWORD
  }
});

// async..await is not allowed in global scope, must use a wrapper
async function main(options){
  return await transporter.sendMail(options);
}
export default {
    send: ({from, to, cc, bcc, subject, text, html, attachments, sender}) => {
        return main({from, to, cc, bcc, subject, text, html, attachments, sender});
    }
}