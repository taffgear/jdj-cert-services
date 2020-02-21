const constants = require('../../resources/constants');
const PDF_QNAME = constants.PDF_QNAME;

async function run() {
	const rabbot = await require('../../resources/rabbitmq')();
	rabbot.handle({
		queue: PDF_QNAME,
		type: '#',
		autoNack: true,
		context: null,
		handler: require('./handlers/pdf')
	});
	// rabbot.handle({ queue: CSV_QNAME, type: '#', autoNack: true, context: null, handler: insts.csv_handler_fn });
}

run();
