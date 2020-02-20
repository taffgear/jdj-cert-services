const moment = require('moment');

// NOTE:
// Possible better regex: (?<=String1 : )(.*)(?= String2 )

module.exports = {
	'Laspartners Multiweld': {
		text: {
			articleNumber: {
				regs: [
					'Machine No.:(.*)No-load voltage Uo',
					'Machine No :(.*)Open Voltage Uo',
					'Machine No.:(.*)Open Voltage Uo',
					'Machinenummer klant :(.*)Netspanning'
				]
			},
			serialNumber: {
				regs: [ 'Serial number :(.*)Machine No', 'Serienummer (.*)Machinenummer klant' ]
			},
			date: {
				regs: [
					'Date of Certificate:(.*)Autograph',
					'Date of certificate :(.*)Autograph',
					'Datum :(.*)Firma'
				],
				format: 'DD-M-YYYY'
			}
		}
	},
	LASPARTNERS: {
		text: {
			articleNumber: {
				regs: [ 'Machinenummer klant .(.*)Netspanning' ]
			},
			serialNumber: {
				regs: [ 'Machinenummer klant .(.*)Netspanning' ]
			},
			date: {
				regs: [ 'Datum(.*): J. de Jonge Lease BV' ],
				format: 'DD-MM-YYYY'
			}
		}
	},
	'Onafhankelijk Controle Bureel': {
		text: {
			articleNumber: {
				regs: [ 'Toestel/Install. ID:(.*)Plaats van onderzoek' ]
			},
			serialNumber: null,
			date: {
				regs: [ 'Datum van onderzoek:(.*)Periodiciteit' ],
				format: 'DD/MM/YYYY'
			}
		}
	},
	WERKBON: {
		text: {
			articleNumber: {
				regs: [ '/(.*)/' ]
			},
			serialNumber: null,
			date: {
				regs: [ 'Datum : (.*)Werkbonnummer' ],
				format: 'DD-MM-YYYY'
			}
		}
	},
	'Technics Trading & Calibration': {
		text: {
			articleNumber: {
				regs: [ 'Registratienummer:(.*)Naam klant' ]
			},
			serialNumber: null,
			date: {
				regs: [ 'Datum kalibratie:(.*)Datum afgifte' ],
				format: 'D-MM-YYYY'
			}
		}
	},
	'Nemad Maritime Safety': {},
	'Technisch Buro J. Verheij': {},
	MasTwin: {},
	'smit polyweb': {},
	BMWT: {}
};
