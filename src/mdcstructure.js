class MdcLine {
	parts;
	constructor(items) {
		const parts = [];
		var fragment = new MdcFragment([]);
		var text = new MdcText('');
		function flushFragment() {
			if (fragment.groups.length > 0) {
				parts.push(fragment);
				fragment = new MdcFragment([]);
			}
		}
		function flushText() {
			if (text.text.length > 0) {
				parts.push(text);
				text = new MdcText('');
			}
		}
		items.forEach(item => {
			switch (item.constructor) {
				case MdcText:
					flushFragment();
					text.append(item.text);
					break;
				case MdcBreak:
					flushFragment();
					break;
				case MdcBracketOpen:
					flushFragment();
					text.append(item.text);
					break;
				case MdcBracketClose:
					flushFragment();
					text.append(item.text);
					break;
				case MdcLineNumber:
					flushFragment();
					flushText();
					parts.push(item);
					break;
				case MdcToggle:
					if (!item.isEmpty()) {
						flushText();
						fragment.add(item);
					}
					break;
				default:
					flushText();
					fragment.add(item);
					break;
			}
		});
		flushText();
		flushFragment();
		this.parts = parts;
		this.propagateToggles();
		this.propagateGroupShading();
		// this.splitByColor();
	}
	propagateToggles() {
		var state = new MdcState();
		var pruned = [];
		for (let i = 0; i < this.parts.length; i++) {
			const part = this.parts[i];
			if (part instanceof MdcFragment) {
				state = part.propagateToggles(state);
				if (part.groups.length > 0)
					pruned.push(part);
			} else {
				pruned.push(part);
			}
		}
		this.parts = pruned;
	}
	propagateGroupShading() {
		for (let i = 0; i < this.parts.length; i++) {
			const part = this.parts[i];
			if (part instanceof MdcFragment)
				part.propagateGroupShading();
		}
	}
/*
	splitByColor() {
		let i = 0;
		for (let i = 0; i < this.parts.length; i++) {
			const part = this.parts[i];
			if (part instanceof MdcFragment) {
				const parts = part.splitByColor();
				if (parts.length > 1) {
					this.parts.splice(i, 1, ...parts);
				}
			}
		}
	}
*/
}

class MdcFragment {
	groups;
	constructor(groups) {
		this.groups = groups;
	}
	add(group) {
		this.groups.push(group);
	}
	toString() {
		var groups = this.groups.map(g => g.toGroup()).filter(g => g);
		for (let i = groups.length-1; i >= 0; i--) {
			const group = groups[i];
			if (group instanceof BracketOpen) {
				if (i < groups.length-1 && MdcFragment.canAddOpen(groups[i+1]))
					groups.splice(i, 2, MdcFragment.addOpen(group, groups[i+1]));
				else
					groups.splice(i, 1);
			} else if (group instanceof BracketClose) {
				if (i > 0 && MdcFragment.canAddClose(groups[i-1]))
					groups.splice(i-1, 2, MdcFragment.addClose(groups[i-1], group));
				else
					groups.splice(i, 1);
			}
		}
		return groups.map(g => g.toString()).join('');
	}
	static canAddOpen(group) {
		if (group instanceof Singleton)
			return false;
		else if (group instanceof Horizontal)
			return !(group.groups[0] instanceof BracketOpen);
		else
			return true;
	}
	static canAddClose(group) {
		if (group instanceof Singleton)
			return false;
		else if (group instanceof Horizontal)
			return !(group.groups[group.groups.length-1] instanceof BracketClose);
		else
			return true;
	}
	static addOpen(open, group) {
		if (group instanceof Horizontal)
			return new Horizontal([open].concat(group.groups));
		else
			return new Horizontal([open, group]);
	}
	static addClose(group, close) {
		if (group instanceof Horizontal)
			return new Horizontal(group.groups.concat(close));
		else
			return new Horizontal([group, close]);
	}
	propagateToggles(state) {
		var groups = [];
		this.groups.forEach(g => {
			state = g.propagateToggles(state);
			if (!(g instanceof MdcToggle))
				groups.push(g);
		});
		this.groups = groups;
		return state;
	}
	propagateGroupShading() {
		this.groups.forEach(g => {
			if (g instanceof MdcQuadrat)
				g.propagateGroupShading(null);
		});
	}
	isRed() {
		return this.groups[0].isRed();
	}
	cutByColor() {
		if (this.groups.length == 0)
			return [];
		var fragments = [];
		var j = 0;
		for (let i = 1; i < this.groups.length; i++) {
			if (this.groups[i].isRed() != this.groups[j].isRed()) {
				fragments.push(new MdcFragment(this.groups.slice(j, i)));
				j = i;
			}
		}
		fragments.push(new MdcFragment(this.groups.slice(j)));
		return fragments;
/*
		var red = this.groups[0].isRed();
		for (let i = 1; i < this.groups.length; i++) {
			if (this.groups[i].isRed() != red) {
				return [new MdcFragment(this.groups.slice(0, i)),
						new MdcFragment(this.groups.slice(i))];
			}
		}
		return [this];
*/
	}
	static strToGroup(str) {
		return syntax.parse(str).groups[0];
	}
}

