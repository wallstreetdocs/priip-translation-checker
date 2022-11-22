
const fs = require('fs');
const path = require('path');
const { createArrayCsvWriter } = require('csv-writer');

const save = (data, opts) => {

	const savePath = opts.outputPath;

	if (!savePath) {
		return;
	}

	const outputType = path.extname(savePath);

	switch (outputType) {
		case '.csv': {
			const csvWriter = createArrayCsvWriter({
				header: ['Pool', 'ID', 'Name', 'Last Modified', ...opts.langs],
				path: savePath
			});
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
			csv.push([], ['Correct:', data.correctLang ?? 'Master']);
			return csvWriter.writeRecords(csv);
		}
		case '.json': {
			return fs.promises.writeFile(savePath, JSON.stringify(data), 'utf-8');
		}
		default: {
			if (outputType !== '.json') {
				console.warn(`${outputType} was not a recognised output type, so saving as CSV instead`);
			}
			return fs.promises.writeFile(savePath, JSON.stringify(data), 'utf-8');
		}
	}

}

module.exports.save = save;
