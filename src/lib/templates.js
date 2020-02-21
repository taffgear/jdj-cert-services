const moment = require('moment');

// NOTE:
// Possible better regex: (?<=String1 : )(.*)(?= String2 )

module.exports = {
	'laspartners multiweld': {
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
	laspartners: {
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
	'onafhankelijk controle bureel': {
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
	werkbon: {
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
	'technics trading & calibration': {
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
	'technisch buro j. verheij': {
		text: {
			articleNumber: {
				regs: [ 'omschrijving(.*)identificatienummer' ]
			},
			serialNumber: {
				regs: [ 'identificatienummer(.*)materiaal' ]
			},
			date: {
				regs: [ 'Datum(.*)Meetrapport' ],
				format: 'DD-MM-YYYY'
			}
		}
	},
	mastwin: {
		text: {
			articleNumber: {
				regs: [ 'Bedrijfsnummer:(.*)Kenteken' ]
			},
			serialNumber: {
				regs: [ 'Serienummer:(.*)Bedrijfsnummer' ]
			},
			date: {
				regs: [ 'Bouwjaar :(.*)1 Documenten' ],
				format: 'DD-M-YYYY'
			}
		}
	},
	'mas twin': {
		text: {
			articleNumber: {
				regs: [ 'Bedrijfs nummer:(.*)Bouwjaar' ]
			},
			serialNumber: {
				regs: [ 'Serienummer(.*)Merk' ]
			},
			date: {
				regs: [ 'Inspectiedatum:(.*)Type heftruck' ],
				format: 'DD-MM-YYYY'
			}
		}
	},
	'nemad maritime safety': {
		text: {
			articleNumber: {
				regs: [ 'Ref. Nummer(.*)Name customer' ]
			},
			serialNumber: null,
			date: {
				regs: [ 'Date Inspected:(.*)Next Service' ],
				format: 'MM/YYYY'
			}
		}
	},
	'smit polyweb': {
		forceGoogleAPI: true,
		text: {
			articleNumber: {
				regs: [ 'Registratie nr \\(Distinguishing nr\\)(.*)Omschrijving' ]
			},
			serialNumber: null,
			date: {
				regs: [ '\\(Date of delivery/inspection\\)(.*)Leverancier' ],
				format: 'MM-YYYY'
			}
		}
	},
	BMWT: {}
};
