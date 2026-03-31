const hieroSize = 50;
const sourceSize = 30;
const margin = 4;

function literalEncoding(sign) {
	return sign.ch + (sign.mirror ? Group.MIRROR : '');
}

function overlayEncoding(lig) {
	const hor = lig.horizontal.length == 1 ? literalEncoding(lig.horizontal[0]) :
					Group.BEGIN_SEGMENT + lig.horizontal.map(literalEncoding).join(Group.HOR) + Group.END_SEGMENT;
	const ver = lig.vertical.length == 1 ? literalEncoding(lig.vertical[0]) :
					Group.BEGIN_SEGMENT + lig.vertical.map(literalEncoding).join(Group.VER) + Group.END_SEGMENT;
	return hor + Group.OVERLAY + ver;
}

function verticalEncoding(lig) {
	return lig.groups.map(g => literalEncoding(g)).join(Group.VER);
}

function horizontalEncoding(lig) {
	return lig.groups.map(g => literalEncoding(g)).join(Group.HOR);
}

function expandedSpan(txt) {
	const hiero = document.createElement('span');
	hiero.className = 'hierojax-source';
	hiero.style.setProperty('font-size', sourceSize + 'px');
	hiero.innerText = txt;
	return hiero;
}

function codepoints(txt) {
	const points = document.createElement('span');
	points.className = 'codepoints';
	for (const ch of txt) {
		var sym = '';
		var isName = false;
		if (ch == '\u{13437}' || ch == '\u{13438}') {
			continue;
		} else if (ch == '\u{13436}') {
			sym = ' +  ';
		} else if (ch == '\u{13431}') {
			sym = '* ';
		} else if (ch == '\u{13430}') {
			sym = ': ';
		} else {
			sym = 'U+' + ch.codePointAt(0).toString(16).toUpperCase() + ' ';
			isName = true;
		}
		const elem = document.createElement('span');
		elem.innerText = sym;
		if (isName)
			elem.className = 'name';
		points.appendChild(elem);
	}
	return points;
}

function printRectangle(ctx, wLig, hLig, sign) {
	ctx.strokeStyle = 'blue';
	const x = margin + Math.round(wLig * sign.x);
	const y = margin + Math.round(hLig * sign.y);
	const w = Math.round(wLig * sign.w);
	const h = Math.round(hLig * sign.h);
	ctx.beginPath();
	ctx.rect(x, y, w, h);
	ctx.stroke();
}

function overlayCanvas(ch, lig) {
	const meas = PrintedAny.correctedMeasurement(ch, hieroSize, 1, 1, 0, false, { });
	const canvas = document.createElement('canvas');
	const w = Math.round(meas.w);
	const h = Math.round(meas.h);
	canvas.width = w + 2 * margin; 
	canvas.height = h + 2 * margin; 
	const ctx = canvas.getContext('2d');
	lig.horizontal.concat(lig.vertical).forEach(s => printRectangle(ctx, w, h, s))
	Shapes.prepareFont(ctx, hieroSize, 'black');
	ctx.fillText(ch, margin, margin + h)
	return canvas;
}

function tabularCanvas(ch, lig) {
	const meas = PrintedAny.correctedMeasurement(ch, hieroSize, 1, 1, 0, false, { });
	const canvas = document.createElement('canvas');
	const w = Math.round(meas.w);
	const h = Math.round(meas.h);
	canvas.width = w + 2 * margin; 
	canvas.height = h + 2 * margin; 
	const ctx = canvas.getContext('2d');
	lig.groups.forEach(s => printRectangle(ctx, w, h, s))
	Shapes.prepareFont(ctx, hieroSize, 'black');
	ctx.fillText(ch, margin, margin + h)
	return canvas;
}

function printLigaturesPerExpanded(exp, ligatures) {
	const li = document.createElement('li');
	li.style.setProperty('font-size', '20px');
	hierojax.waitForFonts(() => {
		for (lig of ligatures) {
			if (lig.lig.type == 'overlay')
				li.appendChild(overlayCanvas(lig.ch, lig.lig))
			else if (lig.lig.type == 'vertical' || lig.lig.type == 'horizontal')
				li.appendChild(tabularCanvas(lig.ch, lig.lig))
		}
		li.appendChild(document.createTextNode(' \u21A4 '));
		li.appendChild(expandedSpan(exp));
		li.appendChild(codepoints(exp));
	});
	$('ligatures').appendChild(li);
}

function printLigatures() {
	var expandedToChars = new Map();
	for (const ch in Shapes.ligatures) {

		const lig = Shapes.ligatures[ch];
		if (lig.type == 'overlay')
			var expanded = overlayEncoding(lig);
		else if (lig.type == 'vertical')
			var expanded = verticalEncoding(lig);
		else if (lig.type == 'horizontal')
			var expanded = horizontalEncoding(lig);
		if (!expandedToChars.has(expanded))
			expandedToChars.set(expanded, []);
		expandedToChars.get(expanded).push({ ch, lig });
	}
	const expandeds = [...expandedToChars.keys()].sort((a,b) => {
		aGlyphs = stripBrackets(a);
		bGlyphs = stripBrackets(b);
		if (aGlyphs < bGlyphs) return -1;
		else if (bGlyphs < aGlyphs) return 1;
		else return a < b ? -1 : b < a ? 1 : 0;
	});
	for (let expanded of expandeds) {
		const ligs = expandedToChars.get(expanded);
		printLigaturesPerExpanded(expanded, ligs);
	}
}

function stripBrackets(s) {
	return s.replace(/[\u{13437}\u{13438}]/gu, '').replace(/\u{13436}/gu, ' ');
}

window.addEventListener("DOMContentLoaded", () => {
	printLigatures();
	hierojax.processFragments();
});
