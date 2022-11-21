
const fs = require('fs');
const { doTk } = require('./do-tk.js');
const { getAllTks } = require('./get-all-tks.js');
const { save } = require('./save.js');

const allLangs = ['BR', 'BG', 'HR', 'CS', 'DA', 'NL', 'EN', 'ET', 'FI', 'FR', 'DE', 'DECOBA', 'EL', 'HU', 'IT', 'LT', 'NO', 'PL', 'PT', 'RO', 'RU', 'SK', 'SL', 'ES', 'SV', 'SE'];

/**
 * 
 * @param {object} opts Options
 * @param {string} opts.readFromFile Read the input from a JSON output file instead of doing calls to PriipCloud. Useful for mapping to CSV output
 * @param {string} opts.outputPath The file to save the output to
 * @param {string} opts.accessToken Access token to use for calling the server
 * @param {boolean} opts.showNonErrors Show "nulls" in the JSON output
 * @param {null|string[]} opts.langs An array of the language keys you want to find, leave nullish for all
 * @param {null|string[]} opts.filterTkNames An array of the TK names you find to find, leave nullish for all
 * @param {string} opts.origin The origin to use for PriipCloud
 * @param {{isCancellationRequest: boolean}} opts.cancellationToken The origin to use for PriipCloud
 * @returns 
 */
const checkTranslations = async (opts) => {

	if (opts == null) {
		opts = {};
	} else {
		opts = {...opts};
	}
	if (opts.langs == null) {
		opts.langs = allLangs;
	}
	if (opts.cancellationToken == null) {
		opts.cancellationToken = {isCancellationRequest: false};
	}

	if (opts.readFromFile) {
		return JSON.parse(await fs.promises.readFile(opts.readFromFile, 'utf-8'));
	}

	try {

		let out = [];

		await getAllTks(opts, (input) => {
			out.push(doTk(input, opts));
		});

		if (opts.cancellationToken.isCancellationRequest) {
			return;
		}

		if (!opts.showNonErrors) {
			out = out.filter(x => Object.keys(x.languages).length !== 0);
		}

		out.sort((a, b) => a.name.localeCompare(b.name));

		const output = Object.fromEntries(out.map((item) => ([item.name, item])));

		await save(output, opts);

		return output;

	} catch (err) {

		opts.cancellationToken.isCancellationRequest = true;

		throw err;

	}

}

module.exports.checkTranslations = checkTranslations;
