const fs = require('fs');
const path = require('path');
const fsPath = require('fs-path');
const nconf = require('nconf');
const cnf = nconf.argv().env().file({ file: require('path').resolve(__dirname + '/../../../config.json') });

async function copyPDFToFailedFolder(filepath) {
	const filename = `${cnf.get('pdfDirFailed')}${path.parse(filepath).base}`;

	try {
		return new Promise(async (resolve, reject) => {
			fsPath.copy(filepath, filename, (err) => {
				if (err) return reject(err);

				return resolve(true);
			});
		});
	} catch (e) {
		console.log(e);
		return false;
	}
}

module.exports = async function(msg, rejectable = true) {
	console.log(msg.body);

	if (!msg.body.success && fs.existsSync(msg.body.filepath)) await copyPDFToFailedFolder(msg.body.filepath);

	// remove file from watchdir
	if (fs.existsSync(msg.body.filepath)) fs.unlinkSync(msg.body.filepath);

	if (rejectable) msg.ack();
};
