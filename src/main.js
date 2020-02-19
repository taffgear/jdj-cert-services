const vision = require('@google-cloud/vision').v1;
const moment = require('moment');
const fs = require('fs');

const types = require('./lib/types');

/**
 * Perform batch file annotation
 *
 * @param filePath {string} Path to local pdf file, e.g. /path/document.pdf
 */
async function PDFToText(filePath) {
	const client = new vision.ImageAnnotatorClient();

	// Supported mime_type: application/pdf, image/tiff, image/gif
	// The service can process up to 5 pages per document file
	const pages = [ 1, 2, 3 ];
	const requestsElement = {
		inputConfig: {
			mimeType: 'application/pdf',
			content: fs.readFileSync(filePath).toString('base64')
		},
		features: [
			{
				type: 'DOCUMENT_TEXT_DETECTION'
			}
		],
		pages
	};

	const requests = [ requestsElement ];

	try {
		const responses = await client.batchAnnotateFiles({ requests: requests });
		return responses[0].responses[0].responses;
	} catch (e) {
		console.error(e);
	}
}

function getTemplateType(txt) {
	const str = txt.replace(/(\r\n|\n|\r)/gm, ' ');
	return Object.keys(types).reduce((acc, t) => {
		if (acc) return acc;
		if (str.indexOf(t) >= 0) acc = t;

		return acc;
	}, null);
}

function getData(txt, type) {
	if (!types || !type || !types[type] || !txt) return null;

	const settings = types[type];

	if (!settings.text) return null;

	return Object.keys(settings.text).reduce((acc, k) => {
		const cnf = settings.text[k];

		if (!cnf || !cnf.start) return acc;

		const matches = txt.replace(/(\r\n|\n|\r)/gm, ' ').match(cnf.start + '(.*)' + cnf.end);

		// if (k === 'date') {
		// 	console.log(txt.replace(/(\r\n|\n|\r)/gm, ' '));
		// 	console.log(cnf.start, cnf.end, matches);
		// }

		if (!matches || matches.length < 1 || matches[1].length > 30) {
			if (!cnf.fallback || typeof cnf.fallback !== 'function') return acc;

			const flb = cnf.fallback(txt);

			if (flb) acc[k] = flb;
			return acc;
		}

		if (cnf.get && typeof cnf.get === 'function') acc[k] = cnf.get(matches[1]);
		else acc[k] = matches[1].trim();

		if (k !== 'date') return acc;

		const m = moment(acc[k], cnf.format);
		if (m.isValid()) acc[k] = m.format('YYYY-MM-DD');

		return acc;
	}, {});
}

async function main() {
	const file = process.env.FILE || null;
	const test = process.env.TEST || false; // provide url to txt file
	let txt;

	if (!file && !test) {
		console.warning('No PDF input file given');
		return;
	}

	if (!test) {
		const pages = await PDFToText(file);

		for (const r of pages) {
			txt += r.fullTextAnnotation.text;
		}
	} else {
		txt = fs.readFileSync(test).toString();
	}

	const type = getTemplateType(txt);
	const data = getData(txt, type);

	console.log(data);
}

main();
