const fs = require('fs-extra');
const path = require('path');
const nconf = require('nconf');
const moment = require('moment');
const Redis = require('ioredis');
const uuid = require('uuid').v4;
const cnf = nconf.argv().env().file({ file: require('path').resolve(__dirname + '/../../../config.json') });

const redis = new Redis();

async function copyPDFToFailedFolder(filepath) {
	try {
		fs.copySync(filepath, `${cnf.get('pdfDirFailed')}${path.parse(filepath).base}`);
	} catch (e) {
		console.log(e);
		return false;
	}
}

function notifyClients(type, msg) {
	this.clients.forEach((client) => client.emit(type, msg));
}

function buildRedisKey(id, category) {
	return 'jdj:logs:certs:' + category + ':' + id;
}

module.exports = async function(msg, rejectable = true) {
	console.log(msg.body);

	if (!msg.body.success && fs.existsSync(msg.body.filepath)) await copyPDFToFailedFolder(msg.body.filepath);

	// remove file from watchdir
	if (fs.existsSync(msg.body.filepath)) fs.unlinkSync(msg.body.filepath);

	let logMsg;

	if (msg.body.success) {
		logMsg = {
			msg: `Certificaat ${msg.body.filename} succesvol gekoppeld aan artikel ${msg.body.articleNumber}`,
			ts: moment().format('x'),
			id: uuid()
		};

		await redis.set(buildRedisKey(logMsg.id, 'success'), JSON.stringify(logMsg));
		notifyClients.call(this, 'stockItem', msg.body);
	} else {
		logMsg = { msg: msg.body.reason, ts: moment().format('x'), id: uuid() };
		await redis.set(buildRedisKey(logMsg.id, 'failed'), JSON.stringify(logMsg));
	}

	notifyClients.call(this, 'log', logMsg);

	if (rejectable) msg.ack();
};
