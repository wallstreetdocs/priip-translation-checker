
const { createArrayCsvStringifier } = require('csv-writer');

const getOutput = async (data, opts) => {

	switch (opts.fileType) {
		case 'csv': {
			const csvWriter = createArrayCsvStringifier({});
			const csv = Object.values(data.keys).map((key) => {
				const row = opts.langs.map((lang) => {
					const result = key.languages[lang];
					if (result == null) {
						return '';
					}
					return `${result.location} | ${result.message}`;
				});
				const modified = new Date(key.lastModified).toISOString();
				return [key.poolId, key.id, key.name, modified, ...row];
			});
			csv.unshift(['Pool', 'ID', 'Name', 'Last Modified', ...opts.langs]);
			csv.push([]);
			csv.push(['Correct:', data.correctLang || 'Master']);
			return {
				type: 'csv',
				data: csvWriter.stringifyRecords(csv)
			};
		}
		case 'json': {
			return {
				type: 'json',
				data: JSON.stringify(data)
			};
		}
	}

	if (opts.fileType !== 'json') {
		console.warn(`${opts.fileType} was not a recognised output type, so saving as JSON instead`);
	}
	return {
		type: 'json',
		data: JSON.stringify(data)
	};

}

module.exports.getOutput = getOutput;
