class HieroJax {
	constructor() {
		this.startLoadingFonts();
	}

	startLoadingFonts() {
		const hierojax = this;
		this.fonts = [ new FontFace('Hieroglyphic', 'url(NewGardiner.ttf)') ];
		this.nFonts = this.fonts.length;
		this.nFontsLoaded = 0;
		this.fonts.forEach(f => { f.load().then((font) => {
			document.fonts.add(font);
			hierojax.nFontsLoaded++; });
		});
	}

	waitForFonts(f, c) {
		const hierojax = this;
		if (this.nFonts == this.nFontsLoaded) {
			f();
		} else if (c > 40) {
			alert('Seems unable to load fonts; perhaps try again later?');
		} else {
			const wait = c == 0 ? 5 : c == 1 ? 50 : c < 5 ? 100 : 1000;
			setTimeout(function(){ hierojax.waitForFonts(f, c+1); }, wait);
		}
	}

	processFragments() {
		this.waitForFonts(() => this.processFragmentsNow(), 0);
	}

	processFragment(elem) {
		this.waitForFonts(() => this.processFragmentNow(elem), 0);
	}

	processFragmentsIn(elem) {
		const spans = elem.getElementsByTagName("span");
		for (let span of spans)
			if (span.classList.contains('hierojax'))
				this.processFragment(span);
	}

	processFragmentsNow() {
		var elems = document.getElementsByClassName('hierojax');
		[...elems].forEach(elem => this.processFragmentNow(elem));
	}

	processFragmentNow(elem) {
		var style = window.getComputedStyle(elem, null);
		var fontSize = Number(style.getPropertyValue('font-size').replace('px', ''));
		var signColor = style.getPropertyValue('color');
		const txt = elem.innerText;
		elem.innerHTML = '';
		try {
			var fragment = syntax16.parse(txt);
		} catch (err) {
			console.log('Parse error:\n' + txt + err);
			elem.innerHTML = '<span style="font-size: 20px; color: red;">parse error; see log</span>';
			return;
		}
		var options = {};
		options.fontsize = fontSize;
		options.signcolor = signColor;
		for (const p of ['fontsize', 'signcolor', 'dir', 'linesize', 'sep', 'separated', 'type',
				'bracketcolor', 'shadepattern', 'align', 'border', 'standalone', 'log'])
			if (elem.getAttribute('data-' + p))
				options[p] = elem.getAttribute('data-' + p);
		fragment.print(elem, options);
	}
}

const hierojax = new HieroJax();
