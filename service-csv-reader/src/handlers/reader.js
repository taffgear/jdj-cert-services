const path = require('path');
const rp = require('request-promise');
const nconf = require('nconf');
const csv = require('csvtojson');
const { uniq } = require('lodash');
const moment = require('moment');
const cnf = nconf.argv().env().file({ file: require('path').resolve(__dirname + '/../../../config.json') });

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

async function findStockItems(itemNumbers) {
	try {
		const result = await rp({
			uri: cnf.get('api:uri') + `/stock/findin`,
			body: { itemNumbers },
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

function mapCSVObjectsToStockItems(objects, stockItems) {
	if (!stockItems || !stockItems.length) return [];

	return objects.reduce((acc, obj) => {
		const stockItem = stockItems.find((o) => o.ITEMNO === obj.articleNumber);

		if (!stockItem) {
			obj.match = false;
			acc.push(obj);
			return acc;
		}

		let testDate = null,
			lastser = null;

		try {
			// TODO: detect date format
			testDate = obj.testDate && obj.testDate.length > 4 ? moment(obj.testDate, 'DD/MM/YYYY') : null;
			lastser =
				stockItem['LASTSER#3'] && stockItem['LASTSER#3'].substring(0, 4) > 2000
					? moment(stockItem['LASTSER#3'])
					: null;
		} catch (e) {
			console.log(e.message);
		}

		if (
			lastser &&
			testDate &&
			lastser.isValid() &&
			testDate.isValid() &&
			moment(lastser.format('YYYY-MM-DD')).isSameOrAfter(moment(testDate).format('YYYY-MM-DD'))
		)
			return acc;

		obj.match = true;

		acc.push(Object.assign(obj, stockItem));

		return acc;
	}, []);
}

module.exports = async function(msg) {
	const filename = path.parse(msg.body.filename).base;
	const data = await csv().fromFile(msg.body.filename);
	const results = await findStockItems(uniq(data.map((o) => o.articleNumber)));

	if (!results || !results.length) {
		publishToWrapupQueue.call(this, { filepath: msg.body.filename }, false, 'csv_item_lookup_failed');
		return msg.reject();
	}

	const mapped = mapCSVObjectsToStockItems(data, results);

	mapped.forEach((o) => {
		if (!o.match) {
			publishToWrapupQueue.call(
				this,
				{ filepath: msg.body.filename, filename, articleNumber: o.articleNumber },
				false,
				'csv_item_not_found'
			);
		} else {
			this.rabbot.publish(
				constants.CMD_EXCH,
				{
					routingKey: constants.CSV_FILE_GENERATOR_BIND_KEY,
					body: { article: o, filename, path: msg.body.filename }
				},
				[ constants.AMQ_INSTANCE ]
			);
		}
	});

	msg.ack();
};
