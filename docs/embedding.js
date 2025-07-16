function sendEncoding() {
	const txt = $('text-to-edit').value;
	const encoded = encodeURIComponent(txt);
	window.open('hierojaxedit.html?encoding=' + encoded, '_blank');
}

function saveEncoding(txt) {
	$('text-to-edit').value = txt;
}

function cancelEncoding() {
}
