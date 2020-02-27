// const fs = require('fs');
const chokidar = require('chokidar');
const nconf = require('nconf');
const cnf = nconf.argv().env().file({ file: require('path').resolve(__dirname + '/../../config.json') });

const constants = require('../../resources/constants');

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
	rabbot = await require('../../resources/rabbitmq')(require('./lib/rmq'));

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
			watcher.unwatch(path);

			if (/.*[^.pdf,PDF]$/.test(path)) return false;

			console.log(path);

			rabbot.publish(
				constants.CMD_EXCH,
				{
					routingKey: constants.PDF_READ_BIND_KEY,
					body: { filename: path, test: false, debug: false }
				},
				[ constants.AMQ_INSTANCE ]
			);
		})
	);
}

run();
