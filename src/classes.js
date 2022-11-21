
const libxmljs = require('libxmljs2');

class EqualsError extends Error {

	/**
	 * 
	 * @param {Item} key 
	 * @param {Item} lang 
	 * @param {string} message 
	 */
	constructor(key, lang, message) {

		super(message);

		this.key = key;
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
	constructor(el, lang, parent) {

		this.el = el;
		this.lang = lang;
		this.parent = parent;

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

		return chain.map(item => item.id ?? 'ROOT').join('->');

	}

	/**
	 * 
	 * @param {Item} a 
	 * @param {Item} b 
	 */
	static sort(a, b) {
		if (a.lang == null && b.lang != null) {
			return {key: a, lang: b};
		}
		if (b.lang == null && a.lang != null) {
			return {key: b, lang: a};
		}
		throw new Error('Could not sort out the two items');
	}

}

class Parent extends Item {

	/**
	 * 
	 * @param {libxmljs.Element} el 
	 * @param {string} lang 
	 * @param {Conditional} parent 
	 */
	constructor(el, lang, parent) {

		super(el, lang, parent);

		/** @type {Item[]} */
		this.children = [];

		for (const child of el.childNodes()) {

			if (child?.name?.() === 'wsd-basicconditional') {

				this.children.push(new Conditional(child, this.lang, this));

			} else if (child instanceof libxmljs.Element) {

				if (child.childNodes().length === 0) {
					continue;
				}

				if (child.name()?.startsWith?.('wsd-')) {
					this.children.push(new Display(child, this.lang, this));
				} else {
					this.children.push(new Formatting(child, this.lang, this));
				}

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

		const {key, lang} = Item.sort(this, cond);

		if (key.id !== lang.id) {
			throw new EqualsError(key, lang, `Key ID '${key.id}' did not match lang ID ${lang.id}`);
		}

		for (const keyChild of key.children) {

			const langChild = lang.getChildById(keyChild.id);

			if (!langChild) {
				throw new EqualsError(key, lang, `Language had a missing child with id '${keyChild.id}'`);
			}

			keyChild.equals(langChild)

		}

		for (const langChild of lang.children) {

			const keyChild = key.getChildById(langChild.id);

			if (!keyChild) {
				throw new EqualsError(key, lang, `Language had an extra child with id '${langChild.id}'`);
			}

			langChild.equals(keyChild);

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
	constructor(el, lang, parent) {

		super(el, lang, parent);

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
	constructor(el, lang, parent) {

		const dataIdx = el.attr('data-idx')?.value();

		let id = Number.parseInt(dataIdx);
		if (isNaN(id)) {
			if (el.name() !== 'root') {
				throw new Error('Found a conditional without a data-idx');
			}
			id = null;
		}

		super(el, lang, parent);

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
	constructor(el, lang, parent) {

		super(el, lang, parent);

		this.id = el.attr('data-tag-name')?.value();

		if (!this.id) {
			throw new Error('Found a display tag without a name');
		}

	}

	/**
	 * 
	 * @param {Display} disp 
	 */
	equals(disp) {

		const {key, lang} = Item.sort(this, disp);

		if (key.id !== lang.id) {
			throw new EqualsError(key, lang, `Key ID '${key.id}' did not match lang ID ${lang.id}`);
		}

	}

}

module.exports.Item = Item;
module.exports.Parent = Parent;
module.exports.Formatting = Formatting;
module.exports.Display = Display;
module.exports.Conditional = Conditional;
module.exports.EqualsError = EqualsError;