class MdcPart {
	nColor() {
		return { black: 0, red: 0 };
	}
	propagateGroupShading(corners) {
		this.quadratCorners = corners;
	}
	propagateToggles(state) {
		this.state = state;
		return state;
	}
	static cornersToShading(corners) {
		var shading = 0;
		if (corners.ts)
			shading |= 1;
		if (corners.bs)
			shading |= 2;
		if (corners.te)
			shading |= 4;
		if (corners.be)
			shading |= 8;
		return shading;
	}
	static startCorners(corners) {
		return {
			ts: corners.ts,
			te: corners.ts,
			bs: corners.bs,
			be: corners.bs,
		};
	}
	static endCorners(corners) {
		return {
			ts: corners.te,
			te: corners.te,
			bs: corners.be,
			be: corners.be,
		};
	}
	static topCorners(corners) {
		return {
			ts: corners.ts,
			bs: corners.ts,
			te: corners.te,
			be: corners.te,
		};
	}
	static bottomCorners(corners) {
		return {
			ts: corners.bs,
			bs: corners.bs,
			te: corners.be,
			be: corners.be,
		};
	}
	static topStartCorners(corners) {
		return {
			ts: corners.ts,
			bs: corners.ts,
			te: corners.ts,
			be: corners.ts,
		};
	}
	static bottomStartCorners(corners) {
		return {
			ts: corners.bs,
			bs: corners.bs,
			te: corners.bs,
			be: corners.bs,
		};
	}
	static topEndCorners(corners) {
		return {
			ts: corners.te,
			bs: corners.te,
			te: corners.te,
			be: corners.te,
		};
	}
	static bottomEndCorners(corners) {
		return {
			ts: corners.be,
			bs: corners.be,
			te: corners.be,
			be: corners.be,
		};
	}
	static placeCorners(corners, place) {
		switch (place) {
			case 'ts':
				return MdcPart.topStartCorners(corners);
			case 'bs':
				return MdcPart.bottomStartCorners(corners);
			case 'te':
				return MdcPart.topEndCorners(corners);
			case 'be':
				return MdcPart.bottomEndCorners(corners);
			case 't':
				return MdcPart.topCorners(corners);
			case 'b':
				return MdcPart.bottomCorners(corners);
			default:
				return corners;
		}
	}
	static addCorners(corners1, corners2) {
		return {
			ts: corners1.ts || corners2.ts,
			bs: corners1.bs || corners2.bs,
			te: corners1.te || corners2.te,
			be: corners1.be || corners2.be,
		};
	}
	static completeCorners(corners, global) {
		return {
			ts: corners.ts || global,
			bs: corners.bs || global,
			te: corners.te || global,
			be: corners.be || global,
		};
	}
	shadingOf(corners) {
		const cornersAny = MdcPart.completeCorners(corners, this.state.shade);
		return MdcPart.cornersToShading(cornersAny);
	}
	shadingAny() {
		if (this.shade)
			return this.shadingOf(MdcPart.addCorners(this.shade, this.quadratCorners));
		else
			return this.shadingOf(this.quadratCorners);
	}
	toGroup() {
		return null;
	}
}

class MdcBreak extends MdcPart {
	text;
	constructor(text) {
		super();
		this.text = text;
	}
}

class MdcText extends MdcPart {
	text;
	constructor(text) {
		super();
		this.text = text;
	}
	append(text) {
		if (this.text != '')
			this.text += '\n';
		this.text += text;
		return this;
	}
	toString() {
		return this.text.replace(/^\+[a-z]/, '')
	}
}

class MdcLineNumber extends MdcPart {
	text;
	constructor(text) {
		super();
		this.text = text;
	}
	toString() {
		return this.text.substr(1);
	}
}

class MdcQuadrat extends MdcPart {
	group;
	shading;
	constructor(group, shading) {
		super();
		this.group = group;
		this.shading = shading;
	}
	chainedLeaf() {
		return this.group.chainedLeaf();
	}
	nColor() {
		return this.group.nColor();
	}
	isRed() {
		const color = this.nColor();
		return color.red > color.black;
	}
	propagateToggles(state) {
		return this.group.propagateToggles(state);
	}
	propagateGroupShading(corners) {
		const combinedCorners = {
				ts: this.shading.indexOf('1') >= 0 || (corners && corners.ts),
				te: this.shading.indexOf('2') >= 0 || (corners && corners.te),
				bs: this.shading.indexOf('3') >= 0 || (corners && corners.bs),
				be: this.shading.indexOf('4') >= 0 || (corners && corners.be)};
		this.group.propagateGroupShading(combinedCorners);
	}
	toGroup() {
		const group = this.group.toGroup();
		return group ? group : null;
	}
}

