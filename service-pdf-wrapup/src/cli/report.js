const path = require('path');
const ObjectsToCsv = require('objects-to-csv');
const moment = require('moment');
const Redis = require('ioredis');
const nconf = require('nconf');
const nodemailer = require('nodemailer');

const cnf = nconf.argv().env().file({ file: path.resolve(__dirname + '/../../../config.json') });
const redis = new Redis();

const csvOutputDir = `${cnf.get('csvOutputDir') || '/tmp'}/pdf-reader-report-${moment().format(
    'MM-YYYY'
)}.csv`;

const email = process.env.EMAIL || false;

async function sendMail(transporter, options) {
    return new Promise(async (resolve, reject) => {
        // send mail with defined transport object
        transporter.sendMail(options, (error, info) => {
            if (error) return reject(error.message);

            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

            return resolve(info);
        });
    });
}

async function emailReport(count) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: cnf.get('email:auth')
        });

        const mailOptions = {
            from: cnf.get('email:from'), // sender address
            to: cnf.get('report:to'), // list of receivers
            subject: `${cnf.get('report:subjectPrefix')} - ${moment().format('MM-YYYY')} - verwerkt: ${count}`, // Subject line
            text: `Beste ontvanger(s), 
            
            Hierbij ontvangt u een maandelijks rapport (CSV) van de certificaten manager.

            Aantal (PDF) bestanden uitgelezen: ${count}

            Met vriendelijke groet,

            Taffgear 
            `, // plain text body
            html: `<p>Beste ontvanger(s),</p><br />
            <p>Hierbij ontvangt u een maandelijks rapport (CSV) van de certificaten manager.</p>
            <p>Aantal (PDF) bestanden uitgelezen: ${count}</p><br />
            <p>Met vriendelijke groet,</p><br />
            <p>Taffgear</p>
            `, // html body
            attachments: [{ path: csvOutputDir }]
        };

        const info = await sendMail(transporter, mailOptions);
        return info;
        console.log(info);
    } catch (e) {
        console.log(e);
    }

    return false;
}

async function addToCSV(rows) {
    const csv = new ObjectsToCsv(rows);
    await csv.toDisk(csvOutputDir);
}

async function run() {
    const logs = await redis.smembers(`jdj:pdf-reading:${moment().format('YYYY-MM-DD')}`);

    if (!logs || !logs.length) {
        console.error('No log files found for current month');
        process.exit(1);
    }

    const rows = [];

    logs.forEach(str => rows.push(JSON.parse(str)));
    await addToCSV(rows);

    console.log(`Added ${rows.length} to CSV file: ${csvOutputDir}`);

    if (email) {
        const send = await emailReport(rows.length);
        console.log(send);
    }
    process.exit(1);
}

run();