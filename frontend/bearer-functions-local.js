
function hasBearerToken() {
	return !!sessionStorage.getItem('priipCloud.authToken');
}

function getBearerToken() {
	return sessionStorage.getItem('priipCloud.authToken')?.replace(/['"]+/g, '');
}

function redirectIfNoBearer() {

}
