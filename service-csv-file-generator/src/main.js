const constants = require('../../resources/constants');

async function run() {
	const rabbot = await require('../../resources/rabbitmq')(require('./lib/rmq'));

	rabbot.handle({
		queue: constants.CSV_FILE_GENERATOR_QNAME,
		type: '#',
		autoNack: true,
		context: null,
		handler: require('./handlers/generator').bind({ rabbot })
	});

	console.log('service-csv-file-generator running...');
}

run();
