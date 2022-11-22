
const fs = require('fs');
const { doTk } = require('./do-tk.js');
const { getAllTks } = require('./get-all-tks.js');
const { save } = require('./save.js');

const allLangs = ['BG', 'HR', 'CS', 'DA', 'NL', 'EN', 'ET', 'FI', 'FR', 'DE', 'EL', 'HU', 'IT', 'LT', 'NO', 'PL', 'PT', 'RO', 'RU', 'SK', 'SL', 'ES', 'SV', 'SE'];

/**
 * 
 * @param {object} opts Options
 * @param {string} opts.readFromFile Read the input from a JSON output file instead of doing calls to PriipCloud. Useful for mapping to CSV output
 * @param {number[]} opts.poolIds The pool IDs to search through for keys
 * @param {string} opts.outputPath The file to save the output to, can either either a ".json" extension or a ".csv" extension
 * @param {string} opts.accessToken Access token to use for calling the server
 * @param {boolean} opts.showNonErrors Show "nulls" in the JSON output
 * @param {null|string[]} opts.langs An array of the language keys you want to find, leave nullish for all
 * @param {null|string[]} opts.filterTkNames An array of the TK names you want to find, leave nullish for all
 * @param {null|number[]} opts.filterTkIds An array of the TK IDs you want to find, leave nullish for all
 * @param {string} opts.origin The origin to use for PriipCloud
 * @param {string} opts.correctLang The language to use as "correct" to compare the other languages against. Leave nullish to use master
 * @param {boolean} opts.ignoreFormatting Whether to ignore formatting tags in comparison
 * @param {{isCancellationRequested: boolean}} opts.cancellationToken The origin to use for PriipCloud
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
	if (opts.correctLang && !opts.langs.includes(opts.correctLang)) {
		opts.langs = [opts.correctLang, ...opts.langs];
	}
	if (opts.cancellationToken == null) {
		opts.cancellationToken = {isCancellationRequested: false};
	}

	if (opts.readFromFile) {
		return JSON.parse(await fs.promises.readFile(opts.readFromFile, 'utf-8'));
	}

	try {

		let out = [];

		await getAllTks(opts, (input) => {
			out.push(doTk(input, opts));
		});

		if (opts.cancellationToken.isCancellationRequested) {
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

		opts.cancellationToken.isCancellationRequested = true;

		throw err;

	}

}

module.exports.checkTranslations = checkTranslations;
