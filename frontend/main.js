
// TODO - Change this as required
const executeUrl = './execute';

var saveByteArray;

function encodeHtml(string) {
	return String(string).replace(/[\u00A0-\u9999<>\&]/g, function(i) {
		return '&#'+i.charCodeAt(0)+';';
	});
}

function toggleLanguageCheckboxes() {
	if ($('.languageCheckbox:checked').length === 0) {
		$('.languageCheckbox').prop('checked', true);
	} else {
		$('.languageCheckbox').prop('checked', false);
	}
}

function getErrorMessage(err) {
	if (err == null) {
		return `${err}`;
	}
	if (err.message != null) {
		return `${err.message}`;
	}
	if (err.responseText != null) {
		return `${err.responseText}`;
	}
	return `${err}`;
}

let loadingCount = 0;
function showLoading() {
	loadingCount += 1;
	if (loadingCount > 0) {
		$('#loading-gif').show();
	}
}
function hideLoading() {
	loadingCount -= 1;
	if (loadingCount <= 0) {
		$('#loading-gif').hide();
	}
}

function executeAndCatchWithLoading() {
	showLoading();
	execute().catch((err) => {
		alert(`An error occurred, view the console for more details\n---\n${getErrorMessage(err)}`);
		console.error(err);
	}).finally(() => {
		hideLoading();
	});
}

function showInWebpage(data, allLangs) {

	let html = `<p>Correct lang: ${encodeHtml(data.correctLang)}</p>`;
	html += '<table><thead><tr><th>Pool</th><th>ID</th><th>Name</th><th>Last Modified</th>';
	for (const lang of allLangs) {
		html += `<th>${encodeHtml(lang)}</th>`;
	}
	html += '</tr></thead><tbody>';
	for (const output of Object.values(data.keys)) {
		html += `<tr>`;
		html += `<td>${encodeHtml(output.poolId)}</td>`;
		html += `<td>${encodeHtml(output.id)}</td>`;
		html += `<td>${encodeHtml(output.name)}</td>`;
		html += `<td>${encodeHtml(new Date(output.lastModified).toLocaleString())}</td>`;
		for (const lang of allLangs) {
			const error = output.languages[lang];
			if (error) {
				html += `<td style="background-color: orange;">${encodeHtml(error.message)}<br/><i>${error.location}</i></td>`;
			} else {
				html += '<td></td>';
			}
		}
	}
	$('#output-table').html(html);
}

async function execute() {

	// Access Token
	let accessToken = $('#accessTokenInput').val();
	if (!accessToken) {
		accessToken = getBearerToken();
	}

	// Pool IDs
	const poolIdsString = $('#poolIdsInput').val();
	const poolIds = poolIdsString ? poolIdsString.split(',').map(x => Number.parseInt(x.trim())) : [];

	// Filter by name
	const filterTkNamesString = $('#filterTKsByNameInput').val();
	const filterTkNames = filterTkNamesString ? filterTkNamesString.split('\n') : null;

	// Filter by ID
	const filterTkIdsString = $('#filterTKsByIdInput').val();
	const filterTkIds = filterTkIdsString ? filterTkIdsString.split(',').map(x => Number.parseInt(x.trim())) : null;

	if (!filterTkNames && !filterTkIds) {
		if (window.allowExecutingWithNoFilters !== true) {
			throw new Error('Executing with no filters is blocked for performance reasons');
		}
	}

	// Languages
	const checkboxes = $('.languageCheckbox:checked');
	const langs = [];
	checkboxes.each((i, el) => {
		langs.push($(el).val());
	});

	// File type
	const rawFileType = $('#fileTypeInput').val();
	let fileType = rawFileType;
	if (fileType === 'webpage') {
		fileType = 'json';
	}

	// Non errors in json
	const showNonErrorsInJsonOutputAsNull = false;

	// Correct Language
	const correctLang = $('#correctLangInput').val() || null;

	// Correct Language
	const ignoreFormatting = $('#ignoreFormattingInput:checked').length > 0;

	// Correct Language
	const checkEditedSinceString = $('#checkForEditsSinceInput').val();
	const checkEditedSince = checkEditedSinceString ? new Date(checkEditedSinceString).toISOString() : null;

	const input = {
		poolIds,
		filterTkNames,
		filterTkIds,
		langs,
		fileType,
		showNonErrorsInJsonOutputAsNull,
		correctLang,
		ignoreFormatting,
		checkEditedSince
	};

	console.log('Posting to API with the following input:', input);

	const output = await $.post({
		url: executeUrl,
		dataType: 'text',
		data: JSON.stringify(input),
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + accessToken
		}
	});

	const {langs: allLangs} = await langsPromise;

	if (rawFileType === 'webpage') {
		showInWebpage(JSON.parse(output), allLangs);
		return;
	}

	let fileName = 'translations'
	if (allLangs.length === langs.length) {
		fileName += '-all';
	} else {
		fileName += '-' + langs.join(',');
	}
	if (filterTkIds) {
		fileName += '-' + filterTkIds.join(',');
	}

	fileName += '.' + fileType;

	saveByteArray([output], fileName);

}

const documentIsReady = new Promise((res) => {
	$(document).ready(() => {
		redirectIfNoBearer();
		res();
	});
}).then(() => {
	saveByteArray = (function () {
		var a = document.createElement("a");
		document.body.appendChild(a);
		a.style = "display: none";
		return function (data, name) {
			var blob = new Blob(data, {type: "octet/stream"}),
				url = window.URL.createObjectURL(blob);
			a.href = url;
			a.download = name;
			a.click();
			window.URL.revokeObjectURL(url);
		};
	}());
});

const langsPromise = $.get('./all-langs');

Promise.all([langsPromise, documentIsReady]).then(([allLangs]) => {

	// Create language checkboxes and select
	let checkboxesHtml = '<table><tr>';
	let correctLangHtml = '';
	let counter = 0;
	console.log(allLangs.langs);
	for (const lang of allLangs.langs) {
		checkboxesHtml += `<td><input type="checkbox" class="languageCheckbox" value="${lang}"/> ${lang}</td>`;
		correctLangHtml += `<option${lang === 'EN' ? ' selected="true"' : ''} value="${lang}">${lang}</option>`;
		if (++counter === 8) {
			counter = 0;
			checkboxesHtml += '</tr><tr>';
		}
	}
	checkboxesHtml += '</tr></table>'
	$('#languageCheckboxes').append(checkboxesHtml);
	$('#correctLangInput').append(correctLangHtml);

});
