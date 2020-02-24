const path = require('path');
const fs = require('fs');
const rp = require('request-promise');

const nconf = require('nconf');
const cnf = nconf.argv().env().file({ file: path.resolve(__dirname + '/../../../config.json') });

const textHelper = require('./../lib/text');
const dataHelper = require('./../lib/data');
const templates = require('./../lib/templates');

async function findArticleByNumber(n) {
	let result;

	try {
		result = await rp({
			uri: cnf.get('api:uri') + `/stock/find/${n}`,
			headers: { Authorization: 'Bearer ' + cnf.get('api:jwt_token') },
			json: true
		});
	} catch (e) {
		console.error(e.message);
		return false;
	}

	return result;
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
			console.error(`File ${file || test} not found.`);
			return rejectable ? msg.reject() : null;
		}
	} catch (err) {
		console.error(err);
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
			return rejectable ? msg.reject() : null;
		}

		if (DEBUG) console.log(`Google Vision API Output: \n ${gtxt}`);

		// try to get type again with new input
		type = dataHelper.getTemplateType(gtxt);

		// set input if first try gave no result
		if (!txt.length || txt.length < 10) txt = gtxt;
	}

	if (!type) {
		console.error(`No type found for file ${filename}`);
		return rejectable ? msg.reject() : null;
	} else {
		result = dataHelper.getData(txt, type);

		// Use Google API as fallback
		if ((!result || !result.articleNumber) && templates[type].forceGoogleAPI && !test) {
			if (!gtxt) gtxt = await textHelper.PDFToText(file, false);

			if (DEBUG) console.log(`Google Vision API Output (Fallback): \n ${gtxt}`);

			result = dataHelper.getData(gtxt, type);
		}

		const data = Object.assign(result || {}, { type, filename });

		console.log(JSON.stringify(data, null, 2));

		// if (data && data.articleNumber) {
		// 	const article = await findArticleByNumber(data.articleNumber);
		// 	console.log(article);
		// }

		if (rejectable) msg.ack();
	}
};
