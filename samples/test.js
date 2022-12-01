
const {checkTranslations} = require('../src/index.js');

checkTranslations({
	origin: 'https://uat-cloud-api.priipcloud.com',
	accessToken: 'xxxxxxx',
	poolIds: [1],
	filterTkNames: null,
	filterTkIds: [744, 1635, 7892, 8546, 9582, 9955, 10322, 10334, 11687, 11688, 11689, 13013, 13057, 13532],
	langs: null,
	outputPath: './out/out.csv',
	showNonErrors: false,
	correctLang: 'EN',
	ignoreFormatting: true,
	checkEditedSince: new Date('2022-12-01T13:49:00Z'),
}).then(console.log).catch(console.error);
