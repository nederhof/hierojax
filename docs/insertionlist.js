const hieroSize = 50;
const latinFont = '15px Ariel';
const topRow = 10;
const middleRow = Math.round(hieroSize * 1 - 0);
const bottomRow = Math.round(hieroSize * 2 - 0);
const startColumn = 5;
const middleColumn = Math.round(hieroSize * 1 - 5);
const endColumn = Math.round(hieroSize * 2 - 20);

function printPosition(ctx, x, y, xLabel, yLabel) {
	ctx.save();
	ctx.strokeStyle = 'blue';
	ctx.fillStyle = 'blue';
	ctx.beginPath();
	ctx.arc(x, y, 3, 0, 2 * Math.PI);
	ctx.fill();
	ctx.beginPath();
	ctx.moveTo(x, y);
	ctx.lineTo(xLabel, yLabel);
	ctx.stroke();
	ctx.restore();
}

function printInsertionGlyph(li, ch, glyph) {
	const places = Object.keys(glyph).filter(p => p != 'glyph');
	const meas = shapes.emSizeOf(ch, hieroSize, 1, 1, 0, false);
	const buf = (1 - meas.w) / 2;
	const canvas = document.createElement('canvas');
	canvas.width = places.length > 0 ? hieroSize * 2 : hieroSize;
	canvas.height = hieroSize * 2;
	const ctx = canvas.getContext('2d');
	ctx.font = latinFont;

	places.forEach(p => {
		const place = glyph[p];
		const pos = Shapes.insertionPosition(p, place);
		const xCanvas = Math.round(hieroSize * (0.5 + buf + pos.x * meas.w));
		const yCanvas = Math.round(hieroSize * (1.5 + (pos.y - 1) * meas.h));
		switch (p) {
			case 'ts':
				ctx.fillText('TS', startColumn, topRow);
				printPosition(ctx, xCanvas, yCanvas, startColumn+10, topRow+5);
				break;
			case 'bs':
				ctx.fillText('BS', startColumn, bottomRow);
				printPosition(ctx, xCanvas, yCanvas, startColumn+10, bottomRow-15);
				break;
			case 'te':
				ctx.fillText('TE', endColumn, topRow);
				printPosition(ctx, xCanvas, yCanvas, endColumn+10, topRow+5);
				break;
			case 'be':
				ctx.fillText('BE', endColumn, bottomRow);
				printPosition(ctx, xCanvas, yCanvas, endColumn+10, bottomRow-15);
				break;
			case 't':
				ctx.fillText('T', middleColumn, topRow);
				printPosition(ctx, xCanvas, yCanvas, middleColumn+5, topRow+5);
				break;
			case 'b':
				ctx.fillText('B', middleColumn, bottomRow);
				printPosition(ctx, xCanvas, yCanvas, middleColumn+5, bottomRow-15);
				break;
			case 'm':
				ctx.fillText('M', endColumn, middleRow);
				printPosition(ctx, xCanvas, yCanvas, endColumn-2, middleRow-5);
				break;
		}
	});

	if (places.length > 0) {
		ctx.strokeStyle = 'gray';
		ctx.beginPath();
		const x = Math.round(hieroSize * (0.5 + buf));
		const y = Math.round(hieroSize * (1.5 - meas.h));
		const w = Math.round(hieroSize * meas.w);
		const h = Math.round(hieroSize * meas.h);
		ctx.rect(x, y, w, h);
		ctx.stroke();
		Shapes.prepareFont(ctx, hieroSize, 'black');
		ctx.fillText(ch, Math.round(hieroSize * (0.5 + buf)), Math.round(hieroSize * 1.5));
	} else {
		Shapes.prepareFont(ctx, hieroSize, 'black');
		ctx.fillText(ch, Math.round(hieroSize * buf), Math.round(hieroSize * 1.5));
	}
	li.appendChild(canvas);
}

function printInsertion(ch) {
	const glyphs = Shapes.insertions[ch];
	const li = document.createElement('li');
	const span = document.createElement('span');
	span.innerHTML = '0x' + ch.codePointAt(0).toString(16).toUpperCase();
	li.appendChild(span);
	if (glyphs.length > 0 && 'glyph' in glyphs[0])
		printInsertionGlyph(li, ch, { });
	glyphs.forEach(g => {
		if ('glyph' in g)
			printInsertionGlyph(li, g.glyph, g);
		else
			printInsertionGlyph(li, ch, g);
	});
	$('signs').appendChild(li);
}

function printInsertions() {
	const signs = Object.keys(Shapes.insertions).sort();
	hierojax.waitForFonts(() => signs.forEach(s => printInsertion(s), 0));
}

window.addEventListener("DOMContentLoaded", () => { printInsertions(); });
