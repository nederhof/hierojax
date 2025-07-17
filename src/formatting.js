class Shapes {
	measurements; // cached mapping from characters to measured properties
	constructor() {
		this.measurements = new Map();
	}
	static isDark(data, w, x, y) {
		return data[y * w * 4 + x * 4 + 3] +
		data[y * w * 4 + x * 4 + 0] +
		data[y * w * 4 + x * 4 + 1] +
		data[y * w * 4 + x * 4 + 2] > 0;
	}
	static margins(plane) {
		var t = 0;
		topMargin:
			for (let y = 0; y < plane.h; y++) {
				for (let x = 0; x < plane.w; x++)
					if (plane.isDark(x, y))
						break topMargin;
				t++;
			}
		var b = 0;
		bottomMargin:
			for (let y = plane.h-1; y >= 0; y--) {
				for (let x = 0; x < plane.w; x++)
					if (plane.isDark(x, y))
						break bottomMargin;
				b++;
			}
		var l = 0;
		leftMargin:
			for (let x = 0; x < plane.w; x++) {
				for (let y = 0; y < plane.h; y++)
					if (plane.isDark(x, y))
						break leftMargin;
				l++;
			}
		var r = 0;
		rightMargin:
			for (let x = plane.w-1; x >= 0; x--) {
				for (let y = 0; y < plane.h; y++)
					if (plane.isDark(x, y))
						break rightMargin;
				r++;
			}
		return { t, b, l, r };
	}
	static topMostDark(plane, x, yMin, yMax) {
		 for (let y = yMin; y <= yMax; y++)
			if (plane.isDark(x, y))
				return y;
		return NaN;
	}
	static bottomMostDark(plane, x, yMin, yMax) {
		 for (let y = yMax; y >= yMin; y--)
			if (plane.isDark(x, y))
				return y;
		return NaN;
	}
	static leftMostDark(plane, xMin, xMax, y) {
		 for (let x = xMin; x <= xMax; x++)
			if (plane.isDark(x, y))
				return x;
		return NaN;
	}
	static rightMostDark(plane, xMin, xMax, y) {
		for (let x = xMax; x >= xMin; x--)
			if (plane.isDark(x, y))
				return x;
		return NaN;
	}
	static orthogonalHullWithBuffer(canvas, dist) {
		const plane = Shapes.plane(canvas);
		const w = plane.w;
		const h = plane.h;
		const margins = Shapes.margins(plane);
		var xMins = [];
		var xMaxs = [];
		var yMins = [];
		var yMaxs = [];
		for (let x = -dist; x < w + dist; x++) {
			yMins[x] = h-1;
			yMaxs[x] = 0;
		}
		for (let y = -dist; y < h + dist; y++) {
			xMins[y] = w-1;
			xMaxs[y] = 0;
		}
		function addBufferedVertical(x, yMin, yMax) {
			for (let y = yMin; y <= yMax; y++) {
				xMins[y] = Math.min(xMins[y], x - dist);
				xMaxs[y] = Math.max(xMaxs[y], x + dist);
			}
		}
		function addBufferedHorizontal(xMin, xMax, y) {
			for (let x = xMin; x <= xMax; x++) {
				yMins[x] = Math.min(yMins[x], y - dist);
				yMaxs[x] = Math.max(yMaxs[x], y + dist);
			}
		}
		if (margins.t == h) {
			addBufferedHorizontal(0, w-1, 0);
			addBufferedHorizontal(0, w-1, h-1);
			addBufferedVertical(0, 0, h-1);
			addBufferedVertical(w-1, 0, h-1);
			const xMin = -dist;
			const xMax = w+dist-1;
			const yMin = -dist;
			const yMax = h+dist-1;
			return { w, h, xMins, xMaxs, yMins, yMaxs, xMin, xMax, yMin, yMax };
		}
		var x = margins.l;
		var y = Shapes.topMostDark(plane, x, margins.t, h-1-margins.b);
		var xOld = x;
		while (y > margins.t) {
			x += 1;
			const yNew = Shapes.topMostDark(plane, x, margins.t, y-1);
			if (yNew >= 0) {
				addBufferedHorizontal(xOld, x, y);
				addBufferedVertical(x, yNew, y);
				y = yNew;
				xOld = x;
			}
		}
		x = Shapes.rightMostDark(plane, x, w-1-margins.r, y);
		addBufferedHorizontal(xOld, x, y);
		var yOld = y;
		while (x < w-1-margins.r) {
			y += 1;
			const xNew = Shapes.rightMostDark(plane, x+1, w-1-margins.r, y);
			if (xNew >= 0) {
				addBufferedVertical(x, yOld, y);
				addBufferedHorizontal(x, xNew, y);
				x = xNew;
				yOld = y;
			}
		}
		y = Shapes.bottomMostDark(plane, x, y, h-1-margins.b);
		addBufferedVertical(x, yOld, y);
		xOld = x;
		while (y < h-1-margins.b) {
			x -= 1;
			const yNew = Shapes.bottomMostDark(plane, x, y+1, h-1-margins.b);
			if (yNew >= 0) {
				addBufferedHorizontal(x, xOld, y);
				addBufferedVertical(x, y, yNew);
				y = yNew;
				xOld = x;
			}
		}
		x = Shapes.leftMostDark(plane, margins.l, x, y);
		addBufferedHorizontal(x, xOld, y);
		yOld = y;
		while (x > margins.l) {
			y -= 1;
			const xNew = Shapes.leftMostDark(plane, margins.l, x-1, y);
			if (xNew >= 0) {
				addBufferedVertical(x, y, yOld);
				addBufferedHorizontal(xNew, x, y);
				x = xNew;
				yOld = y;
			}
		}
		y = Shapes.topMostDark(plane, x, margins.t, y);
		addBufferedVertical(x, y, yOld);
		const xMin = getMin(xMins);
		const xMax = getMax(xMaxs);
		const yMin = getMin(yMins);
		const yMax = getMax(yMaxs);
		return { w, h, xMins, xMaxs, yMins, yMaxs, xMin, xMax, yMin, yMax };
	}
	static prepareFont(ctx, fontSize, color) {
		ctx.font = fontSize.toString() + 'px Hieroglyphic';
		ctx.fillStyle = color;
		ctx.textBaseline = 'alphabetic';
	}
	static measureGlyph(ch, fontSize, xScale, yScale, rotate, mirror) {
		const canvas = document.createElement('canvas');
		var ctx = canvas.getContext('2d', { willReadFrequently: true });
		Shapes.prepareFont(ctx, fontSize, 'black');
		const width = Math.max(1, Math.round(ctx.measureText(ch).width));
		const height = Math.max(1, Math.round(fontSize));
		const widthScaled = Math.max(1, Math.round(xScale * ctx.measureText(ch).width));
		const heightScaled = Math.max(1, Math.round(yScale * fontSize));
		var marginH = 3;
		var marginV = 3;
		if (rotate % 180) {
			var dim = Math.max(widthScaled, heightScaled);
			if (rotate % 90)
				dim *= Math.sqrt(2);
			marginH += Math.ceil((dim - widthScaled) / 2);
			marginV += Math.ceil((dim - heightScaled) / 2);
		}
		const wCanvas = widthScaled + 2 * marginH;
		const hCanvas = heightScaled + 2 * marginV;
		canvas.width = wCanvas;
		canvas.height = hCanvas;
		ctx = canvas.getContext('2d', { willReadFrequently: true });
		Shapes.prepareFont(ctx, fontSize, 'black');
		ctx.translate(marginH + widthScaled/2, marginV + heightScaled/2);
		ctx.scale(mirror ? -xScale : xScale, yScale);
		ctx.rotate(rotate*Math.PI/180);
		ctx.fillText(ch, -width/2, height/2);
		var data = ctx.getImageData(0, 0, wCanvas, hCanvas).data;
		var margins = Shapes.margins({ w: wCanvas, h: hCanvas,
			isDark: (x,y) => Shapes.isDark(data, wCanvas, x, y) });
		const x = margins.l - marginH;
		const y = marginV - margins.b;
		const w = wCanvas - margins.l - margins.r;
		const h = hCanvas - margins.t - margins.b;
		return { width, height, widthScaled, heightScaled, x, y, w, h };
	}
	static propertiesKey(ch, fontSize, xScale, yScale, rotate, mirror) {
		return ch + ' ' +
			fontSize.toFixed(2) + ' ' +
			xScale.toFixed(2) + ' ' +
			yScale.toFixed(2) + ' ' +
			rotate + ' ' +
			Boolean(mirror);
	}
	measureGlyphMemo(ch, fontSize, xScale, yScale, rotate, mirror) {
		const key = Shapes.propertiesKey(ch, Shapes.MEASURE_SIZE, xScale, yScale, rotate, mirror);
		if (this.measurements.has(key)) {
			var meas = this.measurements.get(key);
		} else {
			var meas = Shapes.measureGlyph(ch, Shapes.MEASURE_SIZE, xScale, yScale, rotate, mirror);
			this.measurements.set(key, meas);
		}
		const scaleDown = fontSize / Shapes.MEASURE_SIZE;
		return { width: meas.width * scaleDown, height: meas.height * scaleDown,
					widthScaled: meas.widthScaled * scaleDown, heightScaled: meas.heightScaled * scaleDown,
					x: meas.x * scaleDown, y: meas.y * scaleDown, w: meas.w * scaleDown, h: meas.h * scaleDown };
	}
	emSizeOf(ch, fontSize, xScale, yScale, rotate, mirror) {
		const refHeight = this.measureGlyphMemo(Shapes.REFERENCE_GLYPH, fontSize, 1, 1, 0, false).h;
		const meas = this.measureGlyphMemo(ch, fontSize, xScale, yScale, rotate, mirror);
		return { w : meas.w / refHeight, h: meas.h / refHeight };
	}
	static plane(canvas) {
		const ctx = canvas.getContext('2d', { willReadFrequently: true });
		const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
		return { w: canvas.width, h: canvas.height,
					isDark: (x,y) => Shapes.isDark(data, canvas.width, x, y) };
	}
	static planeExtended(canvas) {
		const ctx = canvas.getContext('2d', { willReadFrequently: true });
		const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
		return { w: canvas.width, h: canvas.height,
					isDark: (x,y) =>
						0 <= x && x < canvas.width && 0 <= y && y < canvas.height &&
						Shapes.isDark(data, canvas.width, x, y) };
	}
	static planeRestricted(canvas) {
		const ctx = canvas.getContext('2d', { willReadFrequently: true });
		const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
		return { w: canvas.width, h: canvas.height,
					isDark: (x,y) =>
						x < 0 || canvas.width <= x || y < 0 || canvas.height <= y ||
						Shapes.isDark(data, canvas.width, x, y) };
	}
	static hDistance(canvas1, canvas2, yMin, yMax) {
		yMin = Math.round(yMin);
		yMax = Math.round(yMax);
		const plane1 = Shapes.plane(canvas1);
		const plane2 = Shapes.plane(canvas2);
		var distMin = canvas1.width + canvas2.width;
		for (let y = yMin; y < yMax; y++) {
			const rMost = Shapes.rightMostDark(plane1, 0, canvas1.width-1, y);
			const lMost = Shapes.leftMostDark(plane2, 0, canvas2.width-1, y);
			if (!isNaN(rMost) && !isNaN(lMost))
				distMin = Math.min(distMin, canvas1.width - 1 - rMost + lMost);
		}
		if (distMin < canvas1.width + canvas2.width)
			return distMin;
		else
			return 0;
	}
	static vDistance(canvas1, canvas2, xMin, xMax) {
		xMin = Math.round(xMin);
		xMax = Math.round(xMax);
		const plane1 = Shapes.plane(canvas1);
		const plane2 = Shapes.plane(canvas2);
		var distMin = canvas1.height + canvas2.height;
		for (let x = xMin; x < xMax; x++) {
			const bMost = Shapes.bottomMostDark(plane1, x, 0, canvas1.height-1);
			const tMost = Shapes.topMostDark(plane2, x, 0, canvas2.height-1);
			if (!isNaN(bMost) && !isNaN(tMost))
				distMin = Math.min(distMin, canvas1.height - 1 - bMost + tMost);
		}
		if (distMin < canvas1.height + canvas2.height)
			return distMin;
		else
			return 0;
	}
	static openRect(canvas, x, y) {
		const plane = Shapes.planeExtended(canvas);
		var rect = { x, y, w: 1, h: 1 };
		var extended = true;
		while (extended && rect.w < canvas.width & rect.h < canvas.height) {
			extended = false;
			if (rect.x > 0 &&
					isNaN(Shapes.topMostDark(plane, rect.x-1, rect.y, rect.y+rect.h-1))) {
				rect.x--;
				rect.w++;
				extended = true;
			}
			if (rect.x+rect.w < canvas.width &&
					isNaN(Shapes.topMostDark(plane, rect.x+rect.w, rect.y, rect.y+rect.h-1))) {
				rect.w++;
				extended = true;
			}
			if (rect.y > 0 &&
					isNaN(Shapes.leftMostDark(plane, rect.x, rect.x+rect.w-1, rect.y-1))) {
				rect.y--;
				rect.h++;
				extended = true;
			}
			if (rect.y+rect.h < canvas.height &&
					isNaN(Shapes.leftMostDark(plane, rect.x, rect.x+rect.w-1, rect.y+rect.h))) {
				rect.h++;
				extended = true;
			}
		}
		return rect;
	}
	static distances(plane, hull, pPlane, pHull, scalePrev, scale) {
		var l = Number.MIN_SAFE_INTEGER;
		var r = Number.MAX_SAFE_INTEGER;
		var t = Number.MIN_SAFE_INTEGER;
		var b = Number.MAX_SAFE_INTEGER;
		const lMax = pHull.x - hull.xMin;
		const rMax = hull.xMax - pHull.x;
		const tMax = pHull.y - hull.yMin;
		const bMax = hull.yMax - pHull.y;
		const wMax = Math.ceil(Math.max(lMax, rMax) * (scale - scalePrev)) + 1;
		const hMax = Math.ceil(Math.max(tMax, bMax) * (scale - scalePrev)) + 1;
		for (let x = 0; x < hull.w; x++) {
			const xPlane = Math.round(pPlane.x + (x - pHull.x) * scale);
			const yMin = hull.yMins[x];
			if (yMin <= pHull.y) {
				const distPrev = (pHull.y - yMin) * scalePrev;
				const dist = (pHull.y - yMin) * scale;
				const yPlane = Math.round(pPlane.y - dist);
				const yPlaneMin = Math.round(pPlane.y - dist - Math.max(dist-distPrev, hMax));
				const yPlaneMax = Math.round(pPlane.y - distPrev);
				const bottomMost = Shapes.bottomMostDark(plane, xPlane, yPlaneMin, yPlaneMax);
				if (!isNaN(bottomMost))
					t = Math.max(t, bottomMost - yPlane + 1);
			}
			const yMax = hull.yMaxs[x];
			if (yMax >= pHull.y) {
				const distPrev = (yMax - pHull.y) * scalePrev;
				const dist = (yMax - pHull.y) * scale;
				const yPlane = Math.round(pPlane.y + dist);
				const yPlaneMin = Math.round(pPlane.y + distPrev);
				const yPlaneMax = Math.round(pPlane.y + dist + Math.max(dist-distPrev, hMax));
				const topMost = Shapes.topMostDark(plane, xPlane, yPlaneMin, yPlaneMax);
				if (!isNaN(topMost))
					b = Math.min(b, topMost - yPlane - 1);
			}
		}
		for (let y = 0; y < hull.h; y++) {
			const yPlane = Math.round(pPlane.y + (y - pHull.y) * scale);
			const xMin = hull.xMins[y];
			if (xMin <= pHull.x) {
				const distPrev = (pHull.x - xMin) * scalePrev;
				const dist = (pHull.x - xMin) * scale;
				const xPlane = Math.round(pPlane.x - dist);
				const xPlaneMin = Math.round(pPlane.x - dist - Math.max(dist-distPrev, wMax));
				const xPlaneMax = Math.round(pPlane.x - distPrev);
				const rightMost = Shapes.rightMostDark(plane, xPlaneMin, xPlaneMax, yPlane);
				if (!isNaN(rightMost))
					l = Math.max(l, rightMost - xPlane + 1);
			}
			const xMax = hull.xMaxs[y];
			if (xMax >= pHull.x) {
				const distPrev = (xMax - pHull.x) * scalePrev;
				const dist = (xMax - pHull.x) * scale;
				const xPlane = Math.round(pPlane.x + dist);
				const xPlaneMin = Math.round(pPlane.x + distPrev);
				const xPlaneMax = Math.round(pPlane.x + dist + Math.max(dist-distPrev, wMax));
				const leftMost = Shapes.leftMostDark(plane, xPlaneMin, xPlaneMax, yPlane);
				if (!isNaN(leftMost))
					r = Math.min(r, leftMost - xPlane - 1);
			}
		}
		return { l, r, t, b };
	}
	static displacement(plane, hull, pPlane, pHull, scalePrev, scale) {
		const dist = Shapes.distances(plane, hull, pPlane, pHull, scalePrev, scale);
		const t = dist.t;
		const b = dist.b;
		const l = dist.l;
		const r = dist.r;
		var x = 0;
		var y = 0;
		if (l > 0)
			x = r >= l ? l : NaN;
		else if (r < 0)
			x = l <= r ? r : NaN;
		if (t > 0)
			y = b >= t ? t : NaN;
		else if (b < 0)
			y = t <= b ? b : NaN;
		if (isNaN(x)) {
			if (isNaN(y))
				return null;
			const yIncr = y > 0 ? y + 2 : y - 2;
			const pPlane2 = { x: pPlane.x, y: pPlane.y + yIncr };
			const dist2 = Shapes.distances(plane, hull, pPlane2, pHull, scalePrev, scale);
			if (dist2.l < 0 && dist2.r > 0 && dist2.t < 0 && dist2.b > 0) {
				x = 0;
				y = yIncr;
			} else
				return null;
		} else if (isNaN(y)) {
			const xIncr = x > 0 ? x + 2 : x - 2;
			const pPlane2 = { x: pPlane.x + xIncr, y: pPlane.y };
			const dist2 = Shapes.distances(plane, hull, pPlane2, pHull, scalePrev, scale);
			if (dist2.l < 0 && dist2.r > 0 && dist2.t < 0 && dist2.b > 0) {
				x = xIncr;
				y = 0;
			} else
				return null;
		}
		return { x, y };
	}
	static insertionPosition(place, adjustments) {
		switch (place) {
			case 'ts':
				var x = 0; var y = 0;
				break;
			case 'bs':
				var x = 0; var y = 1;
				break;
			case 'te':
				var x = 1; var y = 0;
				break;
			case 'be':
				var x = 1; var y = 1;
				break;
			case 'm':
				var x = 0.5; var y = 0.5;
				break;
			case 't':
				var x = 0.5; var y = 0;
				break;
			case 'b':
				var x = 0.5; var y = 1;
				break;
		}
		if ('x' in adjustments)
			x = adjustments.x;
		if ('y' in adjustments)
			y = adjustments.y;
		return { x, y };
	}
	static mirrorPlace(place) {
		switch (place) {
			case 'ts': return 'te';
			case 'bs': return 'be';
			case 'te': return 'ts';
			case 'be': return 'bs';
			default: return place;
		}
	}
	static allowedPlaces(ch, rot, mirror) {
		var places = new Set();
		if (ch in Shapes.insertions)
			for (const alt of Shapes.insertions[ch]) {
				const altRot = alt.rot ? alt.rot : 0;
				if (rot == altRot)
					for (const p in alt)
						if (Group.INSERTION_PLACES.includes(p))
							places.add(mirror ? Shapes.mirrorPlace(p) : p);
			}
		return places;
	}
	static allowedRotations(ch) {
		return ch in Shapes.rotations ?
			Object.keys(Shapes.rotations[ch]).map(rot => Number(rot)) : [];
	}
	static mirrorAdjustment(adjustment) {
		var mirrored = { };
		for (let key in adjustment)
			if (key == 'x')
				mirrored.x = 1 - adjustment[key];
			else
				mirrored.y = adjustment[key];
		return mirrored;
	}
	static mirrorAdjustments(adjustments) {
		var mirrored = { };
		for (let key in adjustments) {
			switch (key) {
				case 'ts':
					mirrored['te'] = Shapes.mirrorAdjustment(adjustments[key]);
					break;
				case 'bs':
					mirrored['be'] = Shapes.mirrorAdjustment(adjustments[key]);
					break;
				case 'te':
					mirrored['ts'] = Shapes.mirrorAdjustment(adjustments[key]);
					break;
				case 'be':
					mirrored['bs'] = Shapes.mirrorAdjustment(adjustments[key]);
					break;
				case 'm':
					mirrored['m'] = Shapes.mirrorAdjustment(adjustments[key]);
					break;
				case 't':
					mirrored['t'] = Shapes.mirrorAdjustment(adjustments[key]);
					break;
				case 'b':
					mirrored['b'] = Shapes.mirrorAdjustment(adjustments[key]);
					break;
				default:
					mirrored[key] = adjustments[key];
					break;
			}
		}
		return mirrored;
	}
	memoOverlayLigatures() {
		if (!this.overlayLigatures) {
			this.overlayLigatures = new Map();
			for (const ch in Shapes.ligatures) {
				const lig = Shapes.ligatures[ch];
				if (lig.type == 'overlay' && !lig.alt) {
					const horizontal = lig.horizontal;
					const vertical = lig.vertical;
					const first = horizontal[0].ch;
					if (!this.overlayLigatures.has(first))
						this.overlayLigatures.set(first, []);
					this.overlayLigatures.get(first).push(ch);
				}
			}
		}
		return this.overlayLigatures;
	}
}
const shapes = new Shapes();
Shapes.REFERENCE_GLYPH = '\u{13000}'; // sitting man
Shapes.OUTLINE = '\uE45C';
Shapes.WALLED_OUTLINE = '\uE45D';
Shapes.PLACEHOLDER = '\uFFFD';
Shapes.ENCLOSURE_THICKNESS = 0.11; // EM distance between outer border of enclosure and content
Shapes.WALLED_ENCLOSURE_THICKNESS = 0.13; // same for walled enclosure
Shapes.MEASURE_SIZE = 150;
Shapes.rotatedChars = {
'\uE45C': '\uE462',
'\uE45D': '\uE463',
'\u{13258}': '\uE464',
'\u{13259}': '\uE465',
'\u{1325A}': '\uE466',
'\u{1325B}': '\uE467',
'\u{1325C}': '\uE468',
'\u{1325D}': '\uE469',
'\u{13282}': '\uE46A',
'\u{13286}': '\uE46B',
'\u{13287}': '\uE46C',
'\u{13288}': '\uE46D',
'\u{13289}': '\uE46E',
'\u{13379}': '\uE46F',
'\u{1337A}': '\uE470',
'\u{1337B}': '\uE471',
'\u{1342F}': '\uE472' };

