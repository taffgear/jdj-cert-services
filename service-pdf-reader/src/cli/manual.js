const filename = process.env.FILE || null;
const test = process.env.TEST || false; // provide url to txt file
const debug = process.env.DEBUG || false;

async function run() {
	require('../handlers/pdf')({ body: { filename, test, debug } }, false);
}

run();
