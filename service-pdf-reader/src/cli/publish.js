const constants = require('../../../resources/constants');

const CMD_EXCH = constants.CMD_EXCH;
const PDF_BIND_KEY = constants.PDF_BIND_KEY;
const AMQ_INSTANCE = constants.AMQ_INSTANCE;

const filename = process.env.FILE || null;
const test = process.env.TEST || false; // provide url to txt file
const debug = process.env.DEBUG || false;
const folder = process.env.FOLDER || false;

const single = async () => {
	rabbot = await require('../../../resources/rabbitmq')(require('../../../service-pdf-watcher/src/lib/rmq'));

	const body = { filename, test, debug };

	try {
		await rabbot.publish(CMD_EXCH, { routingKey: PDF_BIND_KEY, body }, [ AMQ_INSTANCE ]);
		console.log(`Published message: ${JSON.stringify(body, null, 2)} to ${CMD_EXCH} with rk: ${PDF_BIND_KEY}`);
	} catch (e) {
		console.log(e);
	}

	process.exit(0);
};

if (!folder && (filename || test)) single();
