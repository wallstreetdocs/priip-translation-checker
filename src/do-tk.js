
const libxmljs = require('libxmljs2');
const { EqualsError, Conditional } = require('./classes.js');

const doTk = (input, opts) => {

	/** @type {string} */
	const name = input.name;
	const id = input.translationKeyId;
	const text = input.text;

	const keyDoc = libxmljs.parseXmlString(text);

	const key = new Conditional(keyDoc.root(), null);

	let langs = Object.entries(input.languages).map(([lang, xml]) => {

		/** @type {Error} */
		let error;
		try {
			const langDoc = libxmljs.parseXmlString(xml);
			const out = new Conditional(langDoc.root(), lang);	
			key.equals(out);
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
				location: lang.error.key.getChainText(),
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
		languages
	};

}

module.exports.doTk = doTk;
