const nconf = require('nconf');
const rp = require('request-promise');
const moment = require('moment');

const cnf = nconf.argv().env().file({ file: require('path').resolve(__dirname + '/../config.json') });
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

const genCreateContDocBody = (itemno, filePath, lastser, csv = false) => ({
	type: 'ST',
	key: itemno,
	filename: filePath,
	optflag: 0,
	options: 0,
	sid: lastser,
	scantopdftype: 0,
	name: 'Certificaat ' + moment(lastser, csv ? 'DD/MM/YYYY' : 'YYYY-MM-DD').format('YYYY'),
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

module.exports = { updateStockItem, createContdoc, genUpdateStockItemBody, genCreateContDocBody };
