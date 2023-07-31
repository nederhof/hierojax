const hieroSize = 50;
const margin = 4;

function overlayEncoding(lig) {
	var hor = lig.horizontal.length == 1 ? lig.horizontal[0].sign :
					Group.BEGIN_SEGMENT + lig.horizontal.map(s => s.sign).join(Group.HOR) + Group.END_SEGMENT;
	var ver = lig.vertical.length == 1 ? lig.vertical[0].sign :
					Group.BEGIN_SEGMENT + lig.vertical.map(s => s.sign).join(Group.VER) + Group.END_SEGMENT;
	return hor + Group.OVERLAY + ver;
}

function originalOverlay(lig) {
	const hiero = document.createElement('span');
	hiero.className = 'hierojax';
	hiero.style.setProperty('font-size', hieroSize + 'px');
	hiero.innerText = overlayEncoding(lig);
	return hiero;
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

function ligatureCanvas(lig) {
	const meas = PrintedAny.correctedMeasurement(lig.ligature, hieroSize, 1, 1, 0, false, { });
	const canvas = document.createElement('canvas');
	const w = Math.round(meas.w);
	const h = Math.round(meas.h);
	canvas.width = w + 2 * margin; 
	canvas.height = h + 2 * margin; 
	const ctx = canvas.getContext('2d');
	lig.horizontal.concat(lig.vertical).forEach(s => printRectangle(ctx, w, h, s))
	Shapes.prepareFont(ctx, hieroSize, 'black');
	ctx.fillText(lig.ligature, margin, margin + hieroSize);
	return canvas;
}

function printLigature(lig) {
	const li = document.createElement('li');
	li.style.setProperty('font-size', '20px');
	li.appendChild(originalOverlay(lig));
	li.appendChild(document.createTextNode(' \u21A6 '));
	hierojax.waitForFonts(() => li.appendChild(ligatureCanvas(lig)));
	$('ligatures').appendChild(li);
}

function printLigatures() {
	const ligs = Shapes.overlayLigatures.sort((a,b) => b.horizontal[0] - a.horizontal[0]);
	ligs.forEach(s => printLigature(s));
}

window.addEventListener("DOMContentLoaded", () => {
	printLigatures();
	hierojax.processFragments();
});
