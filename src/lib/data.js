const moment = require('moment');
const templates = require('./templates');
const articleNumberReg = /^([a-zA-Z0-9]){3,20}$/;

/**
 * 
 * Find template type using list of templates
 * 
 * @param {String} txt 
 */
function getTemplateType(txt) {
	if (!txt) return null;

	// remove new lines from text
	const str = txt.replace(/(\r\n|\n|\r)/gm, ' ').toLocaleLowerCase();

	return Object.keys(templates).reduce((acc, t) => {
		if (acc) return acc;
		if (str.indexOf(t) >= 0) acc = t;

		return acc;
	}, null);
}

/**
 * 
 * Extract specific field from document text using template field positions
 * 
 * @param {String} k 
 * @param {*Array} regs 
 * @param {*String} str 
 */
const tryRegs = (k, regs, str) =>
	regs.reduce((acc, re) => {
		if (acc) return acc;

		const matches = str.match(re);

		if (!matches || matches.length < 2) return acc;

		// if we have a result, even if there is a lot of text
		// moment.js is smart enough to extract the date if a format is given.
		if (k === 'date') {
			acc = matches[1];
			return acc;
		}

		if (k === 'articleNumber' && matches[1].length < 25) {
			// remove spaces
			acc = matches[1].replace(/\s/g, '').trim();
			return acc;
		}

		// We have no regex for serial numbers and the string length is to large for a correct match.
		// TODO: check max size serial number
		if (matches[1].length > 25 && k === 'serialNumber') return acc;
		else if (matches[1].length <= 25) {
			acc = matches[1].trim();
			return acc;
		}

		// try regex to find article number
		const parts = matches[1].split(' ');
		if (!parts || !parts.length) return acc;

		// use first part of string
		const numbers = parts[0].match(articleNumberReg);
		if (numbers && numbers.length) {
			acc = numbers[0].trim();
			return acc;
		}

		return acc;
	}, null);

/**
 * 
 * Extract fields from document text using specific template
 * 
 * @param {*String} txt 
 * @param {*String} type 
 */
function getData(txt, type) {
	if (!templates || !type || !templates[type] || !txt) return null;

	const settings = templates[type];

	if (!settings.text) return null;

	// remove new lines from text
	const str = txt.replace(/(\r\n|\n|\r)/gm, ' ');

	// get value for each field in text object (articleNumber, serialNumber, date)
	// and return object with fieldname as key.
	return Object.keys(settings.text).reduce((acc, k) => {
		const cnf = settings.text[k];

		if (!cnf || !cnf.regs) return acc;

		// try each field position set (text between String X and String Y)
		const result = tryRegs(k, cnf.regs, str);

		if (!result) return acc;

		acc[k] = result;

		if (k !== 'date') return acc;

		// parse date and format
		const m = moment(acc[k], cnf.format);
		if (m.isValid()) acc[k] = m.format('YYYY-MM-DD');

		return acc;
	}, {});
}

module.exports = {
	getTemplateType,
	getData
};
