const vision = require('@google-cloud/vision').v1;
const pdfUtil = require('pdf-to-text');
const fs = require('fs');

/**
 * Extract text from PDF using either pdf-to-text library or Google Vision API
 *
 * @param filePath {string} Path to local pdf file, e.g. /path/document.pdf
 */
async function PDFToText(filePath, local = false) {
	if (local) {
		return new Promise(async (resolve, reject) => {
			pdfUtil.pdfToText(filePath, (err, data) => {
				if (err) return resolve(false);

				// remove whitespace and return result
				return resolve(data.replace(/\s\s+/g, ' '));
			});
		});
	}

	const client = new vision.ImageAnnotatorClient();

	// Supported mime_type: application/pdf, image/tiff, image/gif
	// The service can process up to 5 pages per document file
	// We only need 3 pages so far
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

		let txt;

		for (const r of responses[0].responses[0].responses) {
			if (r && r.fullTextAnnotation && r.fullTextAnnotation.text) txt += r.fullTextAnnotation.text;
		}
		return txt;
	} catch (e) {
		console.error(e);
	}
}

module.exports = { PDFToText };