class PrintedAny {
	element;
	w;
	h;
	wPx;
	hPx;
	reversed;
	options;
	fontSize;
	constructor(element, w, h, wAccum, hAccum, reversed, options) {
		this.element = element;
		this.w = w;
		this.h = h;
		this.fontSize = options.fontsize;
		this.wPx = this.emToPx(w);
		this.hPx = this.emToPx(h);
		this.wAccum = wAccum;
		this.hAccum = hAccum;
		this.reversed = reversed;
		this.options = options;
	}
	width() {
		return this.wPx;
	}
	height() {
		return this.hPx;
	}
	emToPx(a) {
		return this.fontSize * a;
	}
	reverse(x, w) {
		return this.reversed ? this.w - (x+w) : x;
	}
	addText(text) {
	}
	static correctedMeasurement(ch, fontSize, xScale, yScale, rotate, mirror, properties) {
		var meas = shapes.measureGlyphMemo(ch, fontSize, xScale, yScale, rotate, mirror);
		if (properties.xAs) {
			const measAs = shapes.measureGlyphMemo(properties.xAs, fontSize, 1, 1, rotate, mirror);
			meas.x = measAs.x;
			meas.width = measAs.width;
			meas.widthScaled = measAs.widthScaled;
		} else if (properties.yAs) {
			const measAs = shapes.measureGlyphMemo(properties.yAs, fontSize, 1, 1, rotate, mirror);
			meas.y = measAs.y;
			meas.h = measAs.h;
			meas.heightScaled = measAs.heightScaled;
		} else if (xScale != 1) {
			var measPlain = shapes.measureGlyphMemo(ch, fontSize, 1, 1, rotate, mirror);
			meas.y = measPlain.y;
			meas.h = measPlain.h;
			meas.heightScaled = measPlain.heightScaled;
		} else if (yScale != 1) {
			var measPlain = shapes.measureGlyphMemo(ch, fontSize, 1, 1, rotate, mirror);
			meas.x = measPlain.x;
			meas.width = measPlain.width;
			meas.widthScaled = measPlain.widthScaled;
		}
		return meas;
	}
	addLog(message) {
		if (this.options.log) {
			console.error(message);
		}
	}
}

