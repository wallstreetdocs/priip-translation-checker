
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
				header: ['', ...langs],
				path: savePath
			});
			const csv = Object.values(data).map((data) => {
				const row = langs.map((lang) => {
					const result = data.languages[lang];
					if (result == null) {
						return '';
					}
					return `${result.location} | ${result.message}`;
				});
				return [data.name, ...row];
				
			});
			return csvWriter.writeRecords(csv);
		}
		case '.json': {
			return fs.promises.writeFile(savePath, JSON.stringify(data), 'utf-8');
		}
		default: {
			console.warn(`${outputType} was not a recognised output type, so saving as CSV instead`);
			return fs.promises.writeFile(savePath, JSON.stringify(data), 'utf-8');
		}
	}

}

module.exports.save = save;
