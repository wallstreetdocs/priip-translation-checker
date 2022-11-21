
const RequestFactory = require('./request-factory.js');

const getAllTks = async (opts, callback) => {

	const priipFactory = new RequestFactory({
		id: 'PriipCloud',
		authHeader: 'Bearer ' + opts.accessToken,
		maxAttempts: 3,
		maxOngoingRequests: 5,
		rateLimitSafetyPeriod: 1000
	});
	
	const mainResp = await priipFactory.request({
		method: 'GET',
		url: `${opts.origin}/priip/api/translation/keys/pool/${opts.poolId}.json`,
		responseType: 'json',
	});

	if (opts.cancellationToken.isCancellationRequest) {
		return;
	}

	const queryString = opts.langs.map(lang => 'langId=' + lang).join('&');

	let data = mainResp.data;

	if (opts.filterTkNames != null) {
		data = data.filter(item => opts.filterTkNames.includes(item.name));
	}

	const promises = data.map(async (item) => {

		const name = item.name;
		const id = item.translationKeyId;
		const text = `<root>${item.text ?? ''}</root>`;

		if (opts.cancellationToken.isCancellationRequest) {
			return;
		}
	
		const resp = await priipFactory.request({
			method: 'GET',
			url: `${opts.origin}/priip/api/translation/key/${item.translationKeyId}/languages?${queryString}`,
			responseType: 'json',
		});

		if (opts.cancellationToken.isCancellationRequest) {
			return;
		}
	
		const languages = Object.fromEntries(resp.data.map((result, i) => ([opts.langs[i], `<root>${result?.text ?? ''}</root>`])));

		await callback({
			name,
			id,
			text,
			languages
		});

	});

	await Promise.all(promises);

}

module.exports.getAllTks = getAllTks;
