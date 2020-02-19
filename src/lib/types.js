module.exports = {
	'Laspartners Multiweld': {
		text: {
			articleNumber: {
				start: 'Machine No.:',
				end: 'No-load voltage Uo',
				fallback: (str) => {
					const matches = str
						.replace(/(\r\n|\n|\r)/gm, ' ')
						.match('Open Voltage Uo(.*)Machine range');
					if (!matches || matches.length < 1) return null;

					const res = matches[1].trim().split(':');

					if (!res || res.length < 2) return null;
					return res[1].trim();
				}
			},
			serialNumber: {
				start: 'Serial number :',
				end: 'Machine No.:',
				fallback: (str) => {
					const matches = str.replace(/(\r\n|\n|\r)/gm, ' ').match('Serial number(.*)Machine No');
					if (!matches || matches.length < 1) return null;

					const res = matches[1].trim().split(':');

					if (!res || res.length < 2) return null;

					const line = res[2];
					const lines = line.split(' ');

					if (!lines || !lines.length) return null;

					return lines[1].trim();
				}
			},
			date: {
				start: 'Date of Certificate:',
				end: 'Autograph',
				format: 'DD-M-YYYY',
				fallback: (str) => {
					// sample: : 10-07-2019
					const matches = str
						.replace(/(\r\n|\n|\r)/gm, ' ')
						.match('Date of certificate(.*)Autograph');

					if (!matches || matches.length < 1) return null;

					const res = matches[1].trim().split(':');
					if (!res || res.length < 2) return null;
					return res[1].trim();
				}
			}
		}
	},
	'LASPARTNERS MULTIWELD': {
		text: {
			articleNumber: {
				start: 'Machinenummer klant .',
				end: 'Netspanning',
				get: (str) => {
					// sample: 85-043681 : 09MPLS0013
					const res = str.trim().split(':');
					if (!res || res.length < 2) return null;
					return res[1].trim();
				}
			},
			serialNumber: {
				start: 'Machinenummer klant .',
				end: 'Netspanning',
				get: (str) => {
					// sample: 85-043681 : 09MPLS0013
					const res = str.trim().split(':');
					if (!res || res.length < 2) return null;
					return res[0].trim();
				}
			},
			date: {
				start: 'Datum',
				end: ': J. de Jonge Lease BV',
				format: 'DD-MM-YYYY'
			}
		}
	},
	'Onafhankelijk Controle Bureel': {
		text: {
			articleNumber: {
				start: 'Toestel/Install. ID:',
				end: 'Plaats van onderzoek'
			},
			serialNumber: null,
			date: {
				start: 'Datum van onderzoek:',
				end: 'Aard onderzoek',
				format: 'DD/MM/YYYY'
			}
		}
	},
	'Nemad Maritime Safety': {},
	'Technisch Buro J. Verheij': {},
	MasTwin: {},
	'smit polyweb': {},
	'Technics Trading & Calibration': {},
	BMWT: {}
};
