function sendEncoding() {
	const txt = $('text-to-edit').value;
	const encoded = encodeURIComponent(txt);
	window.open('edit16.html?encoding=' + encoded, '_blank');
}

function saveEncoding(txt) {
	/* ignore */
}

function cancelEncoding() {
}

window.addEventListener('DOMContentLoaded', () => {
	const spans = document.getElementsByTagName("span");
	for (let span of spans) {
		span.className = 'hierojax';
		span.setAttribute('data-type', 'svg');
		span.style.setProperty('font-size', '36px');
		span.style.setProperty('cursor', 'pointer');
		const txt = span.innerHTML;
		span.addEventListener('click', function() {
			const encoded = encodeURIComponent(txt);
			window.open('edit16.html?encoding=' + encoded, '_blank');
		});
		hierojax.processFragment(span);
	}
});
