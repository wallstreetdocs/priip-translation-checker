
const axios = require('axios');

const getValue = async (input) => {
	if (typeof input === 'function') {
		return await input();
	}
	return input;
}

/**
 * This class is made to handle generic rate-limit and stopping the app from spamming the server
 */
class RequestFactory {

	constructor(opts) {

		this._opts = opts || {};

		/** @type {number} */
		this._rateLimitUntil = null;

		/** @type {{res: (value: any) => void, rej: (reason: any) => void, axiosConfig: import('axios').AxiosRequestConfig, options: any, failedAttempts: number}[]} */
		this._queue = [];

		this._currentOngoingRequests = 0;

		this.axios = axios.create(this._opts.axiosInstanceOptions);

	}

	/**
	 * 
	 * @param {import('axios').AxiosRequestConfig} axiosConfig 
	 * @param {{doPriority: boolean}} options 
	 * @returns {Promise<import('axios').AxiosResponse>} 
	 */
	request(axiosConfig, options) {

		if (options == null) {
			options = {};
		}

		return new Promise((res, rej) => {

			if (axiosConfig == null) {
				rej(new Error('Cannot call a factory request with no axiosConfig'));
				return;
			}

			const obj = {res, rej, axiosConfig, options, failedAttempts: 0};

			if (options.doPriority) {
				this._queue.unshift(obj);
			} else {
				this._queue.push(obj);	
			}
			this.triggerNext();

		});

	}

	_updateRateLimit(resp) {

		let millis = Number.parseFloat(resp.headers['retry-after']) * 1000;
		if (!Number.isFinite(millis) || millis < 0) {
			millis = 5000;
		}
		const rateLimitSafetyPeriod = this._opts.rateLimitSafetyPeriod || 500;
		const newRateLimit = Date.now() + millis;
		if (this._rateLimitUntil < newRateLimit) {
			this._rateLimitUntil = newRateLimit + rateLimitSafetyPeriod;
			console.warn({
				message: `Applying rate limit to RequestFactory`,
				request_factory_id: `${this._opts.id}`,
				millis: millis + rateLimitSafetyPeriod
			});
		}


	}

	_waitForRateLimit() {

		if (this._rateLimitUntil) {
			const diff = this._rateLimitUntil - Date.now();
			if (diff > 0) {
				return new Promise((res, rej) => {
					setTimeout(() => {
						this._waitForRateLimit().then(res).catch(rej);
					}, diff);
				});
			}
		}

		return Promise.resolve();

	}

	async _trigger() {

		/** @type {import('axios').AxiosResponse} */
		let resp;
		let errored = false;
		let err;
		let next;
		let allowReattemptIfFail = true;
		let countAsAttemptOnFailure = true;

		try {

			// Wait for any rate limiting to finish
			await this._waitForRateLimit();

			// Do a quick initial check to see if there's actually any requests in the queue before doing any of the stuff below
			if (this._queue.length === 0) {
				return;
			}

			// Check to see if we already have the maximum number of requests going on
			const [maxOngoingRequests] = await Promise.all([
				getValue(this._opts.maxOngoingRequests)
			]);
			if (maxOngoingRequests != null && this._currentOngoingRequests >= maxOngoingRequests) {
				return;
			}

			// Check to see if there's actually another request to do (I know we checked before, but in case it changed after the awaits)
			next = this._queue.shift();
			if (next == null) {
				return;
			}
			this._currentOngoingRequests += 1;

			// Create headers object if it doesn't exist and make a shorthand for it
			if (next.axiosConfig.headers == null) {
				next.axiosConfig.headers = {};
			}
			const headers = next.axiosConfig.headers;

			// Get any variables
			const [authHeader] = await Promise.all([
				headers['Authorization'] === undefined ? getValue(this._opts.authHeader) : null, // Don't bother fetching the authHeader if we already have "Authorization" header set
			]);

			// Set the authorization header if we got one back
			if (authHeader) {
				headers['Authorization'] = authHeader;
			}

			// Wait again for any rate limiting to finish because some might have been introduced since we checked before
			await this._waitForRateLimit();

			// Make the actual request
			resp = await this.axios(next.axiosConfig);

		} catch (e) {

			errored = true;
			resp = e ? e.response : undefined;
			err = e;

		}

		try {

			const status = resp ? resp.status : undefined;
			// TODO: To add more handling here
			switch (status) {

				case 429: {
					this._updateRateLimit(resp);
					countAsAttemptOnFailure = false;
					break;
				}

			}

		} finally {

			try {

				// Assuming next is defined, we either need to add it back to the front of the queue it reject/resolve its promise
				if (next) {
					if (errored) {
						if (allowReattemptIfFail) {
							if (countAsAttemptOnFailure) {
								next.failedAttempts += 1;
							}
							const maxAttempts = (await getValue(this._opts.maxAttempts)) || 1;
							if (next.failedAttempts >= maxAttempts) {
								next.rej(err);
							} else {
								this._queue.unshift(next);
							}
						} else {
							next.rej(err);
						}
					} else {
						next.res(resp);
					}
				}

			} catch (err) {

				console.error({
					message: 'An error occurred when cleaning up the end of a RequestFactory request',
					req_factory_id: `${this._opts.id}`,
					cause: err
				});

			} finally {

				// Start the loop again
				this._currentOngoingRequests -= 1;
				setImmediate(() => this.triggerNext());

			}

		}

	}

	triggerNext() {

		this._trigger().catch((err) => {
			console.error({
				message: 'An error occurred during a RequestFactory trigger',
				req_factory_id: `${this._opts.id}`,
				cause: err
			});
		});

	}

}

module.exports = RequestFactory;