class MdcVertical extends MdcPart {
	groups;
	constructor(groups) {
		super();
		this.groups = groups;
	}
	add(group) {
		this.groups.push(group);
		return this;
	}
	propagateToggles(state) {
		var groups = [];
		this.groups.forEach(g => {
			state = g.propagateToggles(state);
			if (!(g instanceof MdcToggle))
				groups.push(g);
		});
		this.groups = groups;
		return state;
	}
	propagateGroupShading(corners) {
		const topCorners = MdcPart.topCorners(corners);
		const bottomCorners = MdcPart.bottomCorners(corners);
		for (let i = 0; i < (this.groups.length-1) / 2; i++) {
			this.groups[i].propagateGroupShading(topCorners);
			this.groups[this.groups.length-1-i].propagateGroupShading(bottomCorners);
		}
		if (this.groups.length % 2 == 1) {
			const middle = Math.round((this.groups.length-1)/2);
			this.groups[middle].propagateGroupShading(corners);
		}
	}
	nColor() {
		var black = 0;
		var red = 0;
		this.groups.forEach(g => {
			const color = g.nColor();
			black += color.black;
			red += color.red;
		});
		return { black, red };
	}
	toGroup() {
		if (this.groups.length > 2) {
			const first = this.groups[0].chainedLeaf();
			const last = this.groups[this.groups.length-1].chainedLeaf();
			if (first instanceof MdcBracketOpen && last instanceof MdcBracketClose) {
				const innerGroups = this.innerSubgroups();
				if (innerGroups.length) {
					const open = first.toGroup();
					const close = last.toGroup();
					return new Horizontal([open].concat(innerGroups, close));
				} else {
					return MdcSign.errorLiteral();
				}
			}
		}
		const groups = MdcVertical.expand(this.subgroups());
		if (groups.length >= 2) {
			const groupsProper = groups.filter(g =>
				!(g instanceof BracketOpen || g instanceof BracketClose));
			if (groupsProper.length >= 2)
				return new Vertical(groupsProper);
			else if (groupsProper.length == 1)
				return groupsProper[0];
			else
				return null;
		} else if (groups.length == 1) {
			return groups[0];
		} else {
			return null;
		}
	}
	static isSubgroup(group) {
		switch (group.constructor) {
			case Horizontal:
			case Enclosure:
			case Basic:
			case Overlay:
			case Literal:
			case Blank:
			case Lost:
			case BracketOpen:
			case BracketClose:
			case Vertical:
				return true;
			default:
				return false;
		}
	}
	subgroups() {
		return this.groups.map(g => g.toGroup()).
			filter(g => g).filter(g => MdcVertical.isSubgroup(g));
	}
	innerSubgroups() {
		return this.groups.slice(1, this.groups.length-1).
			map(g => g.toGroup()).filter(g => g).filter(g => MdcHorizontal.isSubgroup(g));
	}
	chainedLeaf() {
		return this.groups.length == 1 ? this.groups[0].chainedLeaf() : null;
	}
	static expand(groups) {
		return groups.map(g => g instanceof Vertical ? g.groups : [g]).flat();
	}
}

