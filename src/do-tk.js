
const libxmljs = require('libxmljs2');
const { EqualsError, Conditional } = require('./classes.js');

const doTk = (input, opts) => {

	/** @type {string} */
	const name = input.name;
	const id = input.id;
	const poolId = input.poolId;
	const lastModified = input.lastModified;
	const correctXml = input.languages[opts.correctLang] ?? input.master;

	const correctDoc = libxmljs.parseXmlString(correctXml);

	const correct = new Conditional(correctDoc.root(), null, null, opts);

	let langs = Object.entries(input.languages).map(([lang, xml]) => {

		/** @type {Error} */
		let error;
		try {
			if (xml == null) {
				throw new EqualsError(correct, lang, 'Translation was empty');
			}
			const langDoc = libxmljs.parseXmlString(xml);
			const out = new Conditional(langDoc.root(), lang, null, opts);
			correct.equals(out);
		} catch (e) {
			if (e instanceof EqualsError) {
				error = e;
			} else {
				error = new Error('Error doing TK lang');
				error.cause = e;
				error.lang = lang;
				error.input = input;
			}
		}

		return {
			lang,
			error
		}

	});

	if (!opts.showNonErrors) {
		langs = langs.filter(x => x.error != null);
	}

	const languages = Object.fromEntries(langs.map((lang) => {
		const key = lang.lang;
		if (lang.error == null) {
			return [key, null];
		}
		if (lang.error instanceof EqualsError) {
			return [key, {
				message: lang.error.message,
				location: lang.error.correct.getChainText(),
			}];
		}
		return [key, {
			message: lang.error.message,
			input: lang.error.input
		}];
	}));

	return {
		name,
		id,
		poolId,
		lastModified,
		languages,
	};

}

module.exports.doTk = doTk;
