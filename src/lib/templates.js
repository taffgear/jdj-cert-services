const moment = require('moment');

module.exports = {
	'Laspartners Multiweld': {
		text: {
			articleNumber: {
				positions: [
					{
						start: 'Machine No.:',
						end: 'No-load voltage Uo'
					},
					{
						start: 'Machine No :',
						end: 'Open Voltage Uo'
					},
					{
						start: 'Machine No.:',
						end: 'Open Voltage Uo'
					}
				]
			},
			serialNumber: {
				positions: [
					{
						start: 'Serial number :',
						end: 'Machine No'
					},
					{
						start: 'Serienummer ',
						end: 'Machinenummer klant'
					}
				]
			},
			date: {
				positions: [
					{
						start: 'Date of Certificate:',
						end: 'Autograph'
					},
					{
						start: 'Date of certificate :',
						end: 'Autograph'
					}
				],
				format: 'DD-M-YYYY'
			}
		}
	},
	LASPARTNERS: {
		text: {
			articleNumber: {
				positions: [
					{
						start: 'Machinenummer klant .',
						end: 'Netspanning'
					}
				]
			},
			serialNumber: {
				positions: [
					{
						start: 'Machinenummer klant .',
						end: 'Netspanning'
					}
				]
			},
			date: {
				positions: [
					{
						start: 'Datum',
						end: ': J. de Jonge Lease BV'
					}
				],
				format: 'DD-MM-YYYY'
			}
		}
	},
	'Onafhankelijk Controle Bureel': {
		text: {
			articleNumber: {
				positions: [
					{
						start: 'Toestel/Install. ID:',
						end: 'Plaats van onderzoek'
					}
				]
			},
			serialNumber: null,
			date: {
				positions: [
					{
						start: 'Datum van onderzoek:',
						end: 'Periodiciteit'
					}
				],
				format: 'DD/MM/YYYY'
			}
		}
	},
	WERKBON: {
		text: {
			articleNumber: {
				positions: [
					{
						start: 'REP5540/',
						end: '/RL Debiteur'
					}
				]
			},
			serialNumber: null,
			date: {
				positions: [
					{
						start: 'Datum : ',
						end: 'Werkbonnummer'
					}
				],
				format: 'DD-MM-YYYY'
			}
		}
	},
	'Nemad Maritime Safety': {},
	'Technisch Buro J. Verheij': {},
	MasTwin: {},
	'smit polyweb': {},
	'Technics Trading & Calibration': {
		text: {
			articleNumber: {
				positions: [
					{
						start: 'Registratienummer:',
						end: 'Naam klant'
					}
				]
			},
			serialNumber: null,
			date: {
				positions: [
					{
						start: 'Datum kalibratie:',
						end: 'Datum afgifte'
					}
				],
				format: 'D-MM-YYYY'
			}
		}
	},
	BMWT: {}
};
