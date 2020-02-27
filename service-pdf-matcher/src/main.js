const constants = require('../../resources/constants');

async function run() {
	const rabbot = await require('../../resources/rabbitmq')(require('./lib/rmq'));

	rabbot.handle({
		queue: constants.PDF_MATCH_QNAME,
		type: '#',
		autoNack: true,
		context: null,
		handler: require('./handlers/matcher').bind({ rabbot })
	});

	console.log('service-pdf-matcher running...');
}

run();
