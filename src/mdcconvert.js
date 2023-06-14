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
	convert($('input-text').value);
}

function convertFile(file) {
	$('input-text').value = '';
	const reader = new FileReader();
	reader.addEventListener('load', (e) => {
		convert(e.target.result);
		$('download').classList.remove('hidden');
	});
	reader.readAsText(file);
}

var downloadable = [];

function convert(s) {
	$('error-results').classList.add('hidden');
	$('parse-results').classList.add('hidden');
	const ul = $('outputs');
	removeChildren(ul);
	downloadable = [];
	const lines = s.split('\n').map(line => line + '\n');
	var items = [];
	try {
		var i;
		for (i = 0; i < lines.length; i++) {
			const line = mdcsyntax.parse(lines[i]);
			items.push(...line.parts);
		}
	} catch (err) {
		console.log(err);
		console.log("error in line", i, lines[i]);
		$('error-text').value = err;
		$('error-results').classList.remove('hidden');
		return;
	}
	for (let item of items) {
		const li = document.createElement('li');
		if (item instanceof MdcText) {
			const text = item.toString();
			li.innerText = text;
			downloadable.push({ type: 'text', string: text });
		} else if (item instanceof MdcLineNumber) {
			const num = item.toString();
			const b = document.createElement('b');
			b.innerText = num;
			li.appendChild(b);
			downloadable.push({ type: 'linenumber', string: num });
		} else {
			const encoding = item.toString();
			const red = item.isRed();
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
			downloadable.push({ type: t, string: encoding });
		}
		ul.appendChild(li);
	}
	$('parse-results').classList.remove('hidden');
}

function download() {
	const blob = new Blob([JSON.stringify(downloadable)], { type: "text/json" });
	const downloadLink = document.createElement("a");
	downloadLink.href = URL.createObjectURL(blob);
	downloadLink.download = 'converted.json';
	downloadLink.click();
}
