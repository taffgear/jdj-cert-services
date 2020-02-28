const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const wkhtmltopdf = require('wkhtmltopdf');
const nconf = require('nconf');
const mkdirp = require('mkdirp');
const rp = require('request-promise');
const Xvfb = require('xvfb');

const cnf = nconf.argv().env().file({ file: require('path').resolve(__dirname + '/../../../config.json') });
const genHTML = require('../lib/genPDFHTMLString');
const xvfb = new Xvfb();

const headers = { Authorization: 'Bearer ' + cnf.get('api:jwt_token') };
const constants = require('../../../resources/constants');

function publishToWrapupQueue(body, status, reason) {
	this.rabbot.publish(
		constants.CMD_EXCH,
		{
			routingKey: constants.PDF_WRAPUP_BIND_KEY,
			body: Object.assign(body, {
				success: status,
				reason
			})
		},
		[ constants.AMQ_INSTANCE ]
	);
}

async function genPDF(obj) {
	try {
		return new Promise(async (resolve, reject) => {
			obj.testDate = moment(obj.testDate, 'DD/MM/YYYY').format('DD-MM-YYYY');
			obj.testTime = moment(obj.testTime, [ 'h:m:a', 'H:m' ]).format('HH:mm:ss');
			obj.validUntil = moment(obj.testDate, 'DD-MM-YYYY').add(1, 'year').format('DD-MM-YYYY');

			const prepped = Object.keys(obj).reduce((acc, k) => {
				if (k.indexOf('test') >= 0 && k.indexOf('@') > 0) {
					const parts = k.split('@');

					acc[parts[0]] = { value: obj[k], header: parts[1] };

					return acc;
				}

				acc[k] = { value: obj[k], header: null };

				return acc;
			}, {});

			let filePath;
			let fileName;
			let winFileName = null;

			if (!obj.ITEMNO) {
				filePath = cnf.get('pdfDirFailed');
				fileName = `${filePath}/${obj.articleNumber}.pdf`;
			} else {
				filePath = `${cnf.get('pdfDir')}/${obj.PGROUP}/${obj.GRPCODE}`;
				fileName = `${filePath}/${obj.ITEMNO}.pdf`;
				winFileName = `${cnf.get('pdfDirWin')}\\${obj.PGROUP}\\${obj.GRPCODE}\\${obj.ITEMNO}.pdf`;
			}

			const html = genHTML(prepped);

			if (!fs.existsSync(filePath)) mkdirp.sync(filePath);

			xvfb.startSync();

			wkhtmltopdf(
				html,
				{
					output: fileName,
					pageSize: 'A4',
					'margin-top': 0,
					'margin-bottom': 0,
					'margin-left': 0,
					'margin-right': 0,
					disableSmartShrinking: true
				},
				async (err) => {
					xvfb.stopSync();

					if (err) return reject(err);

					return resolve({ winFileName, fileName });
				}
			);
		});
	} catch (e) {
		console.log(e);
	}

	return null;
}

const genUpdateStockItemBody = (lastser, serno, status, itemno) => ({
	lastser: lastser,
	period: 365,
	serno: serno,
	status: parseInt(status) === 11 ? 0 : status,
	pattest: 1,
	patlastser: lastser,
	patperiod: 365,
	patpertype: 1,
	itemno: itemno
});

const genCreateContDocBody = (itemno, filePath, lastser) => ({
	type: 'ST',
	key: itemno,
	filename: filePath,
	optflag: 0,
	options: 0,
	sid: lastser,
	scantopdftype: 0,
	name: 'Certificaat ' + moment(lastser, 'DD/MM/YYYY').format('YYYY'),
	showinweb: 0
});

async function createContdoc(body) {
	try {
		const result = await rp({
			method: 'POST',
			uri: `${cnf.get('api:uri')}/contdoc`,
			headers,
			body,
			json: true
		});

		if (result && result.success && result.rowsAffected) return true;
	} catch (e) {
		console.error(e.message);
		return false;
	}

	return false;
}

async function updateStockItem(body) {
	try {
		const result = await rp({
			method: 'PUT',
			uri: `${cnf.get('api:uri')}/stock`,
			headers,
			body,
			json: true
		});

		if (result && result.success && result.rowsAffected) return true;
	} catch (e) {
		console.error(e.message);
		return false;
	}

	return false;
}

module.exports = async function(msg, rejectable = true) {
	const o = msg.body.article;
	const serno = o.articleSerialnumber.length ? o.articleSerialnumber : o['SERNO'];
	let result = await updateStockItem(
		genUpdateStockItemBody(moment(o.testDate, 'DD/MM/YYYY').format('YYYY-MM-DD'), serno, o.STATUS, o.ITEMNO)
	);

	if (!result) {
		publishToWrapupQueue.call(
			this,
			{ articleNumber: msg.body.ITEMNO, filepath: msg.body.path, filename: msg.body.filename },
			false,
			'update_stock_error'
		);
		return rejectable ? msg.ack() : null;
	}

	const filePaths = await genPDF(o);

	result = await createContdoc(genCreateContDocBody(o.ITEMNO, filePaths.winFileName, o.testDate));

	if (!result) {
		// remove copied file
		if (fs.existsSync(filePaths.fileName)) fs.unlinkSync(filePaths.fileName);

		publishToWrapupQueue.call(
			this,
			{ articleNumber: msg.body.ITEMNO, filepath: msg.body.path, filename: msg.body.filename },
			false,
			'create_contdoc_error'
		);
		return rejectable ? msg.ack() : null;
	}

	publishToWrapupQueue.call(
		this,
		{
			article: { ITEMNO: o.ITEMNO },
			articleNumber: o.ITEMNO,
			filepath: o.path,
			filename: path.parse(filePaths.fileName).base,
			fullPath: filePaths.fileName
		},
		true,
		null
	);

	if (rejectable) msg.ack();
};
