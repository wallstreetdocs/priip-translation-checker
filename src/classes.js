
const libxmljs = require('libxmljs2');

class EqualsError extends Error {

	/**
	 * 
	 * @param {Item} correct 
	 * @param {Item} lang 
	 * @param {string} message 
	 */
	constructor(correct, lang, message) {

		super(message);

		this.correct = correct;
		this.lang = lang;

	}

}

class Item {

	/**
	 * 
	 * @param {libxmljs.Element} el 
	 * @param {string} lang 
	 * @param {Conditional} parent 
	 */
	constructor(el, lang, parent, opts) {

		this.el = el;
		this.lang = lang;
		this.parent = parent;
		this.opts = opts;

	}

	/**
	 * 
	 * @returns {(Conditional|Display)[]} 
	 */
	getChain() {

		if (this.parent == null) {
			return [this];
		}

		const chain = this.parent.getChain();

		chain.push(this);

		return chain;

	}

	getChainText() {

		const chain = this.getChain();

		return chain.map(item => item.id || 'ROOT').join('->');

	}

	/**
	 * 
	 * @param {Item} a 
	 * @param {Item} b 
	 */
	static sort(a, b) {
		if (a.lang == null && b.lang != null) {
			return {correct: a, lang: b};
		}
		if (b.lang == null && a.lang != null) {
			return {correct: b, lang: a};
		}
		throw new Error('Could not sort out the two items');
	}

	/**
	 * 
	 * @param {libxmljs.Element} el 
	 */
	static getNodeType(el) {

		if (!(el instanceof libxmljs.Element)) {
			return;
		}

		if (typeof el.name === 'function' && el.name() === 'wsd-basicconditional') {
			return 'conditional';
		}
			

		if (el.childNodes().length === 0) {
			return;
		}

		if (typeof el.name === 'function') {
			const name = el.name();
			if (typeof name === 'string' && name.startsWith('wsd-')) {

			}
			return 'display';
		}

		return 'formatting';

	}

}

class Parent extends Item {

	/**
	 * 
	 * @param {libxmljs.Element} el 
	 * @param {string} lang 
	 * @param {Conditional} parent 
	 */
	constructor(el, lang, parent, opts) {

		super(el, lang, parent, opts);

		/** @type {Item[]} */
		this.children = [];

		function* childGenerator(el) {
			for (const child of el.childNodes()) {
				if (opts.ignoreFormatting && Item.getNodeType(child) === 'formatting') {
					const newIterator = childGenerator(child);
					yield* newIterator;
				} else {
					yield child;
				}
			}
		}

		for (const child of childGenerator(el)) {

			switch (Item.getNodeType(child)) {
				case 'display':
					this.children.push(new Display(child, this.lang, this, this.opts));
					break;
				case 'conditional':
					this.children.push(new Conditional(child, this.lang, this, this.opts));
					break;
				case 'formatting':
					this.children.push(new Formatting(child, this.lang, this, this.opts));
					break;
			}

		}

	}

	getChildById(id) {

		for (const child of this.children) {

			if (child.id === id) {
				return child;
			}

		}

	}

	/**
	 * 
	 * @param {Conditional} cond 
	 */
	equals(cond) {

		const {correct, lang} = Item.sort(this, cond);

		if (correct.id !== lang.id) {
			throw new EqualsError(correct, lang, `Correct ID '${correct.id}' did not match lang ID ${lang.id}`);
		}

		for (const correctChild of correct.children) {

			const langChild = lang.getChildById(correctChild.id);

			if (!langChild) {
				throw new EqualsError(correct, lang, `Missing child with id '${correctChild.id}'`);
			}

			correctChild.equals(langChild)

		}

		for (const langChild of lang.children) {

			const correctChild = correct.getChildById(langChild.id);

			if (!correctChild) {
				throw new EqualsError(correct, lang, `Extra child with id '${langChild.id}'`);
			}

			langChild.equals(correctChild);

		}

	}

}

class Formatting extends Parent {

	/**
	 * 
	 * @param {libxmljs.Element} el 
	 * @param {string} lang 
	 * @param {Conditional} parent 
	 */
	constructor(el, lang, parent, opts) {

		super(el, lang, parent, opts);

		this.id = '_html_' + el.name();

	}

}

class Conditional extends Parent {

	/**
	 * 
	 * @param {libxmljs.Element} el 
	 * @param {string} lang 
	 * @param {Conditional} parent 
	 */
	constructor(el, lang, parent, opts) {

		const dataIdx = typeof el.attr === 'function' ? el.attr('data-idx').value() : undefined;

		let id = Number.parseInt(dataIdx);
		if (isNaN(id)) {
			if (el.name() !== 'root') {
				throw new Error('Found a conditional without a data-idx');
			}
			id = null;
		}

		super(el, lang, parent, opts);

		this.id = id;

	}

}

class Display extends Item {

	/**
	 * 
	 * @param {libxmljs.Element} el 
	 * @param {string} lang 
	 * @param {Conditional} parent 
	 */
	constructor(el, lang, parent, opts) {

		super(el, lang, parent, opts);

		this.id = typeof el.attr === 'function' ? el.attr('data-tag-name').value() : undefined;

		if (!this.id) {
			throw new Error('Found a display tag without a name');
		}

	}

	/**
	 * 
	 * @param {Display} disp 
	 */
	equals(disp) {

		const {correct, lang} = Item.sort(this, disp);

		if (correct.id !== lang.id) {
			throw new EqualsError(correct, lang, `Correct ID '${correct.id}' did not match lang ID ${lang.id}`);
		}

	}

}

module.exports.Item = Item;
module.exports.Parent = Parent;
module.exports.Formatting = Formatting;
module.exports.Display = Display;
module.exports.Conditional = Conditional;
module.exports.EqualsError = EqualsError;
