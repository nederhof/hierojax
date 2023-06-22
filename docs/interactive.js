class HieroJaxInteractive {
	static createHTML() {
		const htmlHeader = HieroJaxInteractive.getParameters();
		$('header').innerHTML = htmlHeader;
		var encoding = $('encoding').value;
		if ((/\s/).test(encoding)) {
			encoding = encoding.replace(/\s/, '');
			$('encoding').value = encoding;
		}
		const htmlFull = htmlHeader + encoding + '</span>';
		$('rendering').innerHTML = htmlFull;
		hierojax.processFragments();
		HieroJaxInteractive.allowDownload();
	}

	static clearHTML() {
		$('encoding').value = '';
		HieroJaxInteractive.createHTML();
	}

	static getParameters() {
		const formData = new FormData($('form'));
		var html = '<span class="hierojax"';
		var styles = '';
		if (formData.get('dir') != 'hlr')
			html += ' data-dir="' + formData.get('dir') + '"';
		if (formData.get('linesize') != 1)
			html += ' data-linesize="' + formData.get('linesize') + '"';
		if (formData.get('fontsize') != 40)
			styles += 'font-size:' + formData.get('fontsize') + 'px;';
		if (formData.get('sep') != 0.07)
			html += ' data-sep="' + formData.get('sep') + '"';
		if (formData.get('type') != 'dom')
			html += ' data-type="' + formData.get('type') + '"';
		if (formData.get('signcolor') != 'black')
			styles += 'color:' + formData.get('signcolor') + ';';
		if (formData.get('bracketcolor') != 'black')
			html += ' data-bracketcolor="' + formData.get('bracketcolor') + '"';
		if (formData.get('shadepattern') != 'uniform')
			html += ' data-shadepattern="' + formData.get('shadepattern') + '"';
		if (formData.get('align') != 'middle')
			html += ' data-align="' + formData.get('align') + '"';
		html += ' data-standalone="true"';
		if (styles)
			html += ' style="' + styles + '"';
		html += '>';
		return html;
	}

	static setDefaults() {
		$('hlr').checked = true;
		$('linesize').value = 1;
		$('fontsize').value = 40;
		$('sep').value = 0.07;
		$('dom').checked = true;
		$('blacksign').checked = true;
		$('blackbracket').checked = true;
		$('uniform').checked = true;
		$('middle').checked = true;
		HieroJaxInteractive.createHTML();
	}

	static allowDownload() {
		const formData = new FormData($('form'));
		$('download-svg').style.setProperty('display', 'none');
		$('download-canvas').style.setProperty('display', 'none');
		$('svg-note').style.setProperty('display', 'none');
		switch (formData.get('type')) {
			case 'svg': 
				$('download-svg').style.setProperty('display', 'inline-block');
				$('svg-note').style.setProperty('display', 'inline-block');
				break;
			case 'canvas': 
				$('download-canvas').style.setProperty('display', 'inline-block');
				break;
		}
	}

	static downloadSVG() {
		const elems = document.getElementsByTagName('svg');
		if (elems.length != 1)
			return;
		const elem = elems.item(0);
		const serializer = new XMLSerializer();
		const source = serializer.serializeToString(elem);
		const preface = '<?xml version="1.0" standalone="no"?>\r\n';
		const blob = new Blob([preface, source], { type: "image/svg+xml;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const downloadLink = document.createElement("a");
		downloadLink.href = url;
		downloadLink.download = 'image.svg';
		downloadLink.click();
	}

	static downloadCanvas() {
		const elems = document.getElementsByTagName('canvas');
		if (elems.length != 1)
			return;
		const elem = elems.item(0);
		const downloadLink = document.createElement("a");
		downloadLink.href = elem.toDataURL();
		downloadLink.download = 'image.png';
		downloadLink.click();
	}
}

window.addEventListener("DOMContentLoaded", () => { HieroJaxInteractive.createHTML(); });
