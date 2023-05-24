function $(id) {
	return document.getElementById(id);
}

function removeChildren(elem) {
	while (elem.firstChild)
		elem.removeChild(elem.firstChild);
}

function getMin(arr) {
	return arr.reduce((acc, x) => Math.min(acc, x), Infinity);
}

function getMax(arr) {
	return arr.reduce((acc, x) => Math.max(acc, x), -Infinity);
}

function getSum(arr) {
	return arr.reduce((acc, x) => acc + x, 0);
}
