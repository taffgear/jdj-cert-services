const rp = require('request-promise');
const nconf = require('nconf');
const moment = require('moment');
const cnf = nconf.argv().env().file({ file: require('path').resolve(__dirname + '/../../../config.json') });

const headers = { Authorization: 'Bearer ' + cnf.get('api:jwt_token') };

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
	name: 'Certificaat ' + moment(lastser).format('YYYY'),
	showinweb: 0
});

async function createContdoc(body) {
	console.log(body);

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
	console.log(body);

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

module.exports = async function(msg, rejectable = true) {
	console.log(msg.body);

	const article = await findArticleByNumber(msg.body.articleNumber);

	if (!article) {
		// TODO: publish message to last process
		return rejectable ? msg.ack() : null;
	}

	console.log(article);

	const contDoc = await findContdocItem(msg.body.articleNumber);

	console.log(`ContDoc: ${!!contDoc}`);

	if (contDoc && contDoc.SID && contDoc.SID.length && msg.body.date) {
		const m = moment(contDoc.SID);

		if (
			m.isValid() &&
			(moment(m.format('YYYY-MM-DD')).isSameOrAfter(msg.body.date) ||
				m.format('YYYY-MM-DD') === msg.body.date)
		) {
			// TODO: publish message to last process
			console.error(`PDF ${msg.body.filepath} is al verwerkt.`);
			return rejectable ? msg.ack() : null;
			// throw new Error('PDF ' + path + ' is al verwerkt.');
		}
	}

	article['LASTSER#3'] = moment().format('YYYY-MM-DD');

	let result = await updateStockItem(
		genUpdateStockItemBody(
			msg.body.date || article['LASTSER#3'],
			msg.body.serialNumber || article.SERNO || '',
			article.STATUS,
			article.ITEMNO
		)
	);

	console.log(`Result update stock: ${result}`);

	if (!result) {
		// TODO: publish message to last process
		return rejectable ? msg.ack() : null;
	}

	result = await createContdoc(
		genCreateContDocBody(article.ITEMNO, msg.body.filename, msg.body.date || article['LASTSER#3'])
	);

	console.log(`Result create contdoc: ${result}`);

	if (!result) {
		// TODO: publish message to last process
		return rejectable ? msg.ack() : null;
	}

	if (rejectable) msg.ack();
};
