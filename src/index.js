
const { doTk } = require('./do-tk.js');
const { getAllTks } = require('./get-all-tks.js');
const { getOutput } = require('./save.js');
const { buildOptionsWithDefaults, validateOptions } = require('./validate-options.js');

/**
 * Run the translation checker for a set of given options. Option descriptions that end in an asterisk are ignored when opts.translationData is specified
 * @param {object} opts Options
 * @param {number[]} opts.poolIds The pool IDs to search through for keys *
 * @param {string} opts.accessToken Access token to use for calling the server *
 * @param {boolean} opts.showNonErrorsInJsonOutputAsNull Show "nulls" in the JSON output
 * @param {null|string[]} opts.langs An array of the language keys you want to find, leave nullish for all
 * @param {null|string[]} opts.filterTkNames An array of the TK names you want to find, leave nullish for all *
 * @param {null|number[]} opts.filterTkIds An array of the TK IDs you want to find, leave nullish for all *
 * @param {string} opts.origin The origin to use for PriipCloud *
 * @param {string} opts.correctLang The language to use as "correct" to compare the other languages against. Leave nullish to use master
 * @param {boolean} opts.ignoreFormatting Whether to ignore formatting tags in comparison
 * @param {boolean} opts.translationData A cached version of the data which can be parsed to skip the fetching of data from PriipCloud
 * @param {boolean} opts.outputEncoding The encoding to use for the output buffer. Leave null to get output as a string
 * @param {{isCancellationRequested: boolean}} opts.cancellationToken A cancellation token to abort the current request
 * @returns {Promise<Buffer|string>} 
 */
const checkTranslations = async (opts) => {

	validateOptions(opts);
	opts = buildOptionsWithDefaults(opts);

	try {

		let out = [];

		if (opts.translationData) {
			for (const data of opts.translationData.data) {
				out.push(doTk(data, opts));
			}
		} else {
			await getAllTks(opts, (input) => {
				out.push(doTk(input, opts));
			});
		}

		if (opts.cancellationToken.isCancellationRequested) {
			return;
		}

		if (!opts.showNonErrorsInJsonOutputAsNull) {
			out = out.filter(x => Object.keys(x.languages).length !== 0);
		}

		out.sort((a, b) => a.name.localeCompare(b.name));

		const output = {
			correctLang: opts.correctLang,
			keys: Object.fromEntries(out.map((item) => ([item.name, item]))),
		};

		return await getOutput(output, opts);

	} catch (err) {

		opts.cancellationToken.isCancellationRequested = true;

		throw err;

	}

}

const getTranslationData = async (opts) => {

	opts = {
		origin: opts?.origin,
		accessToken: opts?.accessToken,
		poolIds: opts?.poolIds,
		filterTkIds: opts?.filterTkIds,
	};

	opts = buildOptionsWithDefaults(opts);

	try {

		const data = [];

		await getAllTks(opts, (input) => {
			data.push(input);
		});

		return {data};

	} catch (err) {

		opts.cancellationToken.isCancellationRequested = true;

		throw err;

	}

}

module.exports.checkTranslations = checkTranslations;
module.exports.getTranslationData = getTranslationData;
