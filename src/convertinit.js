var Shapes = {};

function objToString(obj) {
	return JSON.stringify(obj, null, 2).replace(/[\u007F-\uFFFF]/g, function(ch) {
		return '\\u' + ('0000' + ch.charCodeAt(0).toString(16)).substr(-4) });
}
