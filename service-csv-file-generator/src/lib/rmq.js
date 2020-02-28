const constants = require('../../../resources/constants');

const CMD_EXCH = constants.CMD_EXCH;
const DLX_EXCH = constants.DLX_EXCH;
const CSV_FILE_GENERATOR_QNAME = constants.CSV_FILE_GENERATOR_QNAME;
const DLX_QNAME = constants.DLX_QNAME;

module.exports = {
	exchanges: [
		{ name: DLX_EXCH, type: 'topic', persistent: true },
		{ name: CMD_EXCH, type: 'topic', persistent: true }
	],
	queues: [
		{ name: DLX_QNAME, durable: true, noAck: false },
		{
			name: CSV_FILE_GENERATOR_QNAME,
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
		{ exchange: CMD_EXCH, target: CSV_FILE_GENERATOR_QNAME, keys: [ constants.CSV_FILE_GENERATOR_BIND_KEY ] }
	]
};
