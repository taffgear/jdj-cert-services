const path = require('path');
const rabbot = require('rabbot');
const nconf = require('nconf');
const cnf = nconf.argv().env().file({ file: path.resolve(__dirname + '/../config.json') });

const constants = require('./constants');
const AMQ_INSTANCE = constants.AMQ_INSTANCE;

async function createRMQConn(config) {
	try {
		await rabbot.configure(
			Object.assign(
				{
					connection: {
						name: AMQ_INSTANCE,
						user: cnf.get('rabbot:user'),
						pass: cnf.get('rabbot:pass'),
						host: cnf.get('rabbot:host'),
						port: 5672,
						vhost: '%2f'
					}
				},
				config
			)
		);

		return rabbot;
	} catch (e) {
		console.log(e);
		process.exit(1);
	}
}

module.exports = createRMQConn;
