const vision = require('@google-cloud/vision').v1;
const fs = require('fs');

const types = [ 'Laspartners Multiweld', 'Nemad Maritime Safety', 'Technisch Buro J. Verheij' ];

/**
 * Perform batch file annotation
 *
 * @param filePath {string} Path to local pdf file, e.g. /path/document.pdf
 */
async function PDFToText(filePath) {
	const client = new vision.ImageAnnotatorClient();

	// Supported mime_type: application/pdf, image/tiff, image/gif
	// The service can process up to 5 pages per document file
	const pages = [ 1, 2 ];
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
	// TODO: store template data in redis
	return types.reduce((acc, t) => {
		if (txt.indexOf(t) >= 0) acc = t;

		return acc;
	}, null);
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
	console.log(type);
}

main();
