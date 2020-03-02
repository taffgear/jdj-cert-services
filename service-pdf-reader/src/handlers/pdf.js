const path = require('path');
const fs = require('fs');

const textHelper = require('../lib/text');
const dataHelper = require('../lib/data');
const templates = require('../lib/templates');
const constants = require('../../../resources/constants');

function publishToWrapupQueue(body, status, reason) {
	this.rabbot.publish(
		constants.CMD_EXCH,
		{
			routingKey: constants.PDF_WRAPUP_BIND_KEY,
			body: Object.assign(body, {
				success: status,
				reason,
				pdf: true
			})
		},
		[ constants.AMQ_INSTANCE ]
	);
}

module.exports = async function(msg) {
	let txt, gtxt, type, result;

	const file = msg.body.filename;

	if (!file) {
		console.error('No PDF input file given');
		return msg.reject();
	}

	try {
		if (!fs.existsSync(file)) {
			publishToWrapupQueue.call(this, Object.assign(msg.body, { filepath: file }), false, 'file_not_found');

			console.error(`File ${file} not found.`);
			return msg.reject();
		}
	} catch (err) {
		console.error(err);

		publishToWrapupQueue.call(this, Object.assign(msg.body, { filepath: file }), false, e.message);

		return msg.reject();
	}

	const filename = path.parse(file).base;

	try {
		txt = await textHelper.PDFToText(file, true);
	} catch (e) {
		console.log(e);

		publishToWrapupQueue.call(this, Object.assign(msg.body, { filepath: file, filename }), false, e.message);

		return msg.reject();
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
				Object.assign(msg.body, { filepath: file, filename, type }),
				false,
				e.message
			);

			return msg.reject();
		}

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
			Object.assign(msg.body, { filepath: file, filename, type }),
			false,
			'no_identifier_found'
		);

		return msg.reject();
	}

	if (!type) {
		console.error(`No type found for file ${filename}`);

		publishToWrapupQueue.call(
			this,
			Object.assign(msg.body, { filepath: file, filename }),
			false,
			'no_type_found'
		);

		return msg.reject();
	} else {
		result = dataHelper.getData(txt, type);

		// Use Google API as fallback
		if ((!result || !result.articleNumber) && templates[type].forceGoogleAPI && !gtxt) {
			if (!gtxt) gtxt = await textHelper.PDFToText(file, false);

			result = dataHelper.getData(gtxt, type);
		}

		const data = Object.assign(result || {}, { type, filename, filepath: file });

		if (data && data.articleNumber) {
			this.rabbot.publish(
				constants.CMD_EXCH,
				{
					routingKey: constants.PDF_MATCH_BIND_KEY,
					body: data
				},
				[ constants.AMQ_INSTANCE ]
			);
		} else {
			publishToWrapupQueue.call(
				this,
				Object.assign(msg.body, { filepath: file, filename, type }),
				false,
				'no_article_number_found'
			);
		}

		console.log(JSON.stringify(data, null, 2));

		msg.ack();
	}
};