class PrintedCanvas extends PrintedAny {
	canvas;
	constructor(element, w, h, wAccum, hAccum, reversed, options) {
		super(element, w, h, wAccum, hAccum, reversed, options);
		this.canvas = document.createElement('canvas');
		this.canvas.width = Math.ceil(this.wPx);
		this.canvas.height = Math.ceil(this.hPx);
		if (this.element) {
			this.element.appendChild(this.canvas);
			if (!this.options.separated)
				this.element.style.setProperty('height', this.canvas.height.toFixed(2) + 'px');
		}
		this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
		if (this.options.border && !this.options.separated) {
			this.ctx.beginPath();
			this.ctx.rect(0, 0, this.canvas.width, this.canvas.height);
			this.ctx.stroke();
		}
	}
	width() {
		return this.canvas.width;
	}
	height() {
		return this.canvas.height;
	}
	addText(text) {
		const hidden = document.createElement('div');
		hidden.className = 'hierojax-canvas-hidden';
		hidden.innerHTML = text;
		this.element.appendChild(hidden);
	}
	addSign(ch, scale, xScale, yScale, rotate, mirror, rect, properties) {
		const x = this.reverse(rect.x, rect.w);
		mirror = this.reversed ^ mirror;
		const xPx = Math.round(this.emToPx(x));
		const yPx = Math.round(this.emToPx(rect.y));
		const fontSize = Math.floor(this.fontSize * scale);
		const fontColor = properties.bracket ? this.options.bracketcolor : this.options.signcolor;
		const meas = PrintedAny.correctedMeasurement(ch, fontSize, xScale, yScale, rotate, mirror, properties);
		this.ctx.save();
		Shapes.prepareFont(this.ctx, fontSize, fontColor);
		this.ctx.translate(xPx + meas.widthScaled/2 - meas.x, yPx - meas.heightScaled/2 + meas.h - meas.y);
		this.ctx.scale(mirror ? -xScale : xScale, yScale);
		this.ctx.rotate(rotate*Math.PI/180);
		this.ctx.fillText(ch, -meas.width/2, meas.height/2);
		this.ctx.restore();
	}
	addShading(x, y, w, h) {
		x = this.reverse(x, w);
		const xMin = Math.round(this.emToPx(x));
		const yMin = Math.round(this.emToPx(y));
		const xMax = Math.round(this.emToPx(x+w));
		const yMax = Math.round(this.emToPx(y+h));
		const width = xMax - xMin;
		const height = yMax - yMin;
		if (this.options.shadepattern == 'uniform') {
			this.ctx.save();
			this.ctx.fillStyle = 'rgba(0,0,0,.3)';
			this.ctx.fillRect(xMin, yMin, width, height);
			this.ctx.restore();
		} else {
			this.ctx.save();
			this.ctx.fillStyle = 'rgba(0,0,0,.3)';
			for (let px = 0; px < width; px++)
				for (let py = 0; py < height; py++)
					if ((this.wAccum+xMin+px + this.hAccum+yMin+py) % 4 == 0) {
						this.ctx.beginPath();
						this.ctx.arc(xMin+px, yMin+py, 1, 0, 2 * Math.PI);
						this.ctx.fill();
					}
			this.ctx.restore();
		}
	}
	addHidden(s) {
	}
	static initialize(element, w, h, wAccum, yAccum, reversed, options) {
		return new PrintedCanvas(element, w, h, wAccum, yAccum, reversed, options);
	}
}

class PrintedCanvasWithoutExtras extends PrintedCanvas {
	constructor(fontSize, w, h) {
		super(null, w, h, 0, 0, false, { fontsize: fontSize, signcolor: 'black' });
	}
	addSign(ch, scale, xScale, yScale, rotate, mirror, rect, properties) {
		if (!properties.extra)
			super.addSign(ch, scale, xScale, yScale, rotate, mirror, rect, properties);
	}
	addShading(x, y, w, h) {
		/* omitted */
	}
	static initialize(fontSize, w, h) {
		return new PrintedCanvasWithoutExtras(fontSize, w, h);
	}
}

class PrintedDOM extends PrintedAny {
	constructor(element, w, h, wAccum, hAccum, reversed, options) {
		super(element, w, h, wAccum, hAccum, reversed, options);
		if (this.options.separated) {
			this.dom = document.createElement('span');
			this.dom.className = 'hierojax';
			this.element.appendChild(this.dom);
		} else {
			this.dom = this.element;
			if (this.options.border)
				this.element.classList.add('hierojax-border');
		}
		this.dom.style.setProperty('width', this.wPx.toFixed(2) + 'px');
		this.dom.style.setProperty('height', this.hPx.toFixed(2) + 'px');
	}
	addSign(ch, scale, xScale, yScale, rotate, mirror, rect, properties) {
		const x = this.reverse(rect.x, rect.w);
		mirror = this.reversed ^ mirror;
		const fontSize = this.emToPx(scale);
		const fontSizeStr = fontSize.toFixed(2);
		const xPx = this.emToPx(x);
		const yPx = this.emToPx(rect.y);
		const xScaleStr = xScale.toFixed(2);
		const yScaleStr = yScale.toFixed(2);
		const meas = PrintedAny.correctedMeasurement(ch, fontSize, xScale, yScale, rotate, mirror, properties);
		const sign = document.createElement('div');
		sign.className = properties.unselectable ? 'hierojax-dom-visual' : 'hierojax-dom-sign';
		sign.innerHTML = ch;
		sign.style.setProperty('font-size', fontSizeStr + 'px');
		/* line-height gives better result on Linux, but doesn't work at all on Mac OS */
		if (isLinux())
			sign.style.setProperty('line-height', fontSizeStr + 'px');
		else
			sign.style.setProperty('height', fontSizeStr + 'px');
		sign.style.setProperty('color', properties.bracket ? this.options.bracketcolor : this.options.signcolor);
		var transforms = '';
		transforms += 'translate(' +
			(xPx + meas.widthScaled/2 - meas.x).toFixed(2) + 'px,' +
			(yPx - meas.heightScaled/2 + meas.h - meas.y).toFixed(2) + 'px) ';
		transforms += 'scale(' + (mirror ? -xScaleStr : xScaleStr) + ',' + yScaleStr + ') ';
		if (rotate)
			transforms += 'rotate(' + rotate.toString() + 'deg) ';
		sign.style.setProperty('left', (-meas.width/2).toFixed(2) + 'px');
		sign.style.setProperty('bottom', (this.hPx-meas.height/2).toFixed(2) + 'px');
		sign.style.setProperty('transform', transforms);
		this.dom.appendChild(sign);
	}
	addShading(x, y, w, h) {
		x = this.reverse(x, w);
		const xPx = this.emToPx(x);
		const yPx = this.emToPx(y);
		var wPx = this.emToPx(w);
		var hPx = this.emToPx(h);
		const shadingDiagonalPeriod = 6;
		const dx = (xPx+yPx+this.wAccum+this.hAccum) % (shadingDiagonalPeriod * Math.sqrt(2));
		var wBack = wPx + dx;
		if (xPx + wPx < this.wPx-1) {
			wPx += 0.01;
			wBack += 0.01;
		}
		if (hPx + hPx < this.hPx-1) {
			hPx += 0.1;
		}
		const shade = document.createElement('div');
		if (this.options.shadepattern == 'uniform') {
			shade.className = 'hierojax-dom-uniform';
		} else {
			shade.className = 'hierojax-dom-hatching';
		}
		shade.style.setProperty('background-size',
			wBack.toFixed(3) + 'px ' + hPx.toFixed(3) + 'px');
		shade.style.setProperty('background-position', (-dx).toFixed(3) + 'px 0px');
		shade.style.setProperty('width', wPx.toFixed(3) + 'px');
		shade.style.setProperty('height', hPx.toFixed(3) + 'px');
		shade.style.setProperty('left', xPx.toFixed(3) + 'px');
		shade.style.setProperty('top', yPx.toFixed(3) + 'px');
		this.dom.appendChild(shade);
	}
	addHidden(s) {
		const hidden = document.createElement('div');
		hidden.className = 'hierojax-dom-hidden';
		hidden.innerHTML = s;
		this.dom.appendChild(hidden);
	}
	static initialize(element, w, h, wAccum, yAccum, reversed, options) {
		return new PrintedDOM(element, w, h, wAccum, yAccum, reversed, options);
	}
}

