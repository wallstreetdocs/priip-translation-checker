
const staticData = require('./static-data.js');

const validateOptions = (opts) => {

	if (opts == null) {
		throw new Error(`Must pass an options variable to do translations checker, not ${opts}`);
	}

	const errors = [];

	let translationDataIsSpecified = false;
	if (opts.translationData != null) {
		translationDataIsSpecified = true;
		if (!Array.isArray(opts.translationData.data)) {
			throw new Error('Specified translation data did not have a key of "data" which was an array');
		}
	}

	if (translationDataIsSpecified) {
		// do nothing because not needed when translation data is specified
	} else if (typeof opts.origin !== 'string' || opts.origin === '') {
		errors.push(`Must havea a non-empty string as origin, not "${opts.origin}"`);
	}

	if (translationDataIsSpecified) {
		// do nothing because not needed when translation data is specified
	} else if (typeof opts.accessToken !== 'string' || opts.accessToken === '') {
		errors.push(`Must havea a non-empty string as accessToken, not "${opts.accessToken}"`);
	}

	if (translationDataIsSpecified) {
		// do nothing because not needed when translation data is specified
	} else if (!Array.isArray(opts.poolIds) || opts.poolIds.length === 0 || opts.poolIds.some(x => !Number.isInteger(x))) {
		errors.push(`Pool IDs must be specified as a non-empty array of integers, not "${Array.isArray(opts.poolIds) ? `[${opts.poolIds.join(', ')}]` : opts.poolIds}"`);
	}

	if (translationDataIsSpecified) {
		// do nothing because not needed when translation data is specified
	} else if (opts.filterTkNames == null) {
		// do nothing
	} else if (!Array.isArray(opts.filterTkNames) || opts.filterTkNames.length === 0 || opts.filterTkNames.some(x => typeof x !== 'string')) {
		errors.push(`If specified, Filter TK Names must be a non-empty array of strings, not "${Array.isArray(opts.filterTkNames) ? `[${opts.filterTkNames.join(', ')}]` : opts.filterTkNames}"`);
	}

	if (translationDataIsSpecified) {
		// do nothing because not needed when translation data is specified
	} else if (opts.filterTkIds == null) {
		// do nothing
	} else if (!Array.isArray(opts.filterTkIds) || opts.filterTkIds.length === 0 || opts.filterTkIds.some(x => !Number.isInteger(x))) {
		errors.push(`If specified, Filter TK IDs must be a non-empty array of integers, not "${Array.isArray(opts.filterTkIds) ? `[${opts.filterTkIds.join(', ')}]` : opts.filterTkIds}"`);
	}

	if (opts.langs == null) {
		// do nothing
	} else if (!Array.isArray(opts.langs) || opts.langs.length === 0 || opts.langs.some(x => typeof x !== 'string' || x.length !== 2)) {
		errors.push(`If specified, Languages must be a non-empty array of two-letter strings, not "${Array.isArray(opts.langs) ? `[${opts.langs.join(', ')}]` : opts.langs}"`);
	}

	if (opts.fileType !== 'json' && opts.fileType !== 'csv') {
		errors.push(`File type must be either "json" or "csv", not "${opts.fileType}"`);
	}

	if (typeof opts.showNonErrorsInJsonOutputAsNull !== 'boolean' && opts.showNonErrorsInJsonOutputAsNull != null) {
		errors.push(`If specified, the "Show non-errors in JSON output as null" must be a boolean, not "${opts.showNonErrorsInJsonOutputAsNull}"`);
	}

	if (opts.correctLang == null) {
		// do nothing
	} else if (typeof opts.correctLang !== 'string' || opts.correctLang.length !== 2) {
		errors.push(`The Correct Language firld must be a two-letter string, OR nullish to represent the master key, not "${opts.correctLang}"`);
	}

	if (typeof opts.ignoreFormatting !== 'boolean') {
		errors.push(`Ignore formatting must be a boolean, not "${opts.ignoreFormatting}"`);
	}

	if (opts.checkEditedSince == null) {
		// do nothing
	} else if (!(opts.checkEditedSince instanceof Date)) {
		errors.push(`If specified, "Check edited since" must be a date object`);
	}

	if (errors.length !== 0) {
		throw new Error(`Input failed validation with the following messages:\n${errors.join('\n')}`);
	}

}

const buildOptionsWithDefaults = (opts) => {

	opts = {...opts};

	if (opts.langs == null) {
		opts.langs = staticData.allLangs;
	}
	if (opts.correctLang && !opts.langs.includes(opts.correctLang)) {
		opts.langs = [opts.correctLang, ...opts.langs];
	}
	if (opts.cancellationToken == null) {
		opts.cancellationToken = {isCancellationRequested: false};
	}

	return opts;

}

module.exports.validateOptions = validateOptions;
module.exports.buildOptionsWithDefaults = buildOptionsWithDefaults;
