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

		if (!cnf || !cnf.start) return acc;

		const matches = txt.replace(/(\r\n|\n|\r)/gm, ' ').match(cnf.start + '(.*)' + cnf.end);

		if (!matches || matches.length < 1 || matches[1].length > 30) {
			if (!cnf.fallback) return acc;

			const flb = cnf.fallback.reduce((acc, fn) => {
				if (typeof fn !== 'function' || acc) return acc;

				acc = fn(txt);
				return acc;
			}, null);

			if (flb) acc[k] = flb;
			return acc;
		}

		if (cnf.get && typeof cnf.get === 'function') acc[k] = cnf.get(matches[1]);
		else acc[k] = matches[1].trim();

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
