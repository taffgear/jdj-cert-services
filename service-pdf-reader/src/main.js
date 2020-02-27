const constants = require('../../resources/constants');

async function run() {
	const rabbot = await require('../../resources/rabbitmq')(require('./lib/rmq'));

	rabbot.handle({
		queue: constants.PDF_QNAME,
		type: '#',
		autoNack: true,
		context: null,
		handler: require('./handlers/pdf').bind({ rabbot })
	});
}

run();
