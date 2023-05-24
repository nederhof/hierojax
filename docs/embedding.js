function sendEncoding() {
	const txt = $('text-to-edit').value;
	const encoded = encodeURIComponent(txt);
	window.open('edit.html?encoding=' + encoded, '_blank');
}

function saveEncoding(txt) {
	$('text-to-edit').value = txt;
}

function cancelEncoding() {
}
