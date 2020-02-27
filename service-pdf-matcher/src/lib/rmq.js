const constants = require('../../../resources/constants');

const CMD_EXCH = constants.CMD_EXCH;
const DLX_EXCH = constants.DLX_EXCH;
const PDF_MATCH_QNAME = constants.PDF_MATCH_QNAME;
const DLX_QNAME = constants.DLX_QNAME;

module.exports = {
	exchanges: [
		{ name: DLX_EXCH, type: 'topic', persistent: true },
		{ name: CMD_EXCH, type: 'topic', persistent: true }
	],
	queues: [
		{ name: DLX_QNAME, durable: true, noAck: false },
		{
			name: PDF_MATCH_QNAME,
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
		{ exchange: CMD_EXCH, target: PDF_MATCH_QNAME, keys: [ constants.PDF_MATCH_BIND_KEY ] }
	]
};
