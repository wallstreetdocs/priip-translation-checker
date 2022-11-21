
const {checkTranslations} = require('../src/index.js');

checkTranslations({
	origin: 'https://uat-cloud-api.priipcloud.com',
	accessToken: 'xxxxxxx',
	poolId: 1,
	filterTkNames: ['auto: data table: level observation period (definition)'],
	langs: null,
	outFile: './out/out.csv',
	showNonErrors: false,
}).then(console.log).catch(console.error);