class MdcHorizontal extends MdcPart {
	groups;
	constructor(groups) {
		super();
		this.groups = groups;
	}
	add(group) {
		this.groups.push(group);
		return this;
	}
	propagateToggles(state) {
		var groups = [];
		this.groups.forEach(g => {
			state = g.propagateToggles(state);
			if (!(g instanceof MdcToggle))
				groups.push(g);
		});
		this.groups = groups;
		return state;
	}
	propagateGroupShading(corners) {
		const startCorners = MdcPart.startCorners(corners);
		const endCorners = MdcPart.endCorners(corners);
		for (let i = 0; i < (this.groups.length-1) / 2; i++) {
			this.groups[i].propagateGroupShading(startCorners);
			this.groups[this.groups.length-1-i].propagateGroupShading(endCorners);
		}
		if (this.groups.length % 2 == 1) {
			const middle = Math.round((this.groups.length-1)/2);
			this.groups[middle].propagateGroupShading(corners);
		}
	}
	nColor() {
		var black = 0;
		var red = 0;
		this.groups.forEach(g => {
			const color = g.nColor();
			black += color.black;
			red += color.red;
		});
		return { black, red };
	}
	toGroup() {
		const groups = MdcHorizontal.expand(this.subgroups());
		if (this.groups.length > 2) {
			const first = this.groups[0].chainedLeaf();
			const last = this.groups[this.groups.length-1].chainedLeaf();
			if (first instanceof MdcBracketOpen && last instanceof MdcBracketClose) {
				const innerGroups = this.innerSubgroups();
				if (innerGroups.length) {
					const open = first.toGroup();
					const close = last.toGroup();
					return new Horizontal([open].concat(innerGroups, close));
				} else {
					return MdcSign.errorLiteral();
				}
			}
		}
		if (groups.length >= 2) {
			const groupsProper = groups.filter(g =>
				!(g instanceof BracketOpen || g instanceof BracketClose));
			if (groupsProper.length >= 2)
				return new Horizontal(groupsProper);
			else if (groupsProper.length == 1)
				return groupsProper[0];
			return null;
		} else if (groups.length == 1)
			return groups[0];
		else
			return null;
	}
	static isSubgroup(group) {
		switch (group.constructor) {
			case Horizontal:
			case Enclosure:
			case Basic:
			case Overlay:
			case Literal:
			case Blank:
			case Lost:
			case BracketOpen:
			case BracketClose:
			case Vertical:
				return true;
			default:
				return false;
		}
	}
	subgroups() {
		return this.groups.map(g => g.toGroup()).
			filter(g => g).filter(g => MdcHorizontal.isSubgroup(g));
	}
	innerSubgroups() {
		return this.groups.slice(1, this.groups.length-1).
			map(g => g.toGroup()).filter(g => g).filter(g => MdcHorizontal.isSubgroup(g));
	}
	chainedLeaf() {
		return this.groups.length == 1 ? this.groups[0].chainedLeaf() : null;
	}
	static expand(groups) {
		return groups.map(g => g instanceof Horizontal ? g.groups : [g]).flat();
	}
}

class MdcComplex extends MdcPart {
	group1;
	hieroglyph;
	group2;
	constructor(group1, hieroglyph, group2) {
		super();
		this.group1 = group1;
		this.hieroglyph = hieroglyph;
		this.group2 = group2;
	}
	toGroup() {
		if (this.hieroglyph instanceof MdcSign) {
			const core = this.hieroglyph.toGroup();
			const name = this.hieroglyph.name ? MdcSign.resolveName(this.hieroglyph.name) : '';
			if (core && MdcComplex.canBeCore(core)) {
				const places = Shapes.allowedPlaces(core.ch);
				if (name in mdcComplex) {
					var placesPre = [mdcComplex[name]['zone1']];
					var placesPost = [mdcComplex[name]['zone2']];
				} else {
					var placesPre = ['ts', 'bs'].filter(p => places.has(p));
					var placesPost = ['te', 'be'].filter(p => places.has(p));
				}
				var g1 = this.group1 ? this.group1.toGroup() : null;
				var g2 = this.group2 ? this.group2.toGroup() : null;
				if (g1 && !MdcComplex.canBeInsertion(g1))
					g1 = MdcSign.errorLiteral();
				if (g2 && !MdcComplex.canBeInsertion(g2))
					g2 = MdcSign.errorLiteral();
				if (!g1 && !g2)
					return core;
				var insertions = { };
				if (g1) {
					const place1 = placesPre.length ? placesPre[0] : 'ts';
					insertions[place1] = g1;
				}
				if (g2) {
					const place2 = placesPost.length ? placesPost[0] : 'te';
					insertions[place2] = g2;
				}
				return new Basic(core, insertions);
			}
		}
		return MdcSign.errorLiteral();
	}
	propagateToggles(state) {
		super.propagateToggles(state);
		if (this.group1)
			state = this.group1.propagateToggles(state);
		state = this.hieroglyph.propagateToggles(state);
		return this.group2 ? this.group2.propagateToggles(state) : state;
	}
	propagateGroupShading(corners) {
		if (this.group1)
			this.group1.propagateGroupShading(MdcPart.startCorners(corners));
		this.hieroglyph.propagateGroupShading(corners);
		if (this.group2)
			this.group2.propagateGroupShading(MdcPart.endCorners(corners));
	}
	chainedLeaf() {
		return null;
	}
	nColor() {
		const color = this.hieroglyph.nColor();
		var black = color.black;
		var red = color.red;
		if (this.group1) {
			const color1 = this.group1.nColor();
			black += color1.black;
			red += color1.red;
		}
		if (this.group2) {
			const color2 = this.group2.nColor();
			black += color2.black;
			red += color2.red;
		}
		return { black, red };
	}
	static canBeCore(group) {
		return group instanceof Literal ||
			group instanceof Overlay;
	}
	static canBeInsertion(group) {
		return group instanceof Vertical ||
			group instanceof Horizontal ||
			group instanceof Basic ||
			group instanceof Overlay ||
			group instanceof Literal ||
			group instanceof Blank ||
			group instanceof Enclosure ||
			group instanceof Lost;
	}
}

