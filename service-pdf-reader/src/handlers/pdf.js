const path = require('path');
const fs = require('fs');
const ObjectsToCsv = require('objects-to-csv');
const moment = require('moment');

const nconf = require('nconf');
const cnf = nconf.argv().env().file({ file: path.resolve(__dirname + '/../../../config.json') });

const textHelper = require('../lib/text');
const dataHelper = require('../lib/data');
const templates = require('../lib/templates');
const csvOutput = typeof cnf.get('CSV') !== 'undefined' && cnf.get('CSV') === 'true' ? true : false;
const results = [];
const resultDefaults = { articleNumber: '', serialNumber: '', date: '', type: '' };
const csvOutputDir = `${cnf.get('csvOutputDir') || '/tmp'}/pdf-batch-output-${moment().format(
	'YYYY-MM-DD HH:mm:ss'
)}.csv`;

const constants = require('../../../resources/constants');

async function addToCSV() {
	const csv = new ObjectsToCsv(results);
	await csv.toDisk(csvOutputDir);
}

function publishToWrapupQueue(body, status, reason) {
	this.rabbot.publish(
		constants.CMD_EXCH,
		{
			routingKey: constants.PDF_WRAPUP_BIND_KEY,
			body: Object.assign(body, {
				success: status,
				reason
			})
		},
		[ constants.AMQ_INSTANCE ]
	);
}

module.exports = async function(msg, rejectable = true) {
	let txt, gtxt, type, result;

	const file = msg.body.filename;
	const test = msg.body.test;
	const DEBUG = msg.body.debug;

	if (!file && !test) {
		console.error('No PDF input file given');
		return rejectable ? msg.reject() : null;
	}

	try {
		if (!fs.existsSync(file) && !fs.existsSync(test)) {
			publishToWrapupQueue.call(
				this,
				Object.assign(msg.body, { filepath: file || test }),
				false,
				'file_not_found'
			);

			console.error(`File ${file || test} not found.`);
			return rejectable ? msg.reject() : null;
		}
	} catch (err) {
		console.error(err);

		publishToWrapupQueue.call(this, Object.assign(msg.body, { filepath: file || test }), false, e.message);

		return rejectable ? msg.reject() : null;
	}

	const filename = path.parse(file || test).base;

	try {
		if (!test) {
			txt = await textHelper.PDFToText(file, true);
		} else {
			txt = fs.readFileSync(test).toString();
		}
	} catch (e) {
		console.log(e);

		publishToWrapupQueue.call(
			this,
			Object.assign(msg.body, { filepath: file || test, filename }),
			false,
			e.message
		);

		if (csvOutput) {
			results.push(Object.assign({ filename, status: 'ERROR', reason: e.message }, resultDefaults));
			await addToCSV();
		}

		return rejectable ? msg.reject() : null;
	}

	if (file && DEBUG) {
		console.log(`pdf-to-text output: \n${txt.replace(/(\r\n|\n|\r)/gm, ' ')}`);
	}

	type = dataHelper.getTemplateType(txt);

	// fallback with Google Vision API
	if (!type) {
		try {
			gtxt = await textHelper.PDFToText(file, false);
		} catch (e) {
			console.log(e);

			publishToWrapupQueue.call(
				this,
				Object.assign(msg.body, { filepath: file || test, filename, type }),
				false,
				e.message
			);

			if (csvOutput) {
				results.push(Object.assign({ filename, status: 'ERROR', reason: e.message }, resultDefaults));
				await addToCSV();
			}

			return rejectable ? msg.reject() : null;
		}

		if (DEBUG) console.log(`Google Vision API Output: \n ${gtxt}`);

		// try to get type again with new input
		type = dataHelper.getTemplateType(gtxt);

		// set input if first try gave no result
		if (!txt.length || txt.length < 10) txt = gtxt;
	}

	// check if file is a certificate
	const isCertificate = dataHelper.isCertificate(txt);

	if (!isCertificate) {
		console.error(`Skipping ${filename} - no certificate identifier found.`);

		publishToWrapupQueue.call(
			this,
			Object.assign(msg.body, { filepath: file || test, filename, type }),
			false,
			'no_identifier_found'
		);

		if (csvOutput) {
			results.push(
				Object.assign(
					{ filename, status: 'SKIPPING', reason: 'no certificate identifier found' },
					resultDefaults
				)
			);
			await addToCSV();
		}

		return rejectable ? msg.reject() : null;
	}

	if (!type) {
		console.error(`No type found for file ${filename}`);

		publishToWrapupQueue.call(
			this,
			Object.assign(msg.body, { filepath: file || test, filename }),
			false,
			'no_type_found'
		);

		if (csvOutput) {
			results.push(
				Object.assign(
					{ filename, status: 'SKIPPING', reason: 'no type/supplier found' },
					resultDefaults
				)
			);
			await addToCSV();
		}

		return rejectable ? msg.reject() : null;
	} else {
		result = dataHelper.getData(txt, type);

		// Use Google API as fallback
		if ((!result || !result.articleNumber) && templates[type].forceGoogleAPI && !test && !gtxt) {
			if (!gtxt) gtxt = await textHelper.PDFToText(file, false);

			if (DEBUG) console.log(`Google Vision API Output (Fallback): \n ${gtxt}`);

			result = dataHelper.getData(gtxt, type);
		}

		const data = Object.assign(result || {}, { type, filename, filepath: file || test });

		if (csvOutput) {
			results.push({
				filename,
				status: data.articleNumber ? 'OK' : 'NOT FOUND',
				reason: '',
				articleNumber: data.articleNumber || '',
				serialNumber: data.serialNumber || '',
				date: data.date || '',
				type
			});

			await addToCSV();
		}

		if (data && data.articleNumber) {
			this.rabbot.publish(
				constants.CMD_EXCH,
				{
					routingKey: constants.PDF_MATCH_BIND_KEY,
					body: data
				},
				[ constants.AMQ_INSTANCE ]
			);
		}

		console.log(JSON.stringify(data, null, 2));

		if (rejectable) msg.ack();
	}
};