class PrintedSVG extends PrintedAny {
	constructor(element, w, h, wAccum, hAccum, reversed, options) {
		super(element, w, h, wAccum, hAccum, reversed, options);
		this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		this.svg.setAttribute('width', this.width());
		this.svg.setAttribute('height', this.height());
		if (this.options.border && !this.options.separated)
			this.svg.classList.add('hierojax-border');
		if (options.standalone) {
			const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
			style.setAttribute('type', 'text/css');
			style.innerHTML = PrintedSVG.internalCSS();
			this.svg.appendChild(style);
		}
		this.element.appendChild(this.svg);
	}
	width() {
		return Math.ceil(this.wPx);
	}
	height() {
		return Math.ceil(this.hPx);
	}
	addSign(ch, scale, xScale, yScale, rotate, mirror, rect, properties) {
		const x = this.reverse(rect.x, rect.w);
		mirror = this.reversed ^ mirror;
		const fontSize = this.emToPx(scale);
		const fontSizeStr = fontSize.toFixed(2);
		const xPx = this.emToPx(x);
		const yPx = this.emToPx(rect.y);
		const xScaleStr = xScale.toFixed(2);
		const yScaleStr = yScale.toFixed(2);
		const meas = PrintedAny.correctedMeasurement(ch, fontSize, xScale, yScale, rotate, mirror, properties);
		const sign = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		sign.setAttribute('class', properties.unselectable ? 'hierojax-svg-visual' : 'hierojax-svg-sign');
		sign.innerHTML = ch;
		sign.style.setProperty('font-size', fontSizeStr + 'px');
		sign.style.setProperty('line-height', fontSizeStr + 'px');
		sign.setAttribute('fill', properties.bracket ? this.options.bracketcolor : this.options.signcolor);
		var transforms = '';
		transforms += 'translate(' +
			(xPx + meas.widthScaled/2 - meas.x).toFixed(2) + ' ' +
			(yPx - meas.heightScaled/2 + meas.h - meas.y).toFixed(2) + ') ';
		transforms += 'scale(' + (mirror ? -xScaleStr : xScaleStr) + ' ' + yScaleStr + ') ';
		if (rotate)
			transforms += 'rotate(' + rotate.toString() + ') ';
		sign.setAttribute('x', (-meas.width/2).toFixed(2));
		sign.setAttribute('y', (meas.height/2).toFixed(2));
		sign.setAttribute('transform', transforms);
		this.svg.appendChild(sign);
	}
	addShading(x, y, w, h) {
		x = this.reverse(x, w);
		const xMin = Math.round(this.emToPx(x));
		const yMin = Math.round(this.emToPx(y));
		const xMax = Math.round(this.emToPx(x+w));
		const yMax = Math.round(this.emToPx(y+h));
		const width = xMax - xMin;
		const height = yMax - yMin;
		const shade = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		if (this.options.shadepattern == 'uniform') {
			shade.setAttribute('class', 'hierojax-svg-uniform');
		} else {
			const id = this.shadePattern((this.wAccum+this.hAccum) % 4);
			shade.setAttribute('fill', 'url(#' + id + ')');
		}
		shade.setAttribute('x', xMin);
		shade.setAttribute('y', yMin);
		shade.setAttribute('width', width);
		shade.setAttribute('height', height);
		this.svg.insertBefore(shade, this.svg.firstChild);
	}
	addHidden(s) {
		const hidden = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		hidden.setAttribute('class', 'hierojax-svg-hidden');
		hidden.innerHTML = s;
		this.svg.appendChild(hidden);
	}
	shadePattern(offset) {
		const id = 'hierojax-svg-id' + offset;
		if (document.getElementById(id))
			return id;
		const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
		const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
		pattern.setAttribute('id', id);
		pattern.setAttribute('patternUnits', 'userSpaceOnUse');
		pattern.setAttribute('width', '4');
		pattern.setAttribute('height', '4');
		pattern.setAttribute('patternTransform', 'translate(' + -offset + ' 0)');
		const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		path.setAttribute('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2');
		path.setAttribute('class', 'hierojax-svg-hatching');
		pattern.appendChild(path);
		defs.appendChild(pattern);
		this.svg.insertBefore(defs, this.svg.firstChild);
		return id;
	}
	static initialize(element, w, h, wAccum, yAccum, reversed, options) {
		return new PrintedSVG(element, w, h, wAccum, yAccum, reversed, options);
	}
	static internalCSS() {
		const font = PrintedSVG.EXTERNAL_FONT;
		return `
@font-face {
	font-family: 'NewGardiner';
	src: url('${font}') format('truetype');
}
.hierojax-svg-sign {
	font-family: NewGardiner;
}
.hierojax-svg-visual {
	font-family: NewGardiner;
	user-select: none;
	-ms-user-select: none;
	-webkit-user-select: none;
	pointer-events: none;
}
.hierojax-svg-hatching {
	stroke: gray;
	stroke-width: 1;
}
.hierojax-svg-uniform {
	fill: gray;
}
.hierojax-svg-hidden {
	font-size: 0;
}`;
	}
}
PrintedSVG.EXTERNAL_FONT = 'NewGardiner.ttf';

class Group {
	scale;
	x;
	y;
	w;
	h;
	constructor() {
		this.scale = 1;
	}
	resize(f) {
		this.scale *= f;
	}
	fit(options, w, h) {
		const size = this.size(options);
		var f = 1.0;
		if (w < Infinity && size.w > 0)
			f = Math.min(f, w / size.w);
		if (h < Infinity && size.h > 0)
			f = Math.min(f, h / size.h);
		this.resize(f);
	}
	static h(options) {
		return ['hlr', 'hrl'].includes(options.dir);
	}
	static v(options) {
		return ['vlr', 'vrl'].includes(options.dir);
	}
	static rl(options) {
		return ['hrl', 'vrl'].includes(options.dir);
	}
	static numToDamage(n) {
		return n ? String.fromCodePoint(Group.DAMAGE_BASE + n) : '';
	}
	static numToVariation(n) {
		return n ? String.fromCodePoint(Group.VARIATION_BASE + n) : '';
	}
	static numToRotate(n) {
		switch (n) {
			case 1: return 90;
			case 2: return 180;
			case 3: return 270;
			case 4: return 45;
			case 5: return 135;
			case 6: return 225;
			case 7: return 315;
			default: return 0;
		}
	}
	static rotateToNum(r) {
		switch (r) {
			case 90: return 1;
			case 180: return 2;
			case 270: return 3;
			case 45: return 4;
			case 135: return 5;
			case 225: return 6;
			case 315: return 7;
			default: return 0;
		}
	}
	static damageAreas(damage, x0, x1, x2, y0, y1, y2) {
		if (damage == 15)
			return [{ x: x0, y: y0, w: x2-x0, h: y2-y0 }];
		var areas = [];
		if (damage & 1)
			areas.push({ x: x0, y: y0, w: x1-x0, h: y1-y0 });
		if (damage & 2)
			areas.push({ x: x0, y: y1, w: x1-x0, h: y2-y1 });
		if (damage & 4)
			areas.push({ x: x1, y: y0, w: x2-x1, h: y1-y0});
		if (damage & 8)
			areas.push({ x: x1, y: y1, w: x2-x1, h: y2-y1 });
		return areas;
	}
	static measureOptions(options) {
		const dir = Group.h(options) ? 'hlr' : 'vlr';
		return { dir, fontsize: 50, sep: options.sep };
	}
}
Group.VER = '\u{13430}';
Group.HOR = '\u{13431}';
Group.INSERT_TS = '\u{13432}';
Group.INSERT_BS = '\u{13433}';
Group.INSERT_TE = '\u{13434}';
Group.INSERT_BE = '\u{13435}';
Group.OVERLAY = '\u{13436}';
Group.BEGIN_SEGMENT = '\u{13437}';
Group.END_SEGMENT = '\u{13438}';
Group.INSERT_M = '\u{13439}';
Group.INSERT_T = '\u{1343A}';
Group.INSERT_B = '\u{1343B}';
Group.BEGIN_ENCLOSURE = '\u{1343C}';
Group.END_ENCLOSURE = '\u{1343D}';
Group.BEGIN_WALLED_ENCLOSURE = '\u{1343E}';
Group.END_WALLED_ENCLOSURE = '\u{1343F}';
Group.MIRROR = '\u{13440}';
Group.FULL_BLANK = '\u{13441}';
Group.HALF_BLANK = '\u{13442}';
Group.FULL_LOST = '\u{13443}';
Group.HALF_LOST = '\u{13444}';
Group.TALL_LOST = '\u{13445}';
Group.WIDE_LOST = '\u{13446}';
Group.INSERTION_CHARS = [Group.INSERT_TS, Group.INSERT_BS, Group.INSERT_TE, Group.INSERT_BE,
		Group.INSERT_M, Group.INSERT_T, Group.INSERT_B];
Group.INSERTION_PLACES = ['ts', 'bs', 'te', 'be', 'm', 't', 'b'];
Group.DAMAGE_BASE = 0x13446;
Group.VARIATION_BASE = 0xFDFF;

class Fragment extends Group {
	groups; // array of Vertical/Horizontal/Enclosure/Basic/Overlay/Literal/Singleton/Blank/Lost
	constructor(groups) {
		super();
		this.groups = groups;
	}
	toString() {
		return this.groups.map(g => g.toString()).join('');
	}
	size(options) {
		const sizes = this.groups.map(g => g.size(options));
		if (Group.h(options)) {
			const w = getSum(sizes.map(s => s.w)) +
				options.sep * Math.max(this.groups.length-1, 0);
			const h = Math.max(getMax(sizes.map(s => s.h)), options.linesize);
			return { w, h };
		} else {
			const w = Math.max(getMax(sizes.map(s => s.w)), options.linesize);
			const h = getSum(sizes.map(s => s.h)) +
				options.sep * Math.max(this.groups.length-1, 0);
			return { w, h };
		}
	}
	format(options) {
		if (Group.h(options)) {
			this.groups.forEach(g => g.fit(options, Infinity, options.linesize));
			var x0 = 0;
			var x = options.sep / 2;
			var y0 = 0;
			var y1 = options.sep / 2;
			var y2 = y1 + options.linesize;
			var y3 = options.linesize + options.sep;
			for (let i = 0; i < this.groups.length; i++) {
				const group = this.groups[i];
				var x1 = x + group.size(options).w;
				if (i < this.groups.length-1 || options.separated)
					var x2 = x1 + options.sep / 2;
				else
					var x2 = this.size(options).w + options.sep;
				group.format(options, x0, x, x1, x2, y0, y1, y2, y3);
				if (!options.separated) {
					x0 = x2;
					x = x1 + options.sep;
				}
			}
		} else {
			this.groups.forEach(g => g.fit(options, options.linesize, Infinity));
			var x0 = 0;
			var x1 = options.sep / 2;
			var x2 = x1 + options.linesize;
			var x3 = options.linesize + options.sep;
			var y0 = 0;
			var y = options.sep / 2;
			for (let i = 0; i < this.groups.length; i++) {
				const group = this.groups[i];
				var y1 = y + group.size(options).h;
				if (i < this.groups.length-1 || options.separated)
					var y2 = y1 + options.sep / 2;
				else
					var y2 = this.size(options).h + options.sep;
				group.format(options, x0, x1, x2, x3, y0, y, y1, y2);
				if (!options.separated) {
					y0 = y2;
					y = y1 + options.sep;
				}
			}
		}
	}
	print(element, options) {
		options.dir = options.dir || 'hlr';
		options.linesize = Number(options.linesize) || 1;
		options.fontsize = options.fontsize || 22;
		options.sep = Number(options.sep) || 0.07;
		options.separated = options.separated == 'true';
		options.type = options.type || 'svg';
		options.signcolor = options.signcolor || 'black';
		options.bracketcolor = options.bracketcolor || 'black';
		options.shadepattern = options.shadepattern || 'uniform';
		options.align = options.align || 'middle';
		options.border = options.border == 'true';
		options.standalone = options.standalone == 'true';
		options.log = options.log == 'true';
		const initializer = options.type == 'canvas' ? PrintedCanvas.initialize :
				options.type == 'svg' ? PrintedSVG.initialize :
				PrintedDOM.initialize;
		this.format(options);
		var wAccum = 0;
		var hAccum = 0;
		const size = this.size(options);
		const widthSep = size.w + options.sep;
		const heightSep = size.h + options.sep;
		if (options.separated) {
			if (options.dir == 'hrl') {
				element.className = 'hierojax-hrl-container';
			} else if (options.dir == 'hlr') {
				element.className = 'hierojax-hlr-container';
			} else {
				element.className = 'hierojax-v-container';
			}
			if (Group.v(options)) {
				element.style['width'] = Math.ceil(options.fontsize * widthSep).toFixed(2) + 'px';
				element.style['height'] = Math.ceil(options.fontsize * heightSep).toFixed(2) + 'px';
			}
			if (options.border)
				element.classList.add('hierojax-border');
			this.groups.forEach(g => {
				const sizeSub = g.size(options);
				const width = Group.v(options) ? Math.max(options.linesize, sizeSub.w) : sizeSub.w;
				const height = Group.h(options) ? Math.max(options.linesize, sizeSub.h) : sizeSub.h;
				const widthSubSep = width + options.sep;
				const heightSubSep = height + options.sep;
				var printed = initializer(element, widthSubSep, heightSubSep, wAccum, hAccum, Group.rl(options), options);
				g.print(options, printed);
				if (Group.h(options))
					wAccum += printed.width();
				else
					hAccum += printed.height();
			});
		} else {
			var printed = initializer(element, widthSep, heightSep, wAccum, hAccum, Group.rl(options), options);
			printed.addText(this.toString());
			this.groups.forEach(g => g.print(options, printed));
		}
	}
}

