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
				regs: ['Serial number :(.*)Machine No', 'Serienummer (.*)Machinenummer klant']
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
				regs: ['Machinenummer klant .(.*)Netspanning']
			},
			serialNumber: {
				regs: ['Machinenummer klant .(.*)Netspanning']
			},
			date: {
				regs: ['Datum(.*): J. de Jonge Lease BV'],
				format: 'DD-MM-YYYY'
			}
		}
	},
	'onafhankelijk controle bureel': {
		text: {
			articleNumber: {
				regs: ['Toestel/Install. ID:(.*)Plaats van onderzoek']
			},
			serialNumber: null,
			date: {
				regs: ['Datum van onderzoek:(.*)Periodiciteit'],
				format: 'DD/MM/YYYY'
			}
		}
	},
	// werkbon: {
	// 	text: {
	// 		articleNumber: {
	// 			regs: [ '/(.*)/', 'Machinenummer klant :(.*)Netspanning' ]
	// 		},
	// 		serialNumber: null,
	// 		date: {
	// 			regs: [ 'Datum : (.*)Werkbonnummer' ],
	// 			format: 'DD-MM-YYYY'
	// 		}
	// 	}
	// },
	'technics trading & calibration': {
		text: {
			articleNumber: {
				regs: ['Registratienummer:(.*)Naam klant']
			},
			serialNumber: {
				regs: ['Serienummer:(.*)Adres']
			},
			date: {
				regs: ['Datum kalibratie:(.*)Datum afgifte'],
				format: 'D-MM-YYYY'
			}
		}
	},
	'technisch buro j. verheij': {
		text: {
			articleNumber: {
				regs: [
					'omschrijving(.*)identificatienummer',
					'Registratie merk \\(label\\):(.*)Registration mark'
				]
			},
			serialNumber: {
				regs: ['identificatienummer(.*)materiaal']
			},
			date: {
				regs: ['Datum(.*)Meetrapport', 'Date last inspection(.*)Toepassing'],
				format: ['DD-MM-YYYY', 'MM-YYYY']
			}
		}
	},
	mastwin: {
		text: {
			articleNumber: {
				regs: ['Bedrijfsnummer:(.*)Kenteken', 'Bedrijfs nummer:(.*)Bouwjaar']
			},
			serialNumber: {
				regs: ['Serienummer:(.*)Bedrijfsnummer', 'Serienummer:(.*)Merk']
			},
			date: {
				regs: ['Bouwjaar :(.*)1 Documenten', 'Inspectiedatum:(.*)Eigenaar'],
				format: ['DD-M-YYYY', 'D-M-YYYY']
			}
		}
	},
	'mas twin': {
		text: {
			articleNumber: {
				regs: ['Bedrijfs nummer:(.*)Bouwjaar']
			},
			serialNumber: {
				regs: ['Serienummer(.*)Merk']
			},
			date: {
				regs: ['Inspectiedatum:(.*)Type heftruck'],
				format: 'DD-MM-YYYY'
			}
		}
	},
	'nemad maritime safety': {
		text: {
			articleNumber: {
				regs: [
					'Certificate Nr.(.*)Ref. Nummer',
					'Ref. Nummer(.*)Name customer',
					'Certificate Nr.(.*)Name'
				]
			},
			serialNumber: null,
			date: {
				regs: ['Date Inspected:(.*)Next Service'],
				format: 'MM/YYYY'
			}
		}
	},
	'smit polyweb': {
		forceGoogleAPI: true,
		text: {
			articleNumber: {
				regs: [
					'Certificaat nummer \\(Certificate number\\)(.*)Hijsmiddel\\(en\\)',
					'Certificaat nummer \\(Certificate number\\)(.*)Hijsband\\(en\\)',
					'Certificaat nummer \\(Certificate number\\)(.*)Spanmiddel\\(en\\)',
					'Certificaat nummer \\(Certificate number\\)(.*)Valbeveiliging\\(en\\)',
					'Registratie nr \\(Distinguishing nr\\)(.*)Omschrijving',
					'Registratie nr \\(Distinguishing nr\\)(.*)Ondergetekende'
				]
			},
			serialNumber: null,
			date: {
				regs: [
					'Datum 1e beproeving \\(Date of 1st test\\)(.*)Leverings',
					'Datum 1e beproeving \\(Date of 1st test\\)(.*)Toepassing',
					'\\(Date of delivery/inspection\\)(.*)Leverancier',
					'\\(Signature of competent person\\)(.*)Inspecteren',
					'\\(Signature of competent person\\)(.*)Smit Polyweb'
				],
				format: ['DD-MM-YYYY', 'MM-YYYY']
			}
		}
	},
	albic: {
		text: {
			articleNumber: {
				regs: ['ID-nummer(.*)Merk']
			},
			serialNumber: null,
			date: {
				regs: ['Handtekening keurmeester:(.*)Naam keurmeester'],
				format: 'DD-MM-YYYY'
			}
		}
	},
	revin: {
		forceGoogleAPI: true,
		text: {
			articleNumber: {
				regs: ['Ref.klant(.*)/rep', '1A0001YDO2B(.*)Fabrikaat']
			},
			serialNumber: null,
			date: {
				regs: ['Datum(.*)Ref.klant', 'Ref. Revin(.*)REVIN'],
				format: 'DD-MM-YYYY'
			}
		}
	},
	roca: {
		text: {
			articleNumber: {
				regs: ['Barcode(.*)Productie']
			},
			serialNumber: null,
			date: {
				regs: ['Datum :(.*)Ron Campfens'],
				format: 'D MMMM YYYY'
			}
		}
	},
	'bw technologies': {
		text: {
			articleNumber: {
				regs: [
					'J. de Jonge Lease BV /(.*)Test Result',
					'J. de Jonge flowsystems B.V. /(.*)Test Result'
				]
			},
			serialNumber: {
				regs: ['Device Serial Number:(.*)Next Cal Due']
			},
			date: {
				regs: ['Calibration Test Certificate(.*)Device Serial Number'],
				format: 'YYYY-MM-DD HH:mm:ss'
			}
		}
	},
	hartwig: {
		text: {
			articleNumber: {
				regs: ['/ (.*)Date of Calibration']
			},
			serialNumber: {
				regs: ['Serial Number :(.*) /']
			},
			date: {
				regs: ['Date of Calibration :(.*)Calibration due'],
				format: 'DD-MM-YYYY'
			}
		}
	},
	BMWT: {}
};
