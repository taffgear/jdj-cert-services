const io = require('socket.io')();
const socketioJwt = require('socketio-jwt');
const nconf = require('nconf');
const Redis = require('ioredis');

const cnf = nconf.argv().env().file({ file: require('path').resolve(__dirname + '/../../config.json') });
const constants = require('../../resources/constants');
const clients = [];

async function run() {
	const redis = new Redis();
	const rabbot = await require('../../resources/rabbitmq')(require('./lib/rmq'));

	io
		.on(
			'connection',
			socketioJwt.authorize({
				secret: cnf.get('jwt_secret'),
				timeout: 15000 // 15 seconds to send the authentication message
			})
		)
		.on('authenticated', function (client) {
			clients.push(client);

			client.on('disconnect', () => {
				clients.splice(clients.indexOf(client), 1);
			});
		})
		.on('unauthorized', function (msg) {
			throw new Error(msg.data.type);
		});

	const port = cnf.get('server:port') || 8000;
	io.listen(port);

	console.log('socket.io server listening on port %s', port);

	rabbot.handle({
		queue: constants.PDF_WRAPUP_QNAME,
		type: '#',
		autoNack: true,
		context: null,
		handler: require('./handlers/wrapup').bind({ rabbot, clients, redis })
	});

	console.log('service-pdf-wrapup running...');
}

run();
