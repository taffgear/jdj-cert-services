const fs = require('fs');

const textHelper = require('./lib/text');
const dataHelper = require('./lib/data');

async function main() {
	const file = process.env.FILE || null;
	const test = process.env.TEST || false; // provide url to txt file
	const DEBUG = process.env.DEBUG || false;

	let txt, type;

	if (!file && !test) {
		console.warning('No PDF input file given');
		return;
	}

	if (!test) {
		txt = await textHelper.PDFToText(file, true);
	} else {
		txt = fs.readFileSync(test).toString();
	}

	if (file && DEBUG) {
		console.log(txt.replace(/(\r\n|\n|\r)/gm, ' '));
	}

	type = dataHelper.getTemplateType(txt);

	// fallback with Google Vision API
	if (!type) {
		const gtxt = await textHelper.PDFToText(file, false);

		if (DEBUG) console.log(gtxt);

		// try to get type again with new input
		type = dataHelper.getTemplateType(gtxt);

		// set input if first try gave no result
		if (!txt.length) txt = gtxt;
	}

	if (!type) {
		console.error('No type found');
	} else {
		const result = dataHelper.getData(txt, type);
		const data = Object.assign(result || {}, { type });

		console.log(JSON.stringify(data, null, 2));
	}
}

main();
