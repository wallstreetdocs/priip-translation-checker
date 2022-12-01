
const RequestFactory = require('./request-factory.js');

const getAllTks = async (opts, callback) => {

	const priipFactory = new RequestFactory({
		id: 'PriipCloud',
		authHeader: 'Bearer ' + opts.accessToken,
		maxAttempts: 3,
		maxOngoingRequests: 5,
		rateLimitSafetyPeriod: 1000
	});

	const poolPromises = opts.poolIds.map(async (poolId) => {

		const mainResp = await priipFactory.request({
			method: 'GET',
			url: `${opts.origin}/priip/api/translation/keys/pool/${poolId}.json`,
			responseType: 'json',
		});
	
		if (opts.cancellationToken.isCancellationRequested) {
			return;
		}
	
		const queryString = opts.langs.map(lang => 'langId=' + lang).join('&');
	
		let data = mainResp.data;
	
		if (opts.filterTkNames != null) {
			data = data.filter(item => opts.filterTkNames.includes(item.name));
		}
	
		if (opts.filterTkIds != null) {
			data = data.filter(item => opts.filterTkIds.includes(item.translationKeyId));
		}
	
		const promises = data.map(async (item) => {
	
			const name = item.name;
			const id = item.translationKeyId;
			const master = `<root>${item.text ?? ''}</root>`;
	
			if (opts.cancellationToken.isCancellationRequested) {
				return;
			}
		
			const resp = await priipFactory.request({
				method: 'GET',
				url: `${opts.origin}/priip/api/translation/key/${item.translationKeyId}/languages?${queryString}`,
				responseType: 'json',
			});
	
			if (opts.cancellationToken.isCancellationRequested) {
				return;
			}
		
			const languages = Object.fromEntries(resp.data.map((result, i) => {
				const lang = opts.langs[i];
				const xml = result?.text ? `<root>${result.text}</root>` : null;
				return [lang, xml];
			}));
	
			const lastModified = item.lastModified;
	
			await callback({
				name,
				id,
				lastModified,
				poolId,
				master,
				languages
			});
	
		});
	
		await Promise.all(promises);
	
	});

	await Promise.all(poolPromises);

}

module.exports.getAllTks = getAllTks;
