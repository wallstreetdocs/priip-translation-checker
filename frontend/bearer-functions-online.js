
function hasBearerToken() {
	return !!sessionStorage.getItem('priipCloud.authToken');
}

function getBearerToken() {
	return sessionStorage.getItem('priipCloud.authToken')?.replace(/['"]+/g, '');
}

function redirectIfNoBearer() {
	if(!hasBearerToken()) {
		document.location.href = '/';
		throw new Error('To stop execution');
	}
}
