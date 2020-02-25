const path = require('path');
const moment = require('moment');
const { isArray, union } = require('lodash');
const nconf = require('nconf');
const cnf = nconf.argv().env().file({ file: path.resolve(__dirname + '/../../../config.json') });

const templates = require('./templates');
const articleNumberReg = /^([a-zA-Z0-9]){3,20}$/;
const dateFormatSeperators = [ '-', '/', '.' ];
const DEFAULT_CERTIFICATE_IDENTIFIERS = [
	'certificaat',
	'onderhoudsrapport',
	'certificate',
	'inspectierapport',
	'meetrapport',
	'checklist'
];
const CERTIFICATE_BLACK_LIST = [ 'certificaat.lease@jdejonge.nl' ];
const certificateIdentifiers = union(DEFAULT_CERTIFICATE_IDENTIFIERS, cnf.get('certificateIdentifiers'));
const certificateBlackList = union(CERTIFICATE_BLACK_LIST, cnf.get('certificateBlackList'));

moment.locale('nl');

/**
 * 
 * Find template type using list of templates
 * 
 * @param {String} txt 
 */
function isCertificate(txt) {
	if (!txt) return null;

	// remove new lines from text
	const str = txt.replace(/(\r\n|\n|\r)/gm, ' ').toLocaleLowerCase();

	const isCert = certificateIdentifiers.reduce((acc, i) => {
		if (acc) return acc;
		if (str.indexOf(i) >= 0) acc = true;
		return acc;
	}, false);

	if (!isCert) return false;

	return certificateBlackList.reduce((acc, i) => {
		if (!acc) return acc;
		if (str.indexOf(i) >= 0) acc = false;
		return acc;
	}, true);
}

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

const extractDate = (str, formats) =>
	formats.reduce((list, format) => {
		if (list) return list;

		// if formats do not match, skip
		let skip = false;
		dateFormatSeperators.forEach((sep) => {
			if (format.indexOf(sep) > 0 && str.indexOf(sep) < 0) skip = true;
		});

		if (skip) return list;

		const m = moment(str.trim(), format);

		// if we have a valid date, format it
		if (m.isValid()) list = m.format('YYYY-MM-DD');
		return list;
	}, null);

/**
 * 
 * Extract specific field from document text using template field positions
 * 
 * @param {String} k 
 * @param {*Array} regs 
 * @param {*String} str 
 */
const tryRegs = (k, cnf, str) =>
	cnf.regs.reduce((acc, re) => {
		if (acc) return acc;

		const matches = str.match(re);

		if (!matches || matches.length < 2) return acc;

		// if we have a result, even if there is a lot of text
		// moment.js is smart enough to extract the date if a format is given.
		// but we still have to validate it.

		if (k === 'date') {
			let date;
			const dateFormats = isArray(cnf.format) ? cnf.format : [ cnf.format ];

			// result contains more then just our date
			if (matches[1].length > 16) {
				// split on space and try each part
				const parts = matches[1].split(' ');

				date = parts.reduce((list, d) => {
					if (list) return list;
					list = extractDate(d, dateFormats);
					return list;
				}, null);
			} else {
				date = extractDate(matches[1], dateFormats);
			}

			if (date) acc = date;

			return acc;
		}

		if (k === 'articleNumber' && matches[1].length < 25) {
			// remove spaces

			// TODO: test regex!!!
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
		const parts = matches[1].split(' ').filter((v) => v !== '');
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
		const result = tryRegs(k, cnf, str);

		if (!result) return acc;

		acc[k] = result;

		return acc;
	}, {});
}

module.exports = {
	getTemplateType,
	getData,
	isCertificate
};
