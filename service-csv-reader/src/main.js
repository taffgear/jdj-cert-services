const constants = require('../../resources/constants');

async function run() {
	const rabbot = await require('../../resources/rabbitmq')(require('./lib/rmq'));

	rabbot.handle({
		queue: constants.CSV_QNAME,
		type: '#',
		autoNack: true,
		context: null,
		handler: require('./handlers/reader').bind({ rabbot })
	});

	console.log('service-csv-reader running...');
}

run();