class MdcOverlay extends MdcPart {
	hieroglyph1;
	hieroglyph2;
	constructor(hieroglyph1, hieroglyph2) {
		super();
		this.hieroglyph1 = hieroglyph1;
		this.hieroglyph2 = hieroglyph2;
	}
	propagateToggles(state) {
		super.propagateToggles(state);
		return this.hieroglyph2.propagateToggles(this.hieroglyph1.propagateToggles(state));
	}
	propagateGroupShading(corners) {
		super.propagateGroupShading(corners);
		this.hieroglyph1.propagateGroupShading(corners);
		this.hieroglyph2.propagateGroupShading(corners);
	}
	chainedLeaf() {
		return null;
	}
	nColor() {
		const color1 = this.hieroglyph1.nColor();
		const color2 = this.hieroglyph2.nColor();
		const black = color1.black + color2.block;
		const red = color1.red + color2.red;
		return { black, red };
	}
	toGroup() {
		const shade = this.shadingAny();
		var lits1 = [MdcSign.errorLiteral()];
		var lits2 = [MdcSign.errorLiteral()];
		if (this.hieroglyph1 instanceof MdcSign) {
			const name1 = MdcSign.resolveName(this.hieroglyph1.name);
			const c1 = MdcSign.nameToChar(name1);
			if (c1)
				lits1 = [new Literal(c1, 0, false, shade)];
		}
		if (this.hieroglyph2 instanceof MdcSign) {
			const name2 = MdcSign.resolveName(this.hieroglyph2.name);
			const c2 = MdcSign.nameToChar(name2);
			if (c2)
				lits2 = [new Literal(c2, 0, false, shade)];
		}
		return new Overlay(lits1, lits2);
	}
}

class MdcLigature extends MdcPart {
	hieroglyphs;
	constructor(hieroglyph1, hieroglyph2) {
		super();
		this.hieroglyphs = [hieroglyph1, hieroglyph2];
	}
	add(hieroglyph) {
		this.hieroglyphs.push(hieroglyph);
		return this;
	}
	propagateToggles(state) {
		super.propagateToggles(state);
		this.hieroglyphs.forEach(h => {
			state = h.propagateToggles(state);
		});
		return state;
	}
	propagateGroupShading(corners) {
		super.propagateGroupShading(corners);
		this.hieroglyphs.forEach(h => { h.propagateGroupShading(corners); });
	}
	chainedLeaf() {
		return null;
	}
	nColor() {
		var black = 0;
		var red = 0;
		this.hieroglyphs.forEach(h => {
			const color = h.nColor();
			black += color.black;
			red += color.red;
		});
		return { black, red };
	}
	toGroup() {
		const shade = this.shadingAny();
		const names = this.hieroglyphs.map(h => {
			if (h instanceof MdcSign) {
				const name = MdcSign.resolveName(h.name);
				if (MdcSign.nameToChar(name))
					return [name];
			}
			return [];
		}).flat();
		const composed = names.join('&');
		if (composed in MdcLigatures)
			return MdcFragment.strToGroup(MdcLigatures[composed]);
		if (names.length == 0)
			return null;
		if (names.length == 1)
			return this.subLiteral(names[0], null);
		if (names.every(n => MdcLigatureIsFlat(n))) {
			const namesHor = names.filter(n => MdcLigatureFlatTall.includes(n));
			const namesVer = names.filter(n => MdcLigatureFlatWide.includes(n));
			if (namesHor.length > 0 && namesVer.length > 0) {
				const litsHor = namesHor.map(n => this.subLiteral(n, null));
				const litsVer = namesVer.map(n => this.subLiteral(n, null));
				return new Overlay(litsHor, litsVer);
			}
		}
		if (names.length == 2 && names[1] in MdcLigaturePairTwo) {
			const place = MdcLigaturePairTwo[names[1]];
			var insertions = { };
			insertions[place] = this.subLiteral(names[0], place);
			return new Basic(this.subLiteral(names[1], null), insertions);
		}
		if (names.length == 3 && names[1] in MdcLigatureTripleTwo) {
			const places = MdcLigatureTripleTwo[names[1]];
			var insertions = { };
			insertions[places[0]] = this.subLiteral(names[0], places[0]);
			insertions[places[1]] = this.subLiteral(names[2], places[1]);
			return new Basic(this.subLiteral(names[1], null), insertions);
		}
		const places = Shapes.allowedPlaces(MdcSign.nameToChar(names[0]));
		const place = names[0] in MdcLigatureOne ? MdcLigatureOne[names[0]] :
				places.size > 0 ? places.values().next().value : 'ts';
		if (names.length == 2) {
			var insertions = { };
			insertions[place] = this.subLiteral(names[1], place);
			return new Basic(this.subLiteral(names[0], null), insertions);
		}
		var insertions = { };
		insertions[place] = new Vertical(names.slice(1).map(n => this.subLiteral(n, place)));
		return new Basic(this.subLiteral(names[0], null), insertions);
	}
	subLiteral(name, place) {
		const corners = place ? MdcPart.placeCorners(this.quadratCorners, place) : this.quadratCorners;
		const shade = this.shadingOf(corners);
		return new Literal(MdcSign.nameToChar(name), 0, false, shade);
	}
}

