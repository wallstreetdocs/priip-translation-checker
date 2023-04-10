
const fs = require('fs');
const { checkTranslations, getTranslationData } = require('../src/main.js');

//// You can run through the the translation checker as per the below:

const main = async () => {

	/////// PART ONE ///////

	// First fetch the cache
	const data = await getTranslationData({
		origin: 'https://uat-cloud-api.priipcloud.com',
		accessToken: 'xxxxxxx',
		poolIds: [1],
		filterTkIds: [744, 1635, 7892, 8546, 9582, 9955, 10322, 10334, 11687, 11688, 11689, 13013, 13057, 13532],
	});
	
	// We can then stringify the data and let the client save it to the file system
	await fs.promises.writeFile('./out/cache.json', JSON.stringify(data), 'utf-8');

	/////// PART TWO ///////

	// Then they can load the it back in via the UI to bypass doing all the API calls
	const translationData = await fs.promises.readFile('./out/cache.json', 'utf-8');

	// Then we can run the translation checker using a cached file instead which is MUCH faster
	const output = await checkTranslations({
		fileType: 'csv',
		showNonErrorsInJsonOutputAsNull: false,
		correctLang: 'EN',
		ignoreFormatting: true,
		checkEditedSince: new Date('2022-12-01T13:49:00Z'),
		translationData: JSON.parse(translationData)
	});
	
	await fs.promises.writeFile('./out/out.csv', output);
	
}

main().catch(console.error)
