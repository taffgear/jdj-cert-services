const fs = require('fs');

const textHelper = require('./lib/text');
const dataHelper = require('./lib/data');

async function main() {
	const file = process.env.FILE || null;
	const test = process.env.TEST || false; // provide url to txt file
	let txt, type, data;

	if (!file && !test) {
		console.warning('No PDF input file given');
		return;
	}

	if (!test) {
		txt = await textHelper.PDFToText(file, true);
	} else {
		txt = fs.readFileSync(test).toString();
	}

	if (file) {
		console.log(txt.replace(/(\r\n|\n|\r)/gm, ' '));
	}

	type = dataHelper.getTemplateType(txt);

	// fallback with Google Vision API
	if (!type) {
		txt = await textHelper.PDFToText(file, false);
		console.log(txt);
	}
	type = dataHelper.getTemplateType(txt);

	if (!type) {
		console.error('No type found');
	} else {
		data = dataHelper.getData(txt, type);

		console.log(Object.assign(data || {}, { type }));
	}
}

main();