class Vertical extends Group {
	groups; // array of Horizontal/Enclosure/Basic/Overlay/Literal/Blank/Lost
	constructor(groups) {
		super();
		this.groups = groups;
	}
	toString() {
		return this.groups.map(g => g.toString()).join(Group.VER);
	}
	size(options) {
		const sizes = this.groups.map(g => g.size(options));
		const w = getMax(sizes.map(s => s.w));
		const h = getSum(sizes.map(s => s.h)) +
			this.scale * options.sep * (this.groups.length-1);
		return { w, h };
	}
	netHeight(options) {
		return getSum(this.groups.map(g => Vertical.netHeightOf(g, options)));
	}
	resize(f) {
		super.resize(f);
		this.groups.forEach(g => g.resize(f));
	}
	fit(options, w, h) {
		this.groups.forEach(g => Vertical.fitProperGroups(g, options, 1, Infinity));
		super.fit(options, w, h);
	}
	format(options, x0, x1, x2, x3, y0, y1, y2, y3) {
		const netHeight = this.netHeight(options);
		const buf = ((y2-y1) - netHeight) / (this.groups.length-1 + this.nestedVerticalSpaces());
		for (let i = 0; i < this.groups.length; i++) {
			const group = this.groups[i];
			if (i < this.groups.length-1) {
				const h = Vertical.netHeightOf(group, options);
				var y4 = y1 + h + Vertical.nestedVerticalSpacesOf(group) * buf;
				var y5 = y4 + buf / 2;
			} else {
				var y4 = y2;
				var y5 = y3;
			}
			group.format(options, x0, x1, x2, x3, y0, y1, y4, y5);
			y0 = y5;
			y1 = y4 + buf;
		}
	}
	nestedVerticalSpaces() {
		return getSum(this.groups.map(Vertical.nestedVerticalSpacesOf));
	}
	static fitProperGroups(group, options, w, h) {
		if (group instanceof Horizontal) {
			const properGroups = group.properGroups();
			if (properGroups.length == 1) {
				const properGroup = properGroups[0];
				if (properGroup instanceof Vertical) {
					Vertical.fitProperGroups(properGroup, options, w, h);
					return;
				}
			}
		}
		group.fit(options, w, h);
	}
	static nestedVerticalSpacesOf(group) {
		if (group instanceof Horizontal) {
			const properGroups = group.properGroups();
			if (properGroups.length == 1) {
				const properGroup = properGroups[0];
				if (properGroup instanceof Vertical)
					return properGroup.groups.length - 1;
			}
		}
		return 0;
	}
	static netHeightOf(group, options) {
		if (group instanceof Horizontal) {
			const properGroups = group.properGroups();
			if (properGroups.length == 1) {
				const properGroup = properGroups[0];
				if (properGroup instanceof Vertical)
					return Vertical.netHeightOf(properGroup, options);
			}
		} else if (group instanceof Vertical) {
			const sizes = group.groups.map(g => Vertical.netHeightOf(g, options));
			return getSum(sizes);
		}
		return group.size(options).h;
	}
	print(options, printed) {
		for (let i = 0; i < this.groups.length; i++) {
			if (i > 0)
				printed.addHidden(Group.VER);
			const group = this.groups[i];
			group.print(options, printed);
		}
	}
}

class Horizontal extends Group {
	groups; // array of Vertical/Enclosure/Basic/Overlay/Literal/Blank/Lost/BracketOpen/BracketClose
	constructor(groups) {
		super();
		this.groups = groups;
	}
	toString() {
		var s = '';
		for (let i = 0; i < this.groups.length; i++) {
			const group = this.groups[i];
			if (i > 0 && !(this.groups[i-1] instanceof BracketOpen) &&
						!(group instanceof BracketClose))
				s += Group.HOR;
			if (group instanceof Vertical)
				s += Group.BEGIN_SEGMENT + group.toString() + Group.END_SEGMENT;
			else
				s += group.toString();
		}
		return s;
	}
	size(options) {
		const sizes = this.groups
				.filter(g => !(g instanceof BracketOpen || g instanceof BracketClose))
				.map(g => g.size(options));
		const w = getSum(sizes.map(s => s.w)) +
			this.scale * options.sep * (sizes.length-1);
		const h = getMax(sizes.map(s => s.h));
		return { w, h };
	}
	netWidth(options) {
		return getSum(this.groups
				.filter(g => !(g instanceof BracketOpen || g instanceof BracketClose))
				.map(g => g.size(options).w));
	}
	resize(f) {
		super.resize(f);
		this.groups.forEach(g => g.resize(f));
	}
	fit(options, w, h) {
		this.groups.forEach(g => g.fit(options, Infinity, 1));
		super.fit(options, w, h);
	}
	format(options, x0, x1, x2, x3, y0, y1, y2, y3) {
		const properGroups = this.properGroups();
		if (properGroups.length == 1) {
			const first = this.groups[0];
			const last = this.groups[this.groups.length-1];
			if (first instanceof BracketOpen) {
				first.format(options, x0, y0, x1-x0, y3-y0);
				x0 = x1;
			}
			if (last instanceof BracketClose) {
				last.format(options, x2, y0, x3-x2, y3-y0);
				x3 = x2;
			}
			properGroups[0].format(options, x0, x1, x2, x3, y0, y1, y2, y3);
		} else {
			const netWidth = this.netWidth(options);
			const buf = ((x2-x1) - netWidth) / (properGroups.length-1);
			for (let i = 0; i < this.groups.length; i++) {
				const group = this.groups[i];
				if (group instanceof BracketOpen) {
					group.format(options, x0, y0, x1-x0, y3-y0);
					x0 = x1;
				} else if (!(group instanceof BracketClose)) {
					if (i < this.groups.length-1) {
						var x4 = x1 + group.size(options).w;
						const next = this.groups[i+1];
						if (next instanceof BracketClose) {
							next.format(options, x4, y0, buf / 2, y3-y0);
							var x5 = x4;
							var x6 = x5 + buf / 2;
						} else {
							var x5 = x4 + buf / 2;
							var x6 = x5;
						}
					} else {
						var x4 = x2;
						var x5 = x3;
						var x6 = x5;
					}
					group.format(options, x0, x1, x4, x5, y0, y1, y2, y3);
					x0 = x6;
					x1 = x4 + buf;
				}
			}
		}
	}
	properGroups() {
		return this.groups.filter(g => !(g instanceof BracketOpen || g instanceof BracketClose));
	}
	print(options, printed) {
		for (let i = 0; i < this.groups.length; i++) {
			const group = this.groups[i];
			if (i > 0 && !(this.groups[i-1] instanceof BracketOpen) &&
						!(group instanceof BracketClose))
				printed.addHidden(Group.HOR);
			if (group instanceof Vertical) {
				printed.addHidden(Group.BEGIN_SEGMENT);
				group.print(options, printed);
				printed.addHidden(Group.END_SEGMENT);
			} else {
				group.print(options, printed);
			}
		}
	}
}

