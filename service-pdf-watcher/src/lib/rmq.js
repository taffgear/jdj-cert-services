const constants = require('../../../resources/constants');

const CMD_EXCH = constants.CMD_EXCH;
const DLX_EXCH = constants.DLX_EXCH;

module.exports = {
	exchanges: [
		{ name: DLX_EXCH, type: 'topic', persistent: true },
		{ name: CMD_EXCH, type: 'topic', persistent: true }
	]
};
