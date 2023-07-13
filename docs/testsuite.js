class HieroJaxDemo {
	constructor() {
		this.expandDemoLines();
		hierojax.processFragments();
	}

	expandDemoLines() {
		const elems = document.getElementsByTagName('hierojax-demo');
		[...elems].forEach(elem => this.expandDemoLine(elem));
	}

	expandDemoLine(elem) {
		const txt = elem.innerText;
		this.testParsing(txt);
		const p = document.createElement('p');
		const spanTxt = document.createElement('span');
		spanTxt.className = 'hierojax-source';
		spanTxt.innerText = txt;
		p.appendChild(spanTxt);
		const br = document.createElement('br');
		p.appendChild(br);
		p.appendChild(this.makeHiero(txt, { }));
		p.appendChild(this.makeHiero(txt, { dir: 'hrl', shadepattern: 'hatching',
			border: true, signcolor: 'red' }));
		p.appendChild(this.makeHiero(txt, { type: 'canvas', align: 'bottom' }));
		p.appendChild(this.makeHiero(txt, { dir: 'hrl', type: 'canvas', signcolor: 'rgb(64, 255, 0)' }));
		p.appendChild(this.makeHiero(txt, { dir: 'vrl', type: 'dom',
			shadepattern: 'hatching', signcolor: '#0040ff' }));
		p.appendChild(this.makeHiero(txt, { dir: 'vrl', type: 'svg',
			shadepattern: 'hatching', signcolor: '#cc40ff' }));
		p.appendChild(this.makeHiero(txt, { dir: 'vrl', separated: true,
			shadepattern: 'hatching', border: true, signcolor: 'green' }));
		p.appendChild(this.makeHiero(txt, { dir: 'hrl', type: 'canvas', separated: true,
			shadepattern: 'hatching', border: true, signcolor: 'red' }));
		p.appendChild(this.makeHiero(txt, { dir: 'hrl', type: 'svg', separated: true,
			shadepattern: 'uniform', border: false, signcolor: 'black' }));
		p.appendChild(this.makeHiero(txt, { type: 'svg', dir: 'vlr', 
			shadepattern: 'hatching', border: true }));
		elem.replaceWith(p);
	}

	makeHiero(txt, options) {
		const hiero = document.createElement('span');
		hiero.className = 'hierojax';
		hiero.style.setProperty('font-size', '36px');
		hiero.innerText = txt;
		for (const p of ['dir', 'linesize', 'separated', 'type',
				'bracketcolor', 'shadepattern', 'align', 'border'])
			if (options[p])
				hiero.setAttribute('data-' + p, options[p]);
		if (options.signcolor)
			hiero.style.setProperty('color', options.signcolor);
		return hiero;
	}
	
	testParsing(txt) {
		const fragment = syntax.parse(txt);
		if (fragment.toString() != txt) {
			const s = fragment.toString();
			console.log(txt, s);
			const ar1 = Array.from(txt);
			for (let i = 0; i < ar1.length; i++)
				console.log(i, ar1[i].codePointAt(0).toString(16));
			const ar2 = Array.from(s);
			for (let i = 0; i < ar2.length; i++)
				console.log(i, ar2[i].codePointAt(0).toString(16));
		}
	}
}

window.addEventListener("DOMContentLoaded", () => { new HieroJaxDemo(); });