class Enclosure extends Group {
	type; // 'plain' or 'walled'
	groups; // array of Vertical/Horizontal/Enclosure/Basic/Overlay/Literal/Singleton/Blank/Lost
	delimOpen; // character/null
	damageOpen; // 0 -- 15
	delimClose; // character/null
	damageClose; // 0 -- 15
	constructor(type, groups, delimOpen, damageOpen, delimClose, damageClose) {
		super();
		this.type = type;
		this.groups = groups;
		this.delimOpen = delimOpen;
		this.damageOpen = damageOpen;
		this.delimClose = delimClose;
		this.damageClose = damageClose;
	}
	toString() {
		var s = '';
		if (this.delimOpen)
			s += this.delimOpen + Group.numToDamage(this.damageOpen);
		s += this.type == 'walled' ? Group.BEGIN_WALLED_ENCLOSURE : Group.BEGIN_ENCLOSURE;
		s += this.groups.map(g => g.toString()).join('');
		s += this.type == 'walled' ? Group.END_WALLED_ENCLOSURE : Group.END_ENCLOSURE;
		if (this.delimClose)
			s += this.delimClose + Group.numToDamage(this.damageClose);
		return s;
	}
	size(options) {
		if (Group.h(options)) {
			const w = this.openSize(options).w + this.kernOpenSize() + 
						this.innerSize(options).w +
						this.kernCloseSize() + this.closeSize(options).w;
			const h = this.outlineSize(options).h;
			return { w, h };
		} else {
			const w = this.outlineSize(options).w;
			const h = this.openSize(options).h + this.kernOpenSize() + 
						this.innerSize(options).h +
						this.kernCloseSize() + this.closeSize(options).h;
			return { w, h };
		}
	}
	innerSize(options) {
		const sizes = this.groups.map(g => g.size(options));
		if (Group.h(options)) {
			const w = getSum(sizes.map(s => s.w)) + this.scale * options.sep * sizes.length;
			const h = Math.max(getMax(sizes.map(s => s.h)), 0);
			return { w, h };
		} else {
			const w = Math.max(getMax(sizes.map(s => s.w)), 0);
			const h = getSum(sizes.map(s => s.h)) + this.scale * options.sep * sizes.length;
			return { w, h };
		}
	}
	openSize(options) {
		const ch = this.delimOpenRotated(options);
		const size = ch ? shapes.emSizeOf(ch, options.fontsize, 1, 1, 0, false) : { w: 0, h: 0 };
		return { w: this.scale * size.w, h: this.scale * size.h };
	}
	closeSize(options) {
		const ch = this.delimCloseRotated(options);
		const size = ch ? shapes.emSizeOf(ch, options.fontsize, 1, 1, 0, false) : { w: 0, h: 0 };
		return { w: this.scale * size.w, h: this.scale * size.h };
	}
	kernOpenSize() {
		return this.scale * this.kernOpen;
	}
	kernCloseSize() {
		return this.scale * this.kernClose;
	}
	delimOpenRotated(options) {
		if (!this.delimOpen || Group.h(options))
			return this.delimOpen;
		else
			return Shapes.rotatedChars[this.delimOpen];
	}
	delimCloseRotated(options) {
		if (!this.delimClose || Group.h(options))
			return this.delimClose;
		else
			return Shapes.rotatedChars[this.delimClose];
	}
	outlineCh(options) {
		const ch = this.type == 'walled' ? Shapes.WALLED_OUTLINE : Shapes.OUTLINE;
		return Group.h(options) ? ch : Shapes.rotatedChars[ch];
	}
	outlineSize(options) {
		const size = shapes.emSizeOf(this.outlineCh(options), options.fontsize, 1, 1, 0);
		return { w: this.scale * size.w, h: this.scale * size.h };
	}
	resize(f) {
		super.resize(f);
		this.groups.forEach(g => g.resize(f));
	}
	fit(options, w, h) {
		const innerSpace = 1.0 - 2 * this.thickness();
		if (Group.h(options))
			this.groups.forEach(g => g.fit(options, Infinity, innerSpace));
		else
			this.groups.forEach(g => g.fit(options, innerSpace, Infinity));
		this.fitOpen(options);
		this.fitClose(options);
		super.fit(options, w, h);
	}
	fitOpen(options) {
		this.kernOpen = 0;
		if (this.delimOpen && this.groups.length > 0) {
			const measOptions = Group.measureOptions(options);
			const measSize = measOptions.fontsize;
			const openSize = this.openSize(options);
			const openRect = { x: 0, y: 0, w: openSize.w, h: openSize.h };
			const openPrinted = new PrintedCanvasWithoutExtras(measSize, openSize.w, openSize.h);
			openPrinted.addSign(this.delimOpenRotated(options), this.scale, 1, 1, 0, false, openRect, { });
			const group = this.groups[0];
			const groupSize = group.size(options);
			if (Group.h(options)) {
				group.format(measOptions,
					0, 0, groupSize.w, groupSize.w, 0, this.thickness(), openSize.h - this.thickness(), openSize.h);
				const groupPrinted = new PrintedCanvasWithoutExtras(measSize, groupSize.w, openSize.h);
				group.print(measOptions, groupPrinted);
				this.kernOpen = -Shapes.hDistance(openPrinted.canvas, groupPrinted.canvas,
					this.thickness() * measSize, (openSize.h - this.thickness()) * measSize) / measSize;
			} else {
				group.format(measOptions,
					0, this.thickness(), openSize.w - this.thickness(), openSize.w, 0, 0, groupSize.h, groupSize.h);
				const groupPrinted = new PrintedCanvasWithoutExtras(measSize, openSize.w, groupSize.h);
				group.print(measOptions, groupPrinted);
				this.kernOpen = -Shapes.vDistance(openPrinted.canvas, groupPrinted.canvas,
					this.thickness() * measSize, (openSize.w - this.thickness()) * measSize) / measSize;
			}
		}
	}
	fitClose(options) {
		this.kernClose = 0;
		if (this.delimClose && this.groups.length > 0) {
			const measOptions = Group.measureOptions(options);
			const measSize = measOptions.fontsize;
			const closeSize = this.closeSize(options);
			const closeRect = { x: 0, y: 0, w: closeSize.w, h: closeSize.h };
			const closePrinted = new PrintedCanvasWithoutExtras(measSize, closeSize.w, closeSize.h);
			closePrinted.addSign(this.delimCloseRotated(options), this.scale, 1, 1, 0, false, closeRect, { });
			const group = this.groups[this.groups.length-1];
			const groupSize = group.size(options);
			if (Group.h(options)) {
				group.format(measOptions,
					0, 0, groupSize.w, groupSize.w, 0, this.thickness(), closeSize.h - this.thickness(), closeSize.h);
				const groupPrinted = new PrintedCanvasWithoutExtras(measSize, groupSize.w, closeSize.h);
				group.print(measOptions, groupPrinted);
				this.kernClose = -Shapes.hDistance(groupPrinted.canvas, closePrinted.canvas,
					this.thickness() * measSize, (closeSize.h - this.thickness()) * measSize) / measSize;
			} else {
				group.format(measOptions,
					0, this.thickness(), closeSize.w - this.thickness(), closeSize.w, 0, 0, groupSize.h, groupSize.h);
				const groupPrinted = new PrintedCanvasWithoutExtras(measSize, closeSize.w, groupSize.h);
				group.print(measOptions, groupPrinted);
				this.kernClose = -Shapes.vDistance(groupPrinted.canvas, closePrinted.canvas,
					this.thickness() * measSize, (closeSize.w - this.thickness()) * measSize) / measSize;
			}
		}
	}
	thickness() {
		return this.scale * (this.type == 'walled' ?
			Shapes.WALLED_ENCLOSURE_THICKNESS : Shapes.ENCLOSURE_THICKNESS);
	}
	format(options, x0Encl, x1Encl, x2Encl, x3Encl, y0Encl, y1Encl, y2Encl, y3Encl) {
		const size = this.size(options);
		const bufX = ((x2Encl-x1Encl) - size.w) / 2;
		const bufY = ((y2Encl-y1Encl) - size.h) / 2;
		const inner = this.innerSize(options);
		const open = this.openSize(options);
		const close = this.closeSize(options);
		const outline = this.outlineSize(options);
		this.areas = [];
		this.delimOpenRect = { x: x1Encl + bufX, y: y1Encl + bufY, w: open.w, h: open.h };
		if (Group.h(options)) {
			this.delimCloseRect = { x: x2Encl - bufX - close.w, y: y1Encl + bufY,
				w: close.w, h: close.h };
			if (this.damageOpen) {
				const shadeOpenWidth = this.delimOpenRect.w + this.kernOpenSize();
				this.areas.push(...Group.damageAreas(this.damageOpen,
						x0Encl, this.delimOpenRect.x + shadeOpenWidth / 2,
							this.delimOpenRect.x + shadeOpenWidth,
						y0Encl, this.delimOpenRect.y + this.delimOpenRect.h / 2, y3Encl));
			}
			if (this.damageClose) {
				const shadeCloseWidth = this.delimCloseRect.w + this.kernCloseSize();
				this.areas.push(...Group.damageAreas(this.damageClose,
						this.delimCloseRect.x - this.kernCloseSize(),
						this.delimCloseRect.x + this.delimCloseRect.w - shadeCloseWidth / 2, x3Encl,
						y0Encl, this.delimCloseRect.y + this.delimCloseRect.h / 2, y3Encl));
			}
			var x0 = this.delimOpenRect.x + this.delimOpenRect.w + this.kernOpenSize();
			var x1 = x0 + this.scale * options.sep / 2;
			if (!this.delimOpen)
				x0 = x0Encl;
			for (let i = 0; i < this.groups.length; i++) {
				const group = this.groups[i];
				var x2 = x1 + group.size(options).w;
				var x3 = !this.delimClose ? x3Encl :
					i < this.groups.length-1 ? x2 + this.scale * options.sep / 2 :
					this.delimCloseRect.x - this.kernCloseSize();
				group.format(options, x0, x1, x2, x3, y0Encl,
					y1Encl + bufY + this.thickness(),
					y2Encl - bufY - this.thickness(), y3Encl);
				x0 = x3;
				x1 = x2 + this.scale * options.sep;
			}
		} else {
			this.delimCloseRect = { x: x1Encl + bufX, y: y2Encl - bufY - close.h, w: close.w, h: close.h };
			if (this.damageOpen) {
				const shadeOpenHeight = this.delimOpenRect.h + this.kernOpenSize();
				this.areas.push(...Group.damageAreas(this.damageOpen,
						x0Encl, this.delimOpenRect.x + this.delimOpenRect.w / 2, x3Encl,
						y0Encl, this.delimOpenRect.y + shadeOpenHeight / 2,
							this.delimOpenRect.y + shadeOpenHeight));
			}
			if (this.damageClose) {
				const shadeCloseHeight = this.delimCloseRect.h + this.kernCloseSize();
				this.areas.push(...Group.damageAreas(this.damageClose,
						x0Encl, this.delimCloseRect.x + this.delimCloseRect.w / 2, x3Encl,
						this.delimCloseRect.y - this.kernCloseSize(),
						this.delimCloseRect.y + this.delimCloseRect.h - shadeCloseHeight / 2, y3Encl));
			}
			var y0 = this.delimOpenRect.y + this.delimOpenRect.h + this.kernOpenSize();
			var y1 = y0 + this.scale * options.sep / 2;
			if (!this.delimOpen)
				y0 = y0Encl;
			for (let i = 0; i < this.groups.length; i++) {
				const group = this.groups[i];
				var y2 = y1 + group.size(options).h;
				var y3 = !this.delimClose ? y3Encl :
					i < this.groups.length-1 ? y2 + this.scale * options.sep / 2 :
					this.delimCloseRect.y - this.kernCloseSize();
				group.format(options, x0Encl,
					x1Encl + bufX + this.thickness(),
					x2Encl - bufX - this.thickness(), x3Encl, y0, y1, y2, y3);
				y0 = y3;
				y1 = y2 + this.scale * options.sep;
			}
		}
		this.outlines = [];
		const overlap = 0.02;
		if (this.groups.length > 0) {
			if (Group.h(options)) {
				const netW = (1 - overlap) * outline.w;
				const innerW = this.delimCloseRect.x -
						(this.delimOpenRect.x + this.delimOpenRect.w - overlap * outline.w);
				if (innerW > 0) {
					const n = Math.max(1, Math.floor(innerW / netW));
					const scaleX = innerW / (n * netW);
					const scaleY = 1;
					var x = this.delimOpenRect.x + this.delimOpenRect.w - overlap * outline.w;
					var y = this.delimOpenRect.y;
					var w = scaleX * outline.w;
					var h = outline.h;
					for (let i = 0; i < n; i++) {
						this.outlines.push({ x, y, w, h, scaleX, scaleY });
						x += scaleX * netW;
					}
				}
			} else {
				const netH = (1 - overlap) * outline.h;
				const innerH = this.delimCloseRect.y -
						(this.delimOpenRect.y + this.delimOpenRect.h - overlap * outline.h);
				if (innerH > 0) {
					const n = Math.max(1, Math.floor(innerH / netH));
					const scaleX = 1;
					const scaleY = innerH / (n * netH);
					var x = this.delimOpenRect.x;
					var y = this.delimOpenRect.y + this.delimOpenRect.h - overlap * outline.h;
					var w = outline.w;
					var h = scaleY * outline.h;
					for (let i = 0; i < n; i++) {
						this.outlines.push({ x, y, w, h, scaleX, scaleY });
						y += scaleY * netH;
					}
				}
			}
		}
	}
	print(options, printed) {
		const chOpen = this.delimOpenRotated(options);
		const chClose = this.delimCloseRotated(options);
		var properties = {};
		if (Group.h(options)) {
			properties.yAs = this.outlineCh(options);
		} else {
			properties.xAs = this.outlineCh(options);
			properties.unselectable = true;
		}
		if (chOpen) {
			printed.addSign(chOpen, this.scale, 1, 1, 0, false, this.delimOpenRect, properties);
			if (Group.v(options))
				printed.addHidden(this.delimOpen);
			printed.addHidden(Group.numToDamage(this.damageOpen));
		}
		printed.addHidden(this.type == 'walled' ? Group.BEGIN_WALLED_ENCLOSURE : Group.BEGIN_ENCLOSURE);
		this.groups.forEach(g => g.print(options, printed));
		printed.addHidden(this.type == 'walled' ? Group.END_WALLED_ENCLOSURE : Group.END_ENCLOSURE);
		if (chClose) {
			printed.addSign(chClose, this.scale, 1, 1, 0, false, this.delimCloseRect, properties);
			if (Group.v(options))
				printed.addHidden(this.delimClose);
			printed.addHidden(Group.numToDamage(this.damageClose));
		}
		for (const out of this.outlines)
			printed.addSign(this.outlineCh(options), this.scale, out.scaleX, out.scaleY, 0, false, out,	
				{ unselectable: true });
		for (const area of this.areas)
			printed.addShading(area.x, area.y, area.w, area.h);
	}
}