class MdcAbsolute extends MdcPart {
	hieroglyphs;
	constructor(hieroglyph1, hieroglyph2) {
		super();
		this.hieroglyphs = [hieroglyph1, hieroglyph2];
	}
	add(hieroglyph) {
		this.hieroglyphs.push(hieroglyph);
		return this;
	}
	propagateToggles(state) {
		super.propagateToggles(state);
		this.hieroglyphs.forEach(h => {
			state = h.propagateToggles(state);
		});
		return state;
	}
	propagateGroupShading(corners) {
		super.propagateGroupShading(corners);
		this.hieroglyphs.forEach(h => { h.propagateGroupShading(corners); });
	}
	chainedLeaf() {
		return null;
	}
	nColor() {
		var black = 0;
		var red = 0;
		this.hieroglyphs.forEach(h => {
			const color = h.nColor();
			black += color.black;
			red += color.red;
		});
		return { black, red };
	}
	toGroup() {
		const shade = this.shadingAny();
		var parts = [];
		this.hieroglyphs.forEach(h => {
			if (h instanceof MdcSign) {
				const name = MdcSign.resolveName(h.name);
				const c = MdcSign.nameToChar(name);
				if (c)
					parts.push({ 
						ch: c, 
						mirror: h.mirror,
						scale: MdcAbsolute.sizeOfAbsolute(h.placement),
						place: MdcAbsolute.placeOfAbsolute(h.placement) });
			}
		});
		if (parts.length == 0)
			return MdcSign.errorLiteral();
		if (parts.length == 1)
			return new Literal(parts[0].ch, 0, parts[0].mirror, shade);
		const biggest = Math.max(...parts.map(p => p.scale));
		const j = parts.findIndex(p => p.scale == biggest);
		const core = new Literal(parts[j].ch, 0, parts[j].mirror, shade);
		const placesFirst = Shapes.allowedPlaces(parts[j].ch);
		const placeFirst = placesFirst.size > 0 ? placesFirst.values().next().value : 'ts';
		var placeToChar = {};
		for (let i = 0; i < parts.length; i++) {
			if (i != j) {
				const pl = parts[i].place;
				if (pl in placeToChar)
					placeToChar[pl].push(parts[i].ch);
				else
					placeToChar[pl] = [parts[i].ch];
			}
		}
		var insertions = { };
		for (let place in placeToChar) {
			const cs = placeToChar[place];
			if (cs.length == 1) {
				insertions[place] = this.subLiteral(cs[0], place);
			} else {
				const groups = cs.map(c => this.subLiteral(c, place));
				insertions[place] = new Vertical(groups);
			}
		}
		return new Basic(core, insertions);
	}
	static placeOfAbsolute(placement) {
		if (!placement)
			return 'ts';
		const x = placement.x;
		const y = placement.y;
		if (x < 350) {
			if (y < 350)
				return 'ts';
			else
				return 'bs';
		} else {
			if (y < 350)
				return 'te';
			else
				return 'be';
		}
	}
	static sizeOfAbsolute(placement) {
		return !placement ? 100 : placement.s;
	}
	subLiteral(c, place) {
		const corners = place ? MdcPart.placeCorners(this.quadratCorners, place) : this.quadratCorners;
		const shade = this.shadingOf(corners);
		return new Literal(c, 0, false, shade);
	}
}

class MdcHieroglyph extends MdcPart {
	placement;
	constructor() {
		super();
	}
	addModifiers(mods) {
		if ('shade' in mods)
			this.shade = mods.shade;
		if ('color' in mods)
			this.color = mods.color;
		if ('mirror' in mods)
			this.mirror = mods.mirror;
		if ('rotate' in mods)
			this.rotate = mods.rotate;
		return this;
	}
	addPlacement(placement) {
		this.placement = placement;
		return this;
	}
	propagateToggles(state) {
		super.propagateToggles(state);
		return state;
	}
	chainedLeaf() {
		return this;
	}
	isRed() {
		return this.color == 'red' || this.state.color == 'red';
	}
	nColor() {
		return this.isRed() ? { black: 0, red: 1 } : { black: 1, red: 0 };
	}
}

