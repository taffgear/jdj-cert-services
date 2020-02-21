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

module.exports = async function(msg) {
	let txt, gtxt, type, result;

	const file = msg.body.filename;
	const test = msg.body.test;
	const DEBUG = msg.body.debug;

	if (!file && !test) {
		console.warning('No PDF input file given');
		return;
	}

	try {
		if (!fs.existsSync(file)) {
			console.error(`File ${file} not found.`);
			return msg.reject();
		}
	} catch (err) {
		console.error(err);
		return msg.reject();
	}

	try {
		if (!test) {
			txt = await textHelper.PDFToText(file, true);
		} else {
			txt = fs.readFileSync(test).toString();
		}
	} catch (e) {
		console.log(e);
		return msg.reject();
	}

	if (file && DEBUG) {
		console.log(txt.replace(/(\r\n|\n|\r)/gm, ' '));
	}

	type = dataHelper.getTemplateType(txt);

	// fallback with Google Vision API
	if (!type) {
		try {
			gtxt = await textHelper.PDFToText(file, false);
		} catch (e) {
			console.log(e);
			return msg.reject();
		}

		if (DEBUG) console.log(gtxt);

		// try to get type again with new input
		type = dataHelper.getTemplateType(gtxt);

		// set input if first try gave no result
		if (!txt.length || txt.length < 10) txt = gtxt;
	}

	if (!type) {
		console.error('No type found');
		msg.reject();
	} else {
		result = dataHelper.getData(txt, type);

		// Use Google API as fallback
		if ((!result || !result.articleNumber) && templates[type].forceGoogleAPI && !test) {
			if (!gtxt) gtxt = await textHelper.PDFToText(file, false);
			result = dataHelper.getData(gtxt, type);
		}

		const data = Object.assign(result || {}, { type });

		console.log(JSON.stringify(data, null, 2));

		if (data && data.articleNumber) {
			const article = await findArticleByNumber(data.articleNumber);
			console.log(article);
		}

		msg.ack();
	}
};
