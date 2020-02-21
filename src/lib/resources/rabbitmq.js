const path = require('path');
const rabbot = require('rabbot');
const nconf = require('nconf');
const cnf = nconf.argv().env().file({ file: path.resolve(__dirname + '/../../../config.json') });

const constants = require('../constants');

const CMD_EXCH = constants.CMD_EXCH;
const DLX_EXCH = constants.DLX_EXCH;
const PDF_BIND_KEY = constants.PDF_BIND_KEY;
const CSV_BIND_KEY = constants.CSV_BIND_KEY;
const PDF_QNAME = constants.PDF_QNAME;
const CSV_QNAME = constants.CSV_QNAME;
const DLX_QNAME = constants.DLX_QNAME;
const AMQ_INSTANCE = constants.AMQ_INSTANCE;

async function createRMQConn() {
	try {
		await rabbot.configure({
			connection: {
				name: AMQ_INSTANCE,
				user: cnf.get('rabbot:user'),
				pass: cnf.get('rabbot:pass'),
				host: cnf.get('rabbot:host'),
				port: 5672,
				vhost: '%2f'
			},
			exchanges: [
				{ name: DLX_EXCH, type: 'topic', persistent: true },
				{ name: CMD_EXCH, type: 'topic', persistent: true }
			],
			queues: [
				{ name: DLX_QNAME, durable: true, noAck: false },
				{
					name: PDF_QNAME,
					subscribe: true,
					durable: true,
					deadLetter: DLX_EXCH,
					autoDelete: false,
					limit: 1,
					noBatch: false,
					noAck: false
				},
				{
					name: CSV_QNAME,
					subscribe: true,
					durable: true,
					deadLetter: DLX_EXCH,
					autoDelete: false,
					limit: 1,
					noBatch: false,
					noAck: false
				}
			],
			bindings: [
				{ exchange: DLX_EXCH, target: DLX_QNAME, keys: [ 'cmd.#' ] },
				{ exchange: CMD_EXCH, target: PDF_QNAME, keys: [ PDF_BIND_KEY ] },
				{ exchange: CMD_EXCH, target: CSV_QNAME, keys: [ CSV_BIND_KEY ] }
			]
		});

		console.log('Rabbit MQ connection succeeded');

		rabbot.handle({
			queue: PDF_QNAME,
			type: '#',
			autoNack: true,
			context: null,
			handler: require('../../handlers/pdf')
		});
		// rabbot.handle({ queue: CSV_QNAME, type: '#', autoNack: true, context: null, handler: insts.csv_handler_fn });
	} catch (e) {
		console.log(e);
		process.exit(1);
	}
}

module.exports = createRMQConn;