class MdcSign extends MdcHieroglyph {
	name;
	state;
	constructor(name) {
		super();
		this.name = name;
	}
	toGroup() {
		const mdcName = mdcNames[this.name];
		var vs = 0;
		if ('rotate' in this) {
			const rounded = Math.round(this.rotate % 360 / 45) * 45;
			vs = Group.rotateToNum(rounded);
		}
		const shade = this.shadingAny();
		const mirror = 'mirror' in this ? this.mirror : false;
		if (mdcName) {
			if (mdcName.kind == 'literal')
				return new Literal(mdcName.str, vs, mirror, shade);
			else if (mdcName.kind == 'singleton')
				return new Singleton(mdcName.str, shade);
			else
				return MdcFragment.strToGroup(mdcName.str);
		} else {
			return new Literal(MdcSign.nameToChar(this.name), vs, mirror, shade);
		}
	}
	static nameToChar(name) {
		var uniName = name;
		if (name in mdcMnemonics)
			uniName = mdcMnemonics[name];
		else if (name in uniMnemonics)
			uniName = uniMnemonics[name];
		else if (name.match(/(Aa|NL|NU|[A-IK-Z])([0-9]{1,3})[A-Z]/))
			uniName = name.slice(0, -1) + name[name.length-1].toLowerCase();
		if (uniName in uniGlyphs)
			return String.fromCodePoint(uniGlyphs[uniName]);
		else
			return Shapes.PLACEHOLDER;
	}
	static resolveName(name) {
		if (name in mdcMnemonics)
			return mdcMnemonics[name];
		else if (name in uniMnemonics)
			return uniMnemonics[name];
		else if (name.match(/(Aa|NL|NU|[A-IK-Z])([0-9]{1,3})[A-Z]/))
			return name.slice(0, -1) + name[name.length-1].toLowerCase();
		else
			return name;
	}
	static errorLiteral() {
		return new Literal(Shapes.PLACEHOLDER, 0, false, 0);
	}
}

class MdcBlank extends MdcHieroglyph {
	size;
	constructor(size) {
		super();
		this.size = size;
	}
	toGroup() {
		return this.shadingAny() ? new Lost(this.size, this.size, true) : new Blank(this.size);
	}
}

class MdcLost extends MdcHieroglyph {
	w;
	h;
	constructor(w, h) {
		super();
		this.w = w;
		this.h = h;
	}
	toGroup() {
		return new Lost(this.w, this.h, false);
	}
}

class MdcBracketOpen extends MdcHieroglyph {
	ch;
	constructor(ch) {
		super();
		this.ch = ch;
	}
	toGroup() {
		return new BracketOpen(this.toString());
	}
	toString() {
		switch (this.ch) {
			case '[&': return '\u2329';
			case '[{': return '{';
			case '[[': return '[';
			case '[\\': return '[';
			case '["': return '[';
			case '[\'': return '[';
			case '[(': return '(';
			case '[?': return '\u2E22';
			default: return '[';
		}
	}
}

class MdcBracketClose extends MdcHieroglyph {
	ch;
	constructor(ch) {
		super();
		this.ch = ch;
	}
	toGroup() {
		return new BracketClose(this.toString());
	}
	toString() {
		switch (this.ch) {
			case '&]': return '\u232A';
			case '}]': return '}';
			case ']]': return ']';
			case '\\]': return ']';
			case '"]': return ']';
			case '\']': return ']';
			case ')]': return ')';
			case '?]': return '\u2E23';
			default: return ']';
		}
	}
}