class Basic extends Group {
	core; // Overlay/Literal
	ts; bs; te; be; m; t; b; // Vertical/Horizontal/Enclosure/Basic/Overlay/Literal/Blank/Lost/null
	constructor(core, insertions) {
		super();
		this.core = core;
		for (let place in insertions)
			this[place] = insertions[place];
		this.core.chooseAltGlyph(this.places());
	}
	places() {
		var ps = [];
		for (let i = 0; i < Group.INSERTION_PLACES.length; i++) {
			const place = Group.INSERTION_PLACES[i];
			if (this[place])
				ps.push(place);
		}
		return ps;
	}
	toString() {
		var s = this.core.toString();
		for (let i = 0; i < Group.INSERTION_PLACES.length; i++) {
			const place = Group.INSERTION_PLACES[i];
			const control = Group.INSERTION_CHARS[i];
			if (this[place])
				s += control + Basic.insertedExpression(this[place]);
		}
		return s;
	}
	static isBracketedInsert(g) {
		return g instanceof Vertical ||
			g instanceof Horizontal ||
			g instanceof Basic;
	}
	static insertedExpression(g) {
		return Basic.isBracketedInsert(g) ?
			Group.BEGIN_SEGMENT + g.toString() + Group.END_SEGMENT :
			g.toString();
	}
	size(options) {
		const size = this.core.size(options);
		const ext = this.extension;
		var w = size.w * ext.w;
		var h = size.h * ext.h;
		return { w, h };
	}
	resize(f) {
		super.resize(f);
		this.core.resize(f);
		for (const place of Group.INSERTION_PLACES)
			if (this[place])
				this[place].resize(f);
	}
	fit(options, w, h) {
		const measOptions = Group.measureOptions(options);
		const measSize = measOptions.fontsize;
		this.core.fit(options, Infinity, Infinity);
		const coreSize = this.core.size(options);
		this.core.format(measOptions, 0, 0, coreSize.w, coreSize.w, 0, 0, coreSize.h, coreSize.h);
		const corePrinted = new PrintedCanvasWithoutExtras(measSize, coreSize.w, coreSize.h);
		this.core.print(measOptions, corePrinted);
		const coreW = corePrinted.canvas.width;
		const coreH = corePrinted.canvas.height;
		for (const place of Group.INSERTION_PLACES)
			if (this[place]) {
				const corePlane = place == 'm' ?
					Shapes.planeRestricted(corePrinted.canvas) :
					Shapes.planeExtended(corePrinted.canvas);
				/* determine initial scale based on blank rectangle */
				this[place].fit(options, Infinity, Infinity);
				const insSize = this[place].size(options);
				this[place].format(measOptions, 0, 0, insSize.w, insSize.w, 0, 0, insSize.h, insSize.h);
				const insPrinted = new PrintedCanvasWithoutExtras(measSize, insSize.w, insSize.h);
				this[place].print(measOptions, insPrinted);
				var adjustments = { };
				if (place in this.core.adjustments)
					adjustments = this.core.adjustments[place];
				const position = Shapes.insertionPosition(place, adjustments);
				var xInit = Math.min(coreW-1, Math.round(position.x * coreW));
				var yInit = Math.min(coreH-1, Math.round(position.y * coreH));
				const rectInit = Shapes.openRect(corePrinted.canvas, xInit, yInit);
				const margin = Math.round(measSize * options.sep);
				const hull = Shapes.orthogonalHullWithBuffer(insPrinted.canvas, margin);
				var marginL = position.x == 0 ? 0 : -hull.xMin;
				var marginR = position.x == 1 ? 0 : hull.xMax - (hull.w-1);
				var marginT = position.y == 0 ? 0 : -hull.yMin;
				var marginB = position.y == 1 ? 0 : hull.yMax - (hull.h-1);
				var insTotalW = hull.w + marginL + marginR;
				var insTotalH = hull.h + marginT + marginB;
				var scale = Math.min(1, rectInit.w / insTotalW, rectInit.h / insTotalH);
				
				/* determine initial position by dividing excess space */
				const remainderW = rectInit.w - scale * insTotalW;
				const remainderH = rectInit.h - scale * insTotalH;
				switch (position.x) {
					case 0:
						var remainderL = 0;
						var remainderR = remainderW;
						break;
					case 1:
						var remainderL = remainderW;
						var remainderR = 0;
						break;
					default:
						var remainderL = remainderW / 2;
						var remainderR = remainderW / 2;
				}
				switch (position.y) {
					case 0:
						var remainderT = 0;
						var remainderB = remainderH;
						break;
					case 1:
						var remainderT = remainderH;
						var remainderB = 0;
						break;
					default:
						var remainderT = remainderH / 2;
						var remainderB = remainderH / 2;
				}
				var rect = { x0: rectInit.x + remainderL, x1: rectInit.x+rectInit.w - remainderR,
						y0: rectInit.y + remainderT, y1: rectInit.y+rectInit.h - remainderB };
				var pPlane = { };
				var pHull = { };
				switch (position.x) {
					case 0:
						pPlane.x = rect.x0;
						pHull.x = 0;
						break;
					case 1:
						pPlane.x = rect.x1;
						pHull.x = hull.w-1;
						break;
					default:
						pPlane.x = (rect.x0+rect.x1) / 2;
						pHull.x = hull.w/2;
				}
				switch (position.y) {
					case 0:
						pPlane.y = rect.y0;
						pHull.y = 0;
						break;
					case 1:
						pPlane.y = rect.y1;
						pHull.y = hull.h-1;
						break;
					default:
						pPlane.y = (rect.y0+rect.y1) / 2;
						pHull.y = hull.h/2;
				}

				/* try grow until scale is 1, or scale is big enough while protruding, in number of steps */
				const incrFactor = 1.1; /* increase in scale between steps */
				const minScale = 0.15;
				const nSteps = Math.ceil(-Math.log(scale) / Math.log(incrFactor));
				const steps = [...Array(nSteps).keys()].map(x => x+1);
				const scalings = steps.map(i => scale * (1/scale) ** (i/nSteps));
				for (let i = 0; i < scalings.length; i++) {
					const scaleNew = scalings[i];
					const disp = Shapes.displacement(corePlane, hull, pPlane, pHull, scale, scaleNew);
					if (disp) {
						pPlane = { x: pPlane.x + disp.x, y: pPlane.y + disp.y };
					} else if (scale > minScale) {
						break;
					}
					const rectNew = {
						x0: pPlane.x - pHull.x * scaleNew,
						x1: pPlane.x + (hull.w-pHull.x) * scaleNew,
						y0: pPlane.y - pHull.y * scaleNew,
						y1: pPlane.y + (hull.h-pHull.y) * scaleNew };
					if (scale >= 0.55 && (rectNew.x0 <= -1 || rectNew.x1 >= coreW+1 || rectNew.y0 <= -1 || rectNew.y1 >= coreH+1))
						break;
					scale = scaleNew;
					rect = rectNew;
				}

				this[place].resize(scale);
				this[place].rect = { x0: rect.x0 / coreW, x1: rect.x1 / coreW,
						y0: rect.y0 / coreH, y1: rect.y1 / coreH };
			}
		var x0 = 0;
		var x1 = 1;
		var y0 = 0;
		var y1 = 1;
		for (const place of Group.INSERTION_PLACES)
			if (this[place]) {
				x0 = Math.min(x0, this[place].rect.x0);
				x1 = Math.max(x1, this[place].rect.x1);
				y0 = Math.min(y0, this[place].rect.y0);
				y1 = Math.max(y1, this[place].rect.y1);
			}
		this.extension = { l: -x0, r: x1-1, t: -y0, b: y1-1, w: x1-x0, h: y1-y0 };
		super.fit(options, w, h);
	}
	format(options, x0, x1, x2, x3, y0, y1, y2, y3) {
		const size = this.size(options);
		const bufX = ((x2-x1) - size.w) / 2;
		const bufY = ((y2-y1) - size.h) / 2;
		const x1Net = x1 + bufX;
		const y1Net = y1 + bufY;
		const ext = this.extension;
		const scaleW = size.w / ext.w;
		const scaleH = size.h / ext.h;
		const x1Core = x1Net + ext.l * scaleW;
		const x2Core = x1Core + scaleW;
		const y1Core = y1Net + ext.t * scaleH;
		const y2Core = y1Core + scaleH;
		this.core.format(options, x0, x1Core, x2Core, x3, y0, y1Core, y2Core, y3);
		for (const place of Group.INSERTION_PLACES)
			if (this[place]) {
				const rect = this[place].rect;
				const x1Insert = x1Net + (rect.x0+ext.l) * scaleW;
				const x2Insert = x1Net + (rect.x1+ext.l) * scaleW;
				const x0Insert = x1Insert - this.scale * options.sep / 2;
				const x3Insert = x2Insert + this.scale * options.sep / 2;
				const y1Insert = y1Net + (rect.y0+ext.t) * scaleH;
				const y2Insert = y1Net + (rect.y1+ext.t) * scaleH;
				const y0Insert = y1Insert - this.scale * options.sep / 2;
				const y3Insert = y2Insert + this.scale * options.sep / 2;
				this[place].format(options, x0Insert, x1Insert, x2Insert, x3Insert,
					y0Insert, y1Insert, y2Insert, y3Insert);
			}
	}
	print(options, printed) {
		this.core.print(options, printed);
		for (let i = 0; i < Group.INSERTION_PLACES.length; i++) {
			const place = Group.INSERTION_PLACES[i];
			const control = Group.INSERTION_CHARS[i];
			if (this[place]) {
				printed.addHidden(control);
				Basic.printInsertedExpression(options, printed, this[place]);
			}
		}
	}
	static printInsertedExpression(options, printed, g) {
		if (Basic.isBracketedInsert(g)) {
			printed.addHidden(Group.BEGIN_SEGMENT);
			g.print(options, printed);
			printed.addHidden(Group.END_SEGMENT);
		} else {
			g.print(options, printed);
		}
	}
}

class Overlay extends Group {
	lits1; lits2; // non-empty array of Literal
	lig; // ligature
	adjustments; // adjusted positions for insertions
	constructor(lits1, lits2) {
		super();
		this.lits1 = lits1;
		this.lits2 = lits2;
		this.lig = this.findLigature();
		this.alt = this.lig;
		this.adjustments = { };
	}
	toString() {
		return (this.lits1.length > 1 ?
					Group.BEGIN_SEGMENT +
						this.lits1.map(g => g.toString()).join(Group.HOR) + Group.END_SEGMENT :
					this.lits1[0].toString()) +
				Group.OVERLAY +
				(this.lits2.length > 1 ?
					Group.BEGIN_SEGMENT +
						this.lits2.map(g => g.toString()).join(Group.VER) + Group.END_SEGMENT :
					this.lits2[0].toString());
	}
	allowedPlaces() {
		const lig = this.findLigature();
		return lig ? Shapes.allowedPlaces(lig, 0, false) : new Set(['ts', 'bs', 'te', 'be']);
	}
	findLigature() {
		const chs = shapes.memoOverlayLigatures().get(this.lits1[0].ch);
		if (chs && chs.length > 0)
			for (const ch of chs)
				if (this.matchLigature(ch))
					return ch;
		return null;
	}
	matchLigature(ch) {
		const lig = Shapes.ligatures[ch];
		if (this.lits1.length != lig.horizontal.length || this.lits2.length != lig.vertical.length)
			return false;
		for (let i = 0; i < this.lits1.length; i++) {
			const sign = lig.horizontal[i];
			const lit = this.lits1[i];
			if (lit.ch != sign.ch || lit.mirror != !!sign.mirror || lit.vs)
				return false;
		}
		for (let i = 0; i < this.lits2.length; i++) {
			const sign = lig.vertical[i];
			const lit = this.lits2[i];
			if (lit.ch != sign.ch || lit.mirror != !!sign.mirror || lit.vs)
				return false;
		}
		return true;
	}
	chooseAltGlyph(places) {
		if (this.lig && this.lig in Shapes.insertions) { 
			for (const alt of Shapes.insertions[this.lig]) {
				if (places.every(p => p in alt)) {
					if ('glyph' in alt)
						this.alt = alt.glyph;
					this.adjustments = alt;
					return;
				}
			}
		}
	}
	size(options) {
		if (this.alt)
			return this.sizeLigature(options);
		const sizes1 = this.lits1.map(g => g.size(options));
		const widths1 = sizes1.map(s => s.w);
		const heights1 = sizes1.map(s => s.h);
		const sizes2 = this.lits2.map(g => g.size(options));
		const widths2 = sizes2.map(s => s.w);
		const heights2 = sizes2.map(s => s.h);
		const w = Math.max(getSum(widths1), getMax(widths2));
		const h = Math.max(getMax(heights1), getSum(heights2));
		return { w, h };
	}
	sizeLigature(options) {
		const size = shapes.emSizeOf(this.alt, options.fontsize, 1, 1, 0, false);
		const w = size.w * this.scale;
		const h = size.h * this.scale;
		return { w, h };
	}
	resize(f) {
		super.resize(f);
		this.lits1.forEach(g => g.resize(f));
		this.lits2.forEach(g => g.resize(f));
	}
	format(options, x0, x1, x2, x3, y0, y1, y2, y3) {
		if (this.alt) {
			this.formatLigature(options, x0, x1, x2, x3, y0, y1, y2, y3);
			return;
		}
		const width1 = getSum(this.lits1.map(g => g.size(options).w));
		const height2 = getSum(this.lits2.map(g => g.size(options).h));
		const bufX = ((x2-x1) - width1) / 2;
		const bufY = ((y2-y1) - height2) / 2;
		var x4 = x0;
		var x = x1 + bufX;
		for (let i = 0; i < this.lits1.length; i++) {
			const group = this.lits1[i];
			if (i < this.lits1.length-1) {
				var x5 = x + group.size(options).w;
				var x6 = x5;
			} else {
				var x5 = x2 - bufX;
				var x6 = x3;
			}
			group.format(options, x4, x, x5, x6, y0, y1, y2, y3);
			x = x5;
			x4 = x6;
		}
		var y4 = y0;
		var y = y1 + bufY;
		for (let i = 0; i < this.lits2.length; i++) {
			const group = this.lits2[i];
			if (i < this.lits2.length-1) {
				var y5 = y + group.size(options).h;
				var y6 = y5;
			} else {
				var y5 = y2 - bufY;
				var y6 = y3;
			}
			group.format(options, x0, x1, x2, x3, y4, y, y5, y6);
			y = y5;
			y4 = y6;
		}
	}
	formatLigature(options, x0, x1, x2, x3, y0, y1, y2, y3) {
		const lig = Shapes.ligatures[this.alt];
		const size = this.size(options);
		const bufX = ((x2-x1) - size.w) / 2;
		const bufY = ((y2-y1) - size.h) / 2;
		this.x = x1 + bufX;
		this.y = y1 + (options.align == 'bottom' ? ((y2-y1) - size.h) : bufY);
		this.w = size.w;
		this.h = size.h;
		this.areas = [];
		for (let i = 0; i < lig.horizontal.length; i++) {
			const s = lig.horizontal[i];
			const damage = this.lits1[i].damage;
			const xMin = i == 0 ? x0 : this.x + s.x * this.w;
			const xMid = this.x + (s.x + s.w / 2) * this.w;
			const xMax = i == lig.horizontal.length-1 ? x3 : this.x + (s.x + s.w) * this.w;
			const yMid = this.y + (s.y + s.h / 2) * this.h;
			this.areas.push(...Group.damageAreas(damage, xMin, xMid, xMax, y0, yMid, y3));
		}
		for (let i = 0; i < lig.vertical.length; i++) {
			const s = lig.vertical[i];
			const damage = this.lits2[i].damage;
			const xMid = this.x + (s.x + s.w / 2) * this.w;
			const yMin = i == 0 ? y0 : this.y + s.y * this.h;
			const yMid = this.y + (s.y + s.h / 2) * this.h;
			const yMax = i == lig.vertical.length-1 ? y3 : this.y + (s.y + s.h) * this.h;
			this.areas.push(...Group.damageAreas(damage, x0, xMid, x3, yMin, yMid, yMax));
		}
	}
	print(options, printed) {
		if (this.alt) {
			this.printLigature(options, printed);
			return;
		}
		if (this.lits1.length > 1)
			printed.addHidden(Group.BEGIN_SEGMENT);
		this.lits1.forEach(g => g.print(options, printed));
		if (this.lits1.length > 1)
			printed.addHidden(Group.END_SEGMENT);
		printed.addHidden(Group.OVERLAY);
		if (this.lits2.length > 1)
			printed.addHidden(Group.BEGIN_SEGMENT);
		this.lits2.forEach(g => g.print(options, printed));
		if (this.lits2.length > 1)
			printed.addHidden(Group.END_SEGMENT);
	}
	printLigature(options, printed) {
		printed.addHidden(this.toString());
		printed.addSign(this.alt, this.scale, 1, 1, 0, false, this, { unselectable: true });
		for (const area of this.areas)
			printed.addShading(area.x, area.y, area.w, area.h);
	}
}

