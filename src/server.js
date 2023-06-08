
const path = require('path');
const express = require('express');
const { checkTranslations, checkTranslationsFromReq } = require('./main.js');
const staticData = require('./static-data.js');

const app = express();

const router = express.Router();

router.use(express.static(path.join(__dirname, '../frontend'), {
	index : false
}));

router.get('/all-langs', (req, res, next) => {

	res.json({langs: staticData.allLangs});

});

router.post('/execute', express.json(), (req, res, next) => {

	checkTranslationsFromReq(req).then((output) => {
		if (output.type === 'json') {
			res.setHeader('content-type', 'application/json');
		} else if (output.type === 'csv') {
			res.setHeader('content-type', 'text/csv');
		}
		res.send(output.data);
	}).catch((err) => {
		next(err);
	});

});

router.get('/bearer-functions.js', (req, res, next) => {

	if (process.env.ALLOW_NON_LOGGED_IN === 'true') {
		res.redirect(307, 'bearer-functions-local.js');
	} else {
		res.redirect(307, 'bearer-functions-online.js');
	}

});

app.use('/translation-checker', router);

module.exports.app = app;
