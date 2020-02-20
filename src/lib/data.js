const moment = require('moment');
const templates = require('./templates');

function getTemplateType(txt) {
	const str = txt.replace(/(\r\n|\n|\r)/gm, ' ');
	return Object.keys(templates).reduce((acc, t) => {
		if (acc) return acc;
		if (str.indexOf(t) >= 0) acc = t;

		return acc;
	}, null);
}

function getData(txt, type) {
	if (!templates || !type || !templates[type] || !txt) return null;

	const settings = templates[type];

	if (!settings.text) return null;

	return Object.keys(settings.text).reduce((acc, k) => {
		const cnf = settings.text[k];

		if (!cnf || !cnf.positions) return acc;

		const result = cnf.positions.reduce((acc, o) => {
			if (acc) return acc;

			const matches = txt.replace(/(\r\n|\n|\r)/gm, ' ').match(o.start + '(.*)' + o.end);

			if (k === 'date' && matches && matches.length > 1) {
				acc = matches[1];
				return acc;
			}

			if (!matches || matches.length < 1 || matches[1].length > 30) return acc;

			acc = matches[1].trim();

			return acc;
		}, null);

		if (!result) return acc;

		acc[k] = result;

		if (k !== 'date') return acc;

		const m = moment(acc[k], cnf.format);
		if (m.isValid()) acc[k] = m.format('YYYY-MM-DD');

		return acc;
	}, {});
}

module.exports = {
	getTemplateType,
	getData
};
