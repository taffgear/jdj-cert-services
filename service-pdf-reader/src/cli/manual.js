const path = require('path');
const fs = require('fs');

const textHelper = require('../lib/text');
const dataHelper = require('../lib/data');
const templates = require('../lib/templates');

const file = process.env.FILE || null;
const test = process.env.TEST || false; // provide url to txt file
const DEBUG = process.env.DEBUG || false;

async function run() {
	let txt, gtxt, type, result;

	if (!file && !test) {
		console.error('No PDF input file given');
		return null;
	}

	try {
		if (!fs.existsSync(file) && !fs.existsSync(test)) {
			console.error(`File ${file || test} not found.`);
			return null;
		}
	} catch (err) {
		console.error(err);
		return null;
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
		return null;
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
			return null;
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
		return null;
	}

	if (!type) {
		console.error(`No type found for file ${filename}`);
		return null;
	} else {
		result = dataHelper.getData(txt, type);

		// Use Google API as fallback
		if ((!result || !result.articleNumber) && templates[type].forceGoogleAPI && !test && !gtxt) {
			if (!gtxt) gtxt = await textHelper.PDFToText(file, false);

			if (DEBUG) console.log(`Google Vision API Output (Fallback): \n ${gtxt}`);

			result = dataHelper.getData(gtxt, type);
		}

		const data = Object.assign(result || {}, { type, filename, filepath: file || test });
		console.log(JSON.stringify(data, null, 2));
	}
}

run();
