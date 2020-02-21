// const fs = require('fs');
const chokidar = require('chokidar');
const nconf = require('nconf');
const cnf = nconf.argv().env().file({ file: require('path').resolve(__dirname + '/../../config.json') });

const constants = require('../../resources/constants');

const CMD_EXCH = constants.CMD_EXCH;
const PDF_BIND_KEY = constants.PDF_BIND_KEY;
const AMQ_INSTANCE = constants.AMQ_INSTANCE;

const DEFAULT_WATCHER_SETTINGS = {
	persistent: true,
	ignoreInitial: true,
	followSymlinks: false,
	alwaysStat: false,
	depth: 0,
	ignorePermissionErrors: false,
	atomic: true,
	usePolling: true,
	awaitWriteFinish: {
		stabilityThreshold: 2000,
		pollInterval: 100
	}
};

async function run() {
	rabbot = await require('../../resources/rabbitmq')();

	const watcher = chokidar.watch(
		cnf.get('watchdir') + '.',
		Object.assign(DEFAULT_WATCHER_SETTINGS, {
			ignored: (path, stat) => {
				if (!stat) return false;

				if (
					path[path.length - 1] === '/' // don't ignore dirs
				)
					return true;

				return false;
			}
		})
	);

	watcher.on('error', (e) => {
		console.log('Watcher Error: ' + e.message);
	});
	watcher.on('ready', () =>
		watcher.on('add', (path) => {
			if (/.*[^.pdf,PDF]$/.test(path)) return false;

			rabbot.publish(
				CMD_EXCH,
				{ routingKey: PDF_BIND_KEY, body: { filename: path, test: false, debug: false } },
				[ AMQ_INSTANCE ]
			);
		})
	);
}

run();
