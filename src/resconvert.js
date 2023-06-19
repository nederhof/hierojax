function clearInputs() {
	$('input-file').value = '';
	$('input-text').value = '';
	$('error-results').classList.add('hidden');
	$('parse-results').classList.add('hidden');
	$('download').classList.add('hidden');
}

function processFile() {
	const fileList = event.target.files;
	if (fileList.length > 0)
		convertFile(fileList[0]);
}

function processInput() {
	$('input-file').value = '';
	const items = $('input-text').value.split('\n').map(line => new ResLine(line));
	convert(items);
}

function convertFile(file) {
	$('input-text').value = '';
	const reader = new FileReader();
	reader.addEventListener('load', (e) => {
		convertXML(e.target.result);
		$('download').classList.remove('hidden');
	});
	reader.readAsText(file);
}

function convertXML(s) {
	const parser = new DOMParser();
	const doc = parser.parseFromString(s, 'application/xml');
	const errorNode = doc.querySelector('parsererror');
	if (errorNode) {
		console.error('Error while parsing');
		$('error-text').value = 'Error while parsing';
		$('error-results').classList.remove('hidden');
		$('parse-results').classList.add('hidden');
		return;
	}
	const items = [];
	const his = doc.getElementsByTagName('texthi');
	for (let i = 0; i < his.length; i++) {
		const children = his[i].childNodes;
		for (let j = 0; j < children.length; j++) {
			const child = children[j];
			if (child.nodeType == Node.ELEMENT_NODE && child.tagName == 'coord')
				items.push(new ResCoord(child.getAttribute('id')));
			else if (child.nodeType == Node.TEXT_NODE)
				items.push(new ResLine(child.nodeValue));
		}
	}
	convert(items);
}

var downloadable = [];
var warnings = [];

function convert(items) {
	$('error-results').classList.add('hidden');
	$('parse-results').classList.add('hidden');
	removeChildren($('outputs'));
	downloadable = [];
	warnings = [];
	try {
		for (let item of items)
			if (item instanceof ResCoord)
				makeCoord(item);
			else if (!item.toString().match(/^\s*$/))
				makeHiero(ressyntax.parse(item.toString()));
	} catch (err) {
		console.error(err);
		console.error('Error in', item.toString());
		$('error-text').value = err;
		$('error-results').classList.remove('hidden');
		return;
	}
	if (warnings.length > 0) {
		$('error-text').value = warnings.join('\n');
		$('error-results').classList.remove('hidden');
	}
	$('parse-results').classList.remove('hidden');
}

function makeCoord(item) {
	const li = document.createElement('li');
	const b = document.createElement('b');
	b.innerText = item.toString();
	li.appendChild(b);
	$('outputs').appendChild(li);
	downloadable.push([{ type: 'linenumber', string: item.toString() }]);
}

function makeHiero(item) {
	const li = document.createElement('li');
	const fragments = item.cutByColor();
	var parts = [];
	for (let fragment of fragments) {
		const converted = fragment.toUnicode();
		const encoding = converted.str;
		warnings.push(...converted.warnings);
		const red = fragment.isRed();
		const span = document.createElement('span');
		span.className = 'hierojax';
		span.setAttribute('data-fontsize', 30);
		if (red)
			span.setAttribute('data-signcolor', 'red');
		span.setAttribute('data-bracketcolor', 'blue');
		span.innerText = encoding;
		span.addEventListener('click', function() {
			navigator.clipboard.writeText(encoding);
			span.classList.add('clicked');
			setTimeout(() => span.classList.remove('clicked'), 2000);
		});
		li.appendChild(span);
		hierojax.processFragment(span);
		const t = red ? 'red' : 'black';
		parts.push({ type: t, string: encoding });
	}
	if (parts.length > 0) {
		$('outputs').appendChild(li);
		downloadable.push(parts);
	}
}

function download() {
	const blob = new Blob([JSON.stringify(downloadable)], { type: 'text/json' });
	const downloadLink = document.createElement('a');
	downloadLink.href = URL.createObjectURL(blob);
	downloadLink.download = 'converted.json';
	downloadLink.click();
}
