const fs = require('fs-extra');
const rp = require('request-promise');
const nconf = require('nconf');
const moment = require('moment');
const mkdirp = require('mkdirp');
const cnf = nconf.argv().env().file({ file: require('path').resolve(__dirname + '/../../../config.json') });

const headers = { Authorization: 'Bearer ' + cnf.get('api:jwt_token') };
const constants = require('../../../resources/constants');
const helpers = require('../../../lib/helpers');

async function copyPDFToFolder(article, original) {
	const filePath = `${cnf.get('pdfDir')}/${article.PGROUP}/${article.GRPCODE}`;
	let filename = `${article.ITEMNO}.pdf`;

	try {
		if (!fs.existsSync(filePath)) mkdirp.sync(filePath);

		if (fs.existsSync(`${filePath}/${filename}`)) {
			// rename file with current datetime string
			filename = `${article.ITEMNO}_${moment().format('YYYYMMDDHHmmssSSS')}.pdf`;
		}

		fs.copySync(original, `${filePath}/${filename}`);

		return filename;
	} catch (e) {
		console.log(e);
		return false;
	}
}

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

async function findContdocItem(n) {
	try {
		const result = await rp({
			uri: `${cnf.get('api:uri')}/contdoc/find/${n}`,
			headers,
			json: true
		});

		if (result && result.success && result.body) return result.body;
	} catch (e) {
		console.error(e.message);
		return false;
	}

	return false;
}

async function findArticleByNumber(n) {
	try {
		const result = await rp({
			uri: cnf.get('api:uri') + `/stock/find/${n}`,
			headers,
			json: true
		});

		if (result && result.success && result.body) return result.body;
	} catch (e) {
		console.error(e.message);
		return false;
	}

	return false;
}

module.exports = async function(msg) {
	const article = await findArticleByNumber(msg.body.articleNumber);

	if (!article) {
		publishToWrapupQueue.call(this, msg.body, false, 'not_found');
		return msg.ack();
	}

	const contDoc = await findContdocItem(msg.body.articleNumber);

	if (contDoc && contDoc.SID && contDoc.SID.length && msg.body.date) {
		const m = moment(contDoc.SID);

		if (m.isValid() && moment(m.format('YYYY-MM-DD')).isSameOrAfter(msg.body.date)) {
			publishToWrapupQueue.call(this, msg.body, false, 'duplicate_contdoc');
			return msg.ack();
		}
	}

	article['LASTSER#3'] = moment().format('YYYY-MM-DD');

	let result = await helpers.updateStockItem(
		helpers.genUpdateStockItemBody(
			msg.body.date || article['LASTSER#3'],
			msg.body.serialNumber || article.SERNO || '',
			article.STATUS,
			article.ITEMNO
		)
	);

	if (!result) {
		publishToWrapupQueue.call(this, msg.body, false, 'update_stock_error');
		return msg.ack();
	}

	const filename = await copyPDFToFolder(article, msg.body.filepath);
	const fullPath = `${cnf.get('pdfDir')}/${article.PGROUP}/${article.GRPCODE}/${filename}`;

	if (!filename) {
		publishToWrapupQueue.call(this, msg.body, false, 'copy_file_failed');
		return msg.ack();
	}

	const winPath = `${cnf.get('pdfDirWin')}\\${article.PGROUP}\\${article.GRPCODE}\\${filename}`;

	result = await helpers.createContdoc(
		helpers.genCreateContDocBody(article.ITEMNO, winPath, msg.body.date || article['LASTSER#3'])
	);

	if (!result) {
		// remove copied file
		if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);

		publishToWrapupQueue.call(this, msg.body, false, 'create_contdoc_error');
		return msg.ack();
	}

	publishToWrapupQueue.call(this, Object.assign(msg.body, { fullPath, article }), true, null);

	msg.ack();
};
