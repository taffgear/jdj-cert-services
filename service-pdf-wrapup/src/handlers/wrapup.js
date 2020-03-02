const fs = require('fs-extra');
const path = require('path');
const nconf = require('nconf');
const moment = require('moment');
const uuid = require('uuid').v4;
const cnf = nconf.argv().env().file({ file: require('path').resolve(__dirname + '/../../../config.json') });

async function copyPDFToFailedFolder(filepath) {
	try {
		fs.copySync(filepath, `${cnf.get('pdfDirFailed')}/${path.parse(filepath).base}`);
	} catch (e) {
		console.log(e);
		return false;
	}
}

function notifyClients(type, msg) {
	this.clients.forEach((client) => client.emit(type, msg));
}

function buildRedisKey(id, category) {
	return 'jdj:logs:' + category + ':' + id;
}

module.exports = async function(msg) {
	if (!msg.body.success && fs.existsSync(msg.body.filepath)) await copyPDFToFailedFolder(msg.body.filepath);

	// remove file from watchdir
	if (fs.existsSync(msg.body.filepath)) fs.unlinkSync(msg.body.filepath);

	let logMsg, message;

	if (msg.body.success) {
		message = `Certificaat ${msg.body.filename} succesvol gekoppeld aan artikel ${msg.body.articleNumber}`;
		logMsg = {
			msg: message,
			ts: moment().format('x'),
			id: uuid()
		};

		await this.redis.set(buildRedisKey(logMsg.id, 'success'), JSON.stringify(logMsg));
		notifyClients.call(this, 'stockItem', msg.body.article);
	} else {
		switch (msg.body.reason) {
			case 'not_found':
				message = `Geen artikel gevonden met nummer ${msg.body.articleNumber} uit het bestand ${msg.body
					.filename}`;
				break;

			case 'no_identifier_found':
				message = `Het bestand ${msg.body
					.filename} is niet gekoppeld omdat het niet is herkend als certificaat bestand.`;
				break;

			case 'no_type_found':
				message = `Het bestand ${msg.body
					.filename} is niet gekoppeld omdat er geen template gevonden is voor dit bestand.`;
				break;

			case 'no_article_number_found':
				message = `Het bestand ${msg.body
					.filename} is niet gekoppeld omdat er geen artikelnummer uit het bestand gehaald kon worden.`;
				break;

			case 'duplicate_contdoc':
				message = `Het bestand ${msg.body.filename} is reeds gekoppeld aan artikel ${msg.body
					.articleNumber} met keuringsdatum ${msg.body.date}`;
				break;

			case 'copy_file_failed':
				message = `Het bestand ${msg.body.filename} met artikelnummer ${msg.body
					.articleNumber} kon niet worden gekopieerd.`;
				break;

			case 'csv_item_lookup_failed':
				message = `Het CSV bestand ${msg.body.filename} heeft geen matches opgeleverd.`;
				break;

			case 'csv_item_not_found':
				message = `Het artikel met nummer ${msg.body.articleNumber} uit het CSV bestand ${msg.body
					.filename} is niet gevonden.`;
				break;

			default:
				message = `Er is een onbekende fout opgetreden tijdens het verwerken van bestand: ${msg.body
					.filepath}`;
				break;
		}

		logMsg = { msg: message, ts: moment().format('x'), id: uuid() };
		await this.redis.set(buildRedisKey(logMsg.id, 'failed'), JSON.stringify(logMsg));
	}

	if (msg.body.pdf) {
		const logEntry = {
			Status: msg.body.success ? 'OK' : 'ERROR',
			Bestandsnaam: msg.body.filename,
			Artikelnummer: msg.body.articleNumber || '',
			Serienummer: msg.body.serialNumber || '',
			'Datum keuring': msg.body.date || '',
			'Type PDF template': msg.body.type || '',
			'Log bericht': message,
			'Bestand locatie': msg.body.fullPath || ''
		};

		await this.redis.sadd(`jdj:pdf-reading:${moment().format('YYYY-MM-DD')}`, JSON.stringify(logEntry));
	}

	notifyClients.call(this, 'log', logMsg);

	msg.ack();
};