class Literal extends Group {
	ch; // character
	alt; // alternative character for insertions
	adjustments; // adjusted positions for insertions
	vs; // 0 -- 7
	mirror; // Boolean
	damage; // 0 -- 15
	constructor(ch, vs, mirror, damage) {
		super();
		this.ch = ch;
		this.alt = ch;
		this.adjustments = { };
		this.vs = vs;
		this.mirror = mirror;
		this.damage = damage;
	}
	toString() {
		return this.ch + Group.numToVariation(this.vs) +
			(this.mirror ? Group.MIRROR : '') +
			Group.numToDamage(this.damage);
	}
	allowedPlaces() {
		return Shapes.allowedPlaces(this.ch, this.rotationCoarse(), this.mirror);
	}
	chooseAltGlyph(places) {
		if (this.ch in Shapes.insertions) {
			const mirrored = this.mirror ? places.map(p => Shapes.mirrorPlace(p)) : places;
			const rot = this.rotationCoarse();
			for (const alt of Shapes.insertions[this.ch]) {
				const altRot = alt.rot ? alt.rot : 0;
				if (mirrored.every(p => p in alt) && rot == altRot) {
					if ('glyph' in alt)
						this.alt = alt.glyph;
					this.adjustments = this.mirror ? Shapes.mirrorAdjustments(alt) : alt;
					return;
				}
			}
		}
		if (this.ch != Shapes.PLACEHOLDER)
			this.logInsertion = 'Unknown insertions ' + [...places] + ' for ' + this.ch;
	}
	size(options) {
		const size = shapes.emSizeOf(this.alt, options.fontsize, 1, 1, this.rotation(), this.mirror);
		const w = size.w * this.scale;
		const h = size.h * this.scale;
		return { w, h };
	}
	rotationCoarse() {
		return Group.numToRotate(this.vs);
	}
	rotation() {
		const rot = this.rotationCoarse();
		if (Shapes.allowedRotations(this.ch).includes(rot))
			return rot + Number(Shapes.rotations[this.ch][rot]);
		if (rot)
			this.logRotation = 'Unknown rotation ' + rot + ' degrees for ' + this.ch;
		return rot;
	}
	format(options, x0, x1, x2, x3, y0, y1, y2, y3) {
		const size = this.size(options);
		const bufX = ((x2-x1) - size.w) / 2;
		const bufY = ((y2-y1) - size.h) / 2;
		this.x = x1 + bufX;
		this.y = y1 + (options.align == 'bottom' ? ((y2-y1) - size.h) : bufY);
		this.w = size.w;
		this.h = size.h;
		const xShade = this.x + this.w / 2;
		const yShade = this.y + this.h / 2;
		this.areas = Group.damageAreas(this.damage,
			x0, xShade, x3, y0, yShade, y3);
	}
	print(options, printed) {
		if (this.alt == this.ch) {
			printed.addSign(this.ch, this.scale, 1, 1, this.rotation(), this.mirror, this, { });
		} else {
			printed.addSign(this.alt, this.scale, 1, 1, this.rotation(), this.mirror, this,
				{ unselectable: true });
			printed.addHidden(this.ch);
		}
		for (const area of this.areas)
			printed.addShading(area.x, area.y, area.w, area.h);
		if (this.vs)
			printed.addHidden(Group.numToVariation(this.vs));
		if (this.mirror)
			printed.addHidden(Group.MIRROR);
		if (this.damage)
			printed.addHidden(Group.numToDamage(this.damage));
		if (this.logInsertion)
			printed.addLog(this.logInsertion);
		if (this.logRotation)
			printed.addLog(this.logRotation);
	}
}

class Singleton extends Group {
	ch; // character
	damage; // 0 -- 15
	constructor(ch, damage) {
		super();
		this.ch = ch;
		this.damage = damage;
	}
	toString() {
		return this.ch + Group.numToDamage(this.damage);
	}
	size(options) {
		const size = shapes.emSizeOf(this.chRotated(options), options.fontsize, 1, 1, 0, false);
		const w = size.w * this.scale;
		const h = size.h * this.scale;
		return { w, h };
	}
	chRotated(options) {
		return Group.h(options) ? this.ch : Shapes.rotatedChars[this.ch];
	}
	format(options, x0, x1, x2, x3, y0, y1, y2, y3) {
		const size = this.size(options);
		const bufX = ((x2-x1) - size.w) / 2;
		const bufY = ((y2-y1) - size.h) / 2;
		this.x = x1 + bufX;
		this.y = y1 + bufY;
		this.w = size.w;
		this.h = size.h;
		const xShade = this.x + this.w / 2;
		const yShade = this.y + this.h / 2;
		this.areas = Group.damageAreas(this.damage,
			x0, xShade, x3, y0, yShade, y3);
	}
	print(options, printed) {
		printed.addSign(this.chRotated(options), this.scale, 1, 1, 0, false, this, { });
		for (const area of this.areas)
			printed.addShading(area.x, area.y, area.w, area.h);
		if (this.damage)
			printed.addHidden(Group.numToDamage(this.damage));
	}
}

class Blank extends Group {
	dim; // 0.5 or 1
	constructor(dim) {
		super();
		this.dim = dim;
	}
	toString() {
		return this.dim == 1 ? Group.FULL_BLANK : Group.HALF_BLANK;
	}
	size(options) {
		const w = this.dim * this.scale;
		const h = this.dim * this.scale;
		return { w, h };
	}
	format(options, x0, x1, x2, x3, y0, y1, y2, y3) {
	}
	print(options, printed) {
		printed.addHidden(this.toString());
	}
}

class Lost extends Group {
	width; height; // 0.5 or 1
	expand; // Boolean
	constructor(width, height, expand) {
		super();
		this.width = width;
		this.height = height;
		this.expand = expand;
	}
	toString() {
		if (this.width == 0.5 && this.height == 0.5)
			var s = Group.HALF_LOST;
		else if (this.width == 0.5 && this.height == 1)
			var s = Group.TALL_LOST;
		else if (this.width == 1 && this.height == 0.5)
			var s = Group.WIDE_LOST;
		else
			var s = Group.FULL_LOST;
		s += Group.numToVariation(this.expand ? 1 : 0);
		return s;
	}
	size(options) {
		return { w: this.width * this.scale, h: this.height * this.scale };
	}
	format(options, x0, x1, x2, x3, y0, y1, y2, y3) {
		if (this.expand) {
			this.areas = [{ x: x0, w: x3-x0, y: y0, h: y3-y0 }];
		} else {
			const size = this.size(options);
			const bufX = ((x2-x1) - size.w) / 2;
			const bufY = ((y2-y1) - size.h) / 2;
			this.areas = [{ x: x1 + bufX, w: size.w, y: y1 + bufY, h: size.h }];
		}
	}
	print(options, printed) {
		printed.addHidden(this.toString());
		for (const area of this.areas)
			printed.addShading(area.x, area.y, area.w, area.h);
	}
}

class BracketOpen extends Group {
	ch; // character
	constructor(ch) {
		super();
		this.ch = ch;
	}
	toString() {
		return this.ch;
	}
	size(options) {
		return { w: 0, h: 0 };
	}
	format(options, x, y, w, h) {
		const size = shapes.emSizeOf(this.ch, options.fontsize, 1, 1, 0, false);
		const naturalRatio = size.w;
		const availableRatio = w / h;
		if (availableRatio < naturalRatio)
			this.xScale = Math.max(0.5, availableRatio / naturalRatio);
		else
			this.xScale = 1;
		const wAdjusted = naturalRatio * h * this.xScale;
		this.x = Math.max(x, x+w - wAdjusted); this.y = y; this.w = wAdjusted; this.h = h;
	}
	print(options, printed) {
		printed.addSign(this.ch, this.h, this.xScale, 1, 0, false, this, { extra: true, bracket: true });
	}
}

class BracketClose extends Group {
	ch; // character
	constructor(ch) {
		super();
		this.ch = ch;
	}
	toString() {
		return this.ch;
	}
	size(options) {
		return { w: 0, h: 0 };
	}
	format(options, x, y, w, h) {
		const size = shapes.emSizeOf(this.ch, options.fontsize, 1, 1, 0, false);
		const naturalRatio = size.w;
		const availableRatio = w / h;
		if (availableRatio < naturalRatio)
			this.xScale = Math.max(0.5, availableRatio / naturalRatio);
		else
			this.xScale = 1;
		const wAdjusted = naturalRatio * h * this.xScale;
		this.x = Math.min(x, x+w - wAdjusted); this.y = y; this.w = wAdjusted; this.h = h;
	}
	print(options, printed) {
		printed.addSign(this.ch, this.h, this.xScale, 1, 0, false, this, { extra: true, bracket: true });
	}
}