class MdcEnclosure extends MdcHieroglyph {
	begin;
	groups;
	end;
	state;
	constructor(begin, groups, end) {
		super();
		this.begin = begin;
		this.groups = groups;
		this.end = end;
	}
	propagateToggles(state) {
		super.propagateToggles(state);
		var groups = [];
		this.groups.forEach(g => {
			state = g.propagateToggles(state);
			if (!(g instanceof MdcToggle))
				groups.push(g);
		});
		this.groups = groups;
		return state;
	}
	propagateGroupShading(corners) {
		super.propagateGroupShading(corners);
		this.startCorners = MdcPart.startCorners(corners);
		this.endCorners = MdcPart.endCorners(corners);
		for (let i = 0; i < (this.groups.length-1) / 2; i++) {
			this.groups[i].propagateGroupShading(this.startCorners);
			this.groups[this.groups.length-1-i].propagateGroupShading(this.endCorners);
		}
		if (this.groups.length % 2 == 1) {
			const middle = Math.round((this.groups.length-1)/2);
			this.groups[middle].propagateGroupShading(corners);
		}
	}
	isRed() {
		return this.color == 'red' || this.state.color == 'red';
	}
	nColor() {
		var black = this.isRed() ? 0 : 1;
		var red = this.isRed() ? 1 : 0;
		this.groups.forEach(g => {
			const color = g.nColor();
			black += color.black;
			red += color.red;
		});
		return { black, red };
	}
	toGroup() {
		const groups = [];
		this.groups.forEach(g => {
			const group = g.toGroup();
			if (group)
				groups.push(group);
		});
		var type = 'plain';
		var delimOpen = '\u{13379}';
		var delimClose = '\u{1337A}';
		if (this.begin == '' && this.end == '') {
		} else if (this.begin == 'S' && this.end == '') {
			delimOpen = '\u{13258}';
			delimClose = '\u{13282}';
		} else if (this.begin == 'H' && this.end == '') {
			delimOpen = '\u{13258}';
			delimClose = '\u{1325C}';
		} else if (this.begin == 'F' && this.end == '') {
			type = 'walled';
			delimOpen = '\u{13288}';
			delimClose = '\u{13289}';
		} else {
			if (this.begin == '0')
				delimOpen = null;
			else if (this.begin == '1')
				;
			else if (this.begin == '2')
				delimOpen = '\u{1342F}';
			else if (this.begin == 'h0')
				delimOpen = null;
			else if (this.begin == 'h1')
				delimOpen = '\u{13258}';
			else if (this.begin == 'h2')
				delimOpen = '\u{13259}';
			else if (this.begin == 'h3')
				delimOpen = '\u{1325A}';
			else if (this.begin == 's0')
				delimOpen = null;
			else if (this.begin == 's1')
				delimOpen = '\u{13258}';
			else if (this.begin == 's2')
				delimOpen = '\u{13258}';
			else if (this.begin == 's3')
				delimOpen = '\u{13258}';
			else if (this.begin == 'f0') {
				type = 'walled';
				delimOpen = null;
			} else if (this.begin == 'f1') {
				type = 'walled';
				delimOpen = '\u{13288}';
			}
			if (this.end == '0')
				delimClose = null;
			else if (this.end == '1')
				delimClose = '\u{1337B}';
			else if (this.end == '2')
				;
			else if (this.end == 'h0')
				delimClose = null;
			else if (this.end == 'h1')
				delimClose = '\u{1325D}';
			else if (this.end == 'h2')
				delimClose = '\u{1325C}';
			else if (this.end == 'h3')
				delimClose = '\u{1325B}';
			else if (this.end == 's0')
				delimClose = null;
			else if (this.end == 's1')
				delimClose = '\u{1325D}';
			else if (this.end == 's2')
				delimClose = '\u{13282}';
			else if (this.end == 's3')
				delimClose = '\u{1325D}';
			else if (this.end == 'f0')
				delimClose = null;
			else if (this.end == 'f1')
				delimClose = '\u{13289}';
		}
		const shadeOpen = MdcPart.cornersToShading(
			MdcPart.completeCorners(this.startCorners, this.state.shade));
		const shadeClose = MdcPart.cornersToShading(
			MdcPart.completeCorners(this.endCorners, this.state.shade));
		return new Enclosure(type, groups, delimOpen, shadeOpen, delimClose, shadeClose);
	}
	toString() {
		return this.begin + this.groups.map(g => g.toString()) + this.end;
	}
}

class MdcModifier {
	constructor() {
	}
	extend(mod) {
		for (let key in mod)
			this[key] = mod[key];
		return this;
	}
}

class MdcState {
	color;
	shade;
	constructor() {
		this.color = 'black';
		this.shade = false;
	}
	updated(toggle) {
		var next = new MdcState();
		switch (toggle.shade) {
			case 'toggle':
				next.shade = !this.shade;
				break;
			case 'on':
				next.shade = true;
				break;
			case 'off':
				next.shade = false;
				break;
			default:
				next.shade = this.shade;
		}
		switch (toggle.color) {
			case 'toggle':
				next.color = this.color == 'black' ? 'red' : 'black';
				break;
			case 'red':
			case 'black':
				next.color = toggle.color;
				break;
			default:
				next.color = this.color;
		}
		return next;
	}
}

class MdcToggle {
	constructor() {
	}
	propagateToggles(state) {
		return state.updated(this);
	}
	extend(mods) {
		if ('shade' in mods)
			this.shade = mods.shade;
		if ('color' in mods)
			this.color = mods.color;
		return this;
	}
	isEmpty() {
		return !('shade' in this || 'color' in this);
	}
}
