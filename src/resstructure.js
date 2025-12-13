class ResCoord {
	constructor(str) {
		this.str = str;
	}
	toString() {
		return this.str;
	}
}

class ResLine {
	constructor(str) {
		this.str = str;
	}
	toString() {
		return this.str;
	}
}

class ResGlobals {
	constructor(dir, size) {
		this.dir = 'hlr';
		this.size = 1;
		this.color = 'black';
		this.shade = false;
		this.sep = 1;
		this.fit = false;
		this.mirror = false;
		if (dir != null)
			this.dir = dir;
		if (size != null)
			this.size = size;
	}
	clone() {
		var copy = new ResGlobals(this.direction, this.size);
		copy.color = this.color;
		copy.shade = this.shade;
		copy.sep = this.sep;
		copy.fit = this.fit;
		copy.mirror = this.mirror;
		return copy;
	}
	update(size) {
		if (size == this.size)
			return this;
		else {
			var copy = this.clone();
			copy.size = size;
			return copy;
		}
	}
	toHeaderArgs() {
		var args = [];
		if (this.dir != 'hlr')
			args.push(new ResArg(this.dir, null));
		if (this.size != 1)
			args.push(new ResArg('size', this.size));
		return args;
	}
	toSwitchArgs() {
		var args = [];
		if (this.color != 'black')
			args.push(new ResArg(this.color, null));
		if (this.shade)
			args.push(new ResArg('shade', null));
		if (this.sep != 1)
			args.push(new ResArg('sep', this.sep));
		if (this.fit)
			args.push(new ResArg('fit', null));
		if (this.mirror)
			args.push(new ResArg('mirror', null));
		return args;
	}
}

class ResFragment {
	constructor(argList, sw, hiero) {
		this.dir = null;
		this.size = null;
		for (let arg of argList) {
			if (arg.isDir())
				this.dir = arg.lhs;
			else if (arg.isRealNonZero('size'))
				this.size = arg.rhs;
			else
				arg.error('Fragment');
		}
		this.sw = sw;
		this.hiero = hiero;
		this.propagate();
	}
	static construct(hieroOld, j, i) {
		const groups = hieroOld.groups.slice(j, i);
		const ops = hieroOld.ops.slice(j, i-1);
		const sws = hieroOld.sws.slice(j, i-1);
		const globals = groups[0].globals;
		const hArgs = globals.toHeaderArgs();
		const sArgs = globals.toSwitchArgs();
		const hiero = new ResHiero(groups[0]);
		for (let i = 1; i < groups.length; i++)
			hiero.addGroup(ops[i-1].toArgs(), new ResSwitch(sws[i-1].toArgs()), groups[i]);
		return new ResFragment(hArgs, new ResSwitch(sArgs), hiero);
	}
	propagate() {
		this.globals = this.sw.update(new ResGlobals(this.dir, this.size));
		if (this.hiero)
			this.hiero.propagate(this.globals);
	}
	cutByColor() {
		if (this.hiero) {
			var fragments = [];
			var j = 0;
			for (let i = 1; i < this.hiero.groups.length; i++) {
				if (this.hiero.groups[i].isRed() != this.hiero.groups[j].isRed()) {
					const fragment = ResFragment.construct(this.hiero, j, i);
					fragments.push(fragment);
					j = i;
				}
			}
			const fragment = ResFragment.construct(this.hiero, j, this.hiero.groups.length);
			fragments.push(fragment);
			return fragments;
		} else {
			return [this];
		}
	}
	isRed() {
		return this.hiero ? this.hiero.isRed() : false;
	}
	toUnicode() {
		if (this.hiero) {
			const converted = this.hiero.toUnicode(false);
			return { str: converted.groups.map(g => g.toString()).join(''),
						warnings: converted.warnings };
		} else {
			return { str: '', warnings: [] };
		}
	}
}

class ResPart {
	constructor() {
	}
	propagate(globals) {
		this.globals = globals;
	}
	shadingCorners() {
		var corners = { ts: false, bs: false, te: false, be: false };
		if (this.shade != null || this.shades.length > 0) {
			if (this.shade == true)
				corners = { ts: true, bs: true, te: true, be: true };
			else
				for (let pattern of this.shades) {
					const square = ResPart.patternToSquare(pattern);
					if (square.xLow < 0.5 && square.yLow < 0.5)
						corners.ts = true;
					if (square.xLow < 0.5 && square.yHigh > 0.5)
						corners.bs = true;
					if (square.xHigh > 0.5 && square.yLow < 0.5)
						corners.te = true;
					if (square.xHigh > 0.5 && square.yHigh > 0.5)
						corners.be = true;
				}
		} else if (this.globals.shade) {
			corners = { ts: true, bs: true, te: true, be: true };
		}
		return corners;
	}
	shading() {
		return ResPart.cornersToShading(this.shadingCorners());
	}
	static patternToSquare(pattern) {
		var xLow = 0;
		var xHigh = 1;
		var yLow = 0;
		var yHigh = 1;
		for (let ch of pattern)
			switch (ch) {
				case 's': {
					const xMid = xLow + (xHigh - xLow) / 2;
					xHigh = xMid;
					break;
				}
				case 'e': {
					const xMid = xLow + (xHigh - xLow) / 2;
					xLow = xMid;
					break;
				}
				case 't': {
					const yMid = yLow + (yHigh - yLow) / 2;
					yHigh = yMid;
					break;
				}
				case 'b': {
					const yMid = yLow + (yHigh - yLow) / 2;
					yLow = yMid;
					break;
				}
			}
		return { xLow, xHigh, yLow, yHigh };
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
	isRed() {
		const color = this.nColor();
		return color.red > color.black;
	}
	nColor() {
		return { black: 0, red: 0 };
	}
}

class ResHiero extends ResPart {
	constructor(group) {
		super();
		this.groups = [group];
		this.ops = [];
		this.sws = [];
	}
	addGroup(argList, sw, group) {
		this.ops.push(new ResOp(argList, false));
		this.sws.push(sw);
		this.groups.push(group);
		return this;
	}
	toString() {
		var s = this.groups[0].toString();
		for (let i = 0; i < this.ops.length; i++)
			s += '-' + this.ops[i].toString(false) + this.sws[i].toString() +
				this.groups[i+1].toString();
		return s;
	}
	propagate(globals) {
		super.propagate(globals);
		globals = this.groups[0].propagate(globals);
		for (let i = 0; i < this.ops.length; i++) {
			globals = this.ops[i].propagate(globals);
			globals = this.sws[i].update(globals);
			globals = this.groups[i+1].propagate(globals);
		}
		return globals;
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
	toGroups() {
		return this.groups.map(g => g.toGroup()).filter(g => g);
	}
	toUnicode(inEnclosure) {
		var groups = [];
		var warnings = [];
		this.groups.forEach(g => {
			const converted = g.toUnicode();
			if (converted.warnings.length > 0)
				warnings.push(g.toString());
			if (converted.group)
				groups.push(converted.group);
			warnings.push(...converted.warnings);
		});
		groups = groups.filter(g => {
			if (ResHiero.isTopgroup(g, inEnclosure)) {
				return true;
			} else {
				warnings.push('Ignored top group with type ' + g.constructor.name);
				return false;
			}
		});
		return { groups, warnings };
	}
	static isTopgroup(group, inEnclosure) {
		switch (group.constructor) {
			case Vertical:
			case Horizontal:
			case Enclosure:
			case Basic:
			case Overlay:
			case Literal:
			case Blank:
			case Lost:
				return true;
			case Singleton:
				return !inEnclosure;
			default:
				return false;
		}
	}
}

class ResVerGroup extends ResPart {
	constructor(group1, argList, sw, group2) {
		super();
		this.groups = [group1, group2];
		this.ops = [new ResOp(argList, true)];
		this.sws = [sw];
	}
	addGroup(argList, sw, group) {
		this.ops.push(new ResOp(argList, false));
		this.sws.push(sw);
		this.groups.push(group);
		return this;
	}
	toString() {
		var s = this.groups[0].toString();
		for (let i = 0; i < this.ops.length; i++)
			s += ':' + this.ops[i].toString(i == 0) + this.sws[i].toString() +
				this.groups[i+1].toString();
		return s;
	}
	propagate(globals) {
		super.propagate(globals);
		globals = this.groups[0].propagate(globals);
		for (let i = 0; i < this.ops.length; i++) {
			globals = this.ops[i].propagate(globals);
			globals = this.sws[i].update(globals);
			globals = this.groups[i+1].propagate(globals);
		}
		return globals;
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
	toUnicode() {
		var groups = [];
		var warnings = [];
		this.groups.forEach(g => {
			const converted = g.toUnicode();
			if (converted.group)
				groups.push(converted.group);
			warnings.push(...converted.warnings);
		});
		if (groups.length == 0)
			return { group: null, warnings };
		if (groups.length == 1)
			return { group: groups[0], warnings };
		groups = groups.filter(g => {
			if (ResVerGroup.isSubgroup(g)) {
				return true;
			} else {
				warnings.push('Ignored vertical subgroup with type ' + g.constructor.name);
				return false;
			}
		});
		groups = ResVerGroup.expand(groups);
		if (groups.length == 0)
			return { group: null, warnings };
		if (groups.length == 1)
			return { group: groups[0], warnings };
		return { group: new Vertical(groups), warnings };
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
			case Vertical:
				return true;
			default:
				return false;
		}
	}
	static expand(groups) {
		return groups.map(g => g instanceof Vertical ? g.groups : [g]).flat();
	}
}

class ResVerSubgroup extends ResPart {
	constructor(sw1, group, sw2) {
		super();
		this.sw1 = sw1;
		this.group = group;
		this.sw2 = sw2;
	}
	toString() {
		return this.sw1.toString() + this.group.toString() + this.sw2.toString();
	}
	propagate(globals) {
		super.propagate(globals);
		globals = this.sw1.update(globals);
		globals = this.group.propagate(globals);
		return this.sw2.update(globals);
	}
	nColor() {
		return this.group.nColor();
	}
	toUnicode() {
		return this.group.toUnicode();
	}
}

class ResHorGroup extends ResPart {
	constructor(group1, argList, sw, group2) {
		super();
		this.groups = [group1, group2];
		this.ops = [new ResOp(argList, true)];
		this.sws = [sw];
	}
	addGroup(argList, sw, group) {
		this.ops.push(new ResOp(argList, false));
		this.sws.push(sw);
		this.groups.push(group);
		return this;
	}
	toString() {
		var s = this.groups[0].toString();
		for (let i = 0; i < this.ops.length; i++)
			s += '*' + this.ops[i].toString(i == 0) + this.sws[i].toString() +
				this.groups[i+1].toString();
		return s;
	}
	propagate(globals) {
		super.propagate(globals);
		globals = this.groups[0].propagate(globals);
		for (let i = 0; i < this.ops.length; i++) {
			globals = this.ops[i].propagate(globals);
			globals = this.sws[i].update(globals);
			globals = this.groups[i+1].propagate(globals);
		}
		return globals;
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
	toUnicode() {
		var groups = [];
		var warnings = [];
		this.groups.forEach(g => {
			const converted = g.toUnicode();
			if (converted.group)
				groups.push(converted.group);
			warnings.push(...converted.warnings);
		});
		if (groups.length == 0)
			return { group: null, warnings };
		if (groups.length == 1)
			return { group: groups[0], warnings };
		groups = groups.filter(g => {
			if (ResHorGroup.isSubgroup(g)) {
				return true;
			} else {
				warnings.push('Ignored horizontal subgroup with type ' + g.constructor.name);
				return false;
			}
		});
		groups = ResHorGroup.expand(groups);
		groups = ResHorGroup.normalizeBrackets(groups, warnings);
		if (groups.length == 0)
			return { group: null, warnings };
		if (groups.length == 1)
			return { group: groups[0], warnings };
		return { group: new Horizontal(groups), warnings };
	}
	static isSubgroup(group) {
		switch (group.constructor) {
			case Vertical:
			case Enclosure:
			case Basic:
			case Overlay:
			case Literal:
			case Blank:
			case Lost:
			case BracketOpen:
			case BracketClose:
			case Horizontal:
				return true;
			default:
				return false;
		}
	}
	static expand(groups) {
		return groups.map(g => g instanceof Horizontal ? g.groups : [g]).flat();
	}
	static normalizeBrackets(groups, warnings) {
		for (let i = groups.length-1; i >= 0; i--) {
			const group = groups[i];
			if (group instanceof BracketOpen) {
				if (i == groups.length-1 || groups[i+1] instanceof BracketOpen) {
					warnings.push('Excess bracket open');
					groups.splice(i, 1);
				}
			} else if (group instanceof BracketClose) {
				if (i == 0 || groups[i-1] instanceof BracketClose) {
					warnings.push('Excess bracket close');
					groups.splice(i, 1);
				}
			}
		}
		return groups;
	}
}

class ResHorSubgroup extends ResPart {
	constructor(sw1, group, sw2) {
		super();
		this.sw1 = sw1;
		this.group = group;
		this.sw2 = sw2;
	}
	toString() {
		if (this.group instanceof ResVerGroup)
			return '(' + this.sw1.toString() + this.group.toString() + ')' +
				this.sw2.toString();
		else
			return this.sw1.toString() + this.group.toString() + this.sw2.toString();
	}
	propagate(globals) {
		super.propagate(globals);
		globals = this.sw1.update(globals);
		globals = this.group.propagate(globals);
		return this.sw2.update(globals);
	}
	nColor() {
		return this.group.nColor();
	}
	toUnicode() {
		return this.group.toUnicode();
	}
}

class ResOp extends ResPart {
	constructor(argList, isFirst) {
		super();
		this.sep = null;
		this.fit = null;
		this.fix = false;
		this.shade = null;
		this.shades = [];
		this.size = null;
		for (let arg of argList) {
			if (arg.isReal('sep'))
				this.sep = arg.rhs;
			else if (arg.is('fit'))
				this.fit = true;
			else if (arg.is('nofit'))
				this.fit = false;
			else if (arg.is('fix'))
				this.fix = true;
			else if (arg.is('shade'))
				this.shade = true;
			else if (arg.is('noshade'))
				this.shade = false;
			else if (arg.isPattern())
				this.shades.push(arg.lhs);
			else if (isFirst && arg.isSizeUnit())
				this.size = arg.rhs;
			else
				arg.error('Op');
		}
	}
	toString(isFirst) {
		var args = [];
		if (this.sep != null)
			args.push('sep=' + ResArg.realStr(this.sep));
		if (this.fit == true)
			args.push('fit');
		else if (this.fit == false)
			args.push('nofit');
		if (this.fix)
			args.push('fix');
		if (this.shade == true)
			args.push('shade');
		if (this.shade == false)
			args.push('noshade');
		for (var i = 0; i < this.shades.length; i++)
			args.push(this.shades[i]);
		if (this.size == 'inf') {
			if (isFirst)
				args.push('size=inf');
		} else if (this.size != null)
			args.push('size=' + ResArg.realStr(this.size));
		return ResArg.argsStr(args);
	}
	propagate(globals) {
		super.propagate(globals);
		return globals;
	}
	toArgs() {
		var args = [];
		if (this.sep != null)
			args.push(new ResArg('sep', this.sep));
		if (this.fit == true)
			args.push(new ResArg('fit', null));
		else if (this.fit == false)
			args.push(new ResArg('nofit', null));
		if (this.fix)
			args.push(new ResArg('fix', null));
		if (this.shade == true)
			args.push(new ResArg('shade', null));
		else if (this.shade == false)
			args.push(new ResArg('noshade', null));
		for (let s of this.shades)
			args.push(new ResArg(s, null));
		if (this.size == 'inf')
			args.push(new ResArg('size', 'inf'));
		else if (this.size != null)
			args.push(new ResArg('size', this.size));
		return args;
	}
}

class ResNamedglyph extends ResPart {
	constructor(name, argList, notes, sw) {
		super();
		this.name = name;
		this.mirror = null;
		this.rotate = 0;
		this.scale = 1;
		this.xscale = 1;
		this.yscale = 1;
		this.color = null;
		this.shade = null;
		this.shades = [];
		for (let arg of argList) {
			if (arg.is('mirror'))
				this.mirror = true;
			else if (arg.is('nomirror'))
				this.mirror = false;
			else if (arg.isNat('rotate'))
				this.rotate = arg.rhs % 360;
			else if (arg.isRealNonZero('scale'))
				this.scale = arg.rhs;
			else if (arg.isRealNonZero('xscale'))
				this.xscale = arg.rhs;
			else if (arg.isRealNonZero('yscale'))
				this.yscale = arg.rhs;
			else if (arg.isColor())
				this.color = arg.lhs;
			else if (arg.is('shade'))
				this.shade = true;
			else if (arg.is('noshade'))
				this.shade = false;
			else if (arg.isPattern())
				this.shades.push(arg.lhs);
			else
				arg.error('Namedglyph');
		}
		this.notes = notes;
		this.sw = sw;
	}
	toString() {
		var args = [];
		if (this.mirror == true)
			args.push('mirror');
		else if (this.mirror == false)
			args.push('nomirror');
		if (this.rotate != 0)
			args.push('rotate=' + this.rotate);
		if (this.scale != 1)
			args.push('scale=' + ResArg.realStr(this.scale));
		if (this.xscale != 1)
			args.push('xscale=' + ResArg.realStr(this.xscale));
		if (this.yscale != 1)
			args.push('yscale=' + ResArg.realStr(this.yscale));
		if (this.color != null)
			args.push(this.color);
		if (this.shade == true)
			args.push('shade');
		else if (this.shade == false)
			args.push('noshade');
		for (var i = 0; i < this.shades.length; i++)
			args.push(this.shades[i]);
		var s = this.name + ResArg.argsStr(args);
		for (var i = 0; i < this.notes.length; i++)
				s += this.notes[i].toString();
		s += this.sw.toString();
		return s;
	}
	propagate(globals) {
		super.propagate(globals);
		for (let i = 0; i < this.notes.length; i++)
			globals = this.notes[i].propagate(globals);
		return this.sw.update(globals);
	}
	mirrored() {
		return this.mirror != null ? this.mirror : this.globals.mirror;
	}
	vs() {
		const rounded = Math.round(this.rotate % 360 / 45) * 45;
		if (this.mirrored())
			return Group.rotateToNum(360 - rounded);
		else
			return Group.rotateToNum(rounded);
	}
	isRed() {
		return this.color != null ? this.color == 'red' : this.globals.color == 'red';
	}
	nColor() {
		return this.isRed() ? { black: 0, red: 1 } : { black: 1, red: 0 };
	}
	toUnicode() {
		var warnings = [];
		if (this.notes.length > 0)
			warnings.push('Cannot translate notes')
		if (this.name == 'open')
			this.name = 'V11a';
		if (this.name == 'close')
			this.name = 'V11b';
		if (this.name in uniOpens) {
			if (this.mirrored() || this.vs())
				warnings.push('Cannot mirror or rotate singletons')
			return { group: new Singleton(String.fromCodePoint(uniOpens[this.name]), this.shading()),
						warnings };
		}
		if (this.name in uniCloses) {
			if (this.mirrored() || this.vs())
				warnings.push('Cannot mirror or rotate singletons')
			return { group: new Singleton(String.fromCodePoint(uniCloses[this.name]), this.shading()),
						warnings };
		}
		if (this.name[0] == '"') {
			if (this.mirrored() || this.vs() || this.shading())
				warnings.push('Cannot mirror or rotate or shade brackets');
			const ch = this.name[1];
			switch (ch) {
				case '[':
				case '(':
				case '{':
					return { group: new BracketOpen(ch), warnings };
				case '<':
					return { group: new BracketOpen('\u2329'), warnings };
				case ']':
				case ')':
				case '}':
					return { group: new BracketClose(ch), warnings };
				case '>':
					return { group: new BracketClose('\u232A'), warnings };
				default: {
					warnings.push('Cannot translate short string: ' + ch);
					return { group: null, warnings };
				}
			}
		}
		const ch = ResNamedglyph.nameToChar(this.name);
		if (ch == Shapes.PLACEHOLDER)
			warnings.push('Cannot translate named glyph: ' + this.name);
		return { group: new Literal(ch, this.vs(), this.mirrored(), this.shading()), warnings };
	}
	static nameToChar(name) {
		if (name in uniMnemonics)
			name = uniMnemonics[name];
		if (name in uniGlyphs)
			return String.fromCodePoint(uniGlyphs[name]);
		else
			return Shapes.PLACEHOLDER;
	}
}

class ResEmptyglyph extends ResPart {
	constructor(argList, note, sw) {
		super();
		this.width = 1;
		this.height = 1;
		this.shade = null;
		this.shades = [];
		this.firm = false;
		for (let arg of argList) {
			if (arg.isReal('width'))
				this.width = arg.rhs;
			else if (arg.isReal('height'))
				this.height = arg.rhs;
			else if (arg.is('shade'))
				this.shade = true;
			else if (arg.is('noshade'))
				this.shade = false;
			else if (arg.isPattern())
				this.shades.push(arg.lhs);
			else if (arg.is('firm'))
				this.firm = true;
			else
				arg.error('Emptyglyph');
		}
		this.note = note;
		this.sw = sw;
	}
	static pointArgs() {
		return [new ResArg('width', 0), new ResArg('height', 0)];
	}
	toString() {
		var args = [];
		var noPointArgs = false;
		if (this.width != 1)
			args.push('width=' + ResArg.realStr(this.width));
		if (this.height != 1)
			args.push('height=' + ResArg.realStr(this.height));
		if (this.shade == true) {
			args.push('shade');
			noPointArgs = true;
		} else if (this.shade == false) {
			args.push('noshade');
			noPointArgs = true;
		}
		for (var i = 0; i < this.shades.length; i++) {
			args.push(this.shades[i]);
			noPointArgs = true;
		}
		if (this.firm) {
			args.push('firm');
			noPointArgs = true;
		}
		var s;
		if (this.width == 0 && this.height == 0 && !noPointArgs)
			s = '.';
		else
			s = 'empty' + ResArg.argsStr(args);
		if (this.note != null)
			s += this.note.toString();
		s += this.sw.toString();
		return s;
	}
	propagate(globals) {
		super.propagate(globals);
		if (this.note != null)
			globals = this.note.propagate(globals);
		return this.sw.update(globals);
	}
	toUnicode() {
		var warnings = [];
		if (this.note)
			warnings.push('Cannot translate note')
		if (this.width == 0 || this.height == 0)
			return { group: null, warnings };
		if (this.shading()) {
			const width = this.width <= 0.5 ? 0.5 : 1;
			const height = this.height <= 0.5 ? 0.5 : 1;
			return { group: new Lost(width, height, true), warnings };
		}
		const size = this.width <= 0.5 && this.height <= 0.5 ? 0.5 : 1;
		return { group: new Blank(size), warnings };
	}
}

class ResBox extends ResPart {
	constructor(name, argList, sw1, hiero, notes, sw2) {
		super();
		this.name = name;
		this.dir = null;
		this.mirror = null;
		this.scale = 1;
		this.color = null;
		this.shade = null;
		this.shades = [];
		this.size = 1;
		this.opensep = null;
		this.closesep = null;
		this.undersep = null;
		this.oversep = null;
		for (let arg of argList) {
			if (arg.is('h') || arg.is('v'))
				this.dir = arg.lhs;
			else if (arg.is('mirror'))
				this.mirror = true;
			else if (arg.is('nomirror'))
				this.mirror = false;
			else if (arg.isRealNonZero('scale'))
				this.scale = arg.rhs;
			else if (arg.isColor())
				this.color = arg.lhs;
			else if (arg.is('shade'))
				this.shade = true;
			else if (arg.is('noshade'))
				this.shade = false;
			else if (arg.isPattern())
				this.shades.push(arg.lhs);
			else if (arg.isRealNonZero('size'))
				this.size = arg.rhs;
			else if (arg.isReal('opensep'))
				this.opensep = arg.rhs;
			else if (arg.isReal('closesep'))
				this.closesep = arg.rhs;
			else if (arg.isReal('undersep'))
				this.undersep = arg.rhs;
			else if (arg.isReal('oversep'))
				this.oversep = arg.rhs;
			else
				arg.error('Box');
		}
		this.sw1 = sw1;
		this.hiero = hiero;
		this.notes = notes;
		this.sw2 = sw2;
	}
	toString() {
		var args = [];
		if (this.direction == 'h' || this.direction == 'v')
			args.push(this.direction);
		if (this.mirror == true)
			args.push('mirror');
		else if (this.mirror == false)
			args.push('nomirror');
		if (this.scale != 1)
			args.push('scale=' + ResArg.realStr(this.scale));
		if (this.color != null)
			args.push(this.color);
		if (this.shade == true)
			args.push('shade');
		else if (this.shade == false)
			args.push('noshade');
		for (var i = 0; i < this.shades.length; i++)
			args.push(this.shades[i]);
		if (this.size != 1)
			args.push('size=' + ResArg.realStr(this.size));
		if (this.opensep != null)
			args.push('opensep=' + ResArg.realStr(this.opensep));
		if (this.closesep != null)
			args.push('closesep=' + ResArg.realStr(this.closesep));
		if (this.undersep != null)
			args.push('undersep=' + ResArg.realStr(this.undersep));
		if (this.oversep != null)
			args.push('oversep=' + ResArg.realStr(this.oversep));
		var s = this.name + ResArg.argsStr(args) +
			'(' + this.sw1.toString() +
			(this.hiero == null ? '' : this.hiero.toString()) +
			')';
		for (var i = 0; i < this.notes.length; i++)
			s += this.notes[i].toString();
		s += this.sw2.toString();
		return s;
	}
	propagate(globals) {
		super.propagate(globals);
		globals = this.sw1.update(globals);
		if (this.hiero != null) {
			var savedSize = globals.size;
			globals = globals.update(this.size);
			globals = this.hiero.propagate(globals);
			globals = globals.update(savedSize);
		}
		for (let i = 0; i < this.notes.length; i++)
			globals = this.notes[i].propagate(globals);
		return this.sw2.update(globals);
	}
	mirrored() {
		return this.mirror != null ? this.mirror : this.globals.mirror;
	}
	nColor() {
		return this.hiero != null ? this.hiero.nColor() : super.nColor();
	}
	toUnicode() {
		var groups = [];
		var warnings = [];
		if (this.hiero) {
			const converted = this.hiero.toUnicode(true);
			groups = converted.groups;
			warnings = converted.warnings;
		}
		if (this.notes.length > 0)
			warnings.push('Cannot translate notes')
		var type = 'plain';
		var delimOpen = '\u{13379}';
		var delimClose = '\u{1337A}';
		switch (this.name) {
			case 'cartouche':
				if (this.mirrored()) {
					delimOpen = '\u{1342F}';
					delimClose = '\u{1337B}';
				}
				break;
			case 'oval':
					delimClose = '\u{1337B}';
				break;
			case 'serekh':
				if (this.mirrored())
					warnings.push('Cannot mirror serekh');
				delimOpen = '\u{13258}';
				delimClose = '\u{13282}';
				break;
			case 'inb':
				type = 'walled';
				delimOpen = '\u{13288}';
				delimClose = '\u{13289}';
				break;
			case 'rectangle':
				delimOpen = '\u{13258}';
				delimClose = '\u{1325D}';
				break;
			case 'Hwtopenover':
				if (this.mirrored()) {
					delimOpen = '\u{13258}';
					delimClose = '\u{1325B}';
				} else {
					delimOpen = '\u{1325A}';
					delimClose = '\u{1325D}';
				}
				break;
			case 'Hwtopenunder':
				if (this.mirrored()) {
					delimOpen = '\u{13258}';
					delimClose = '\u{1325C}';
				} else {
					delimOpen = '\u{13259}';
					delimClose = '\u{1325D}';
				}
				break;
			case 'Hwtcloseover':
				if (this.mirrored()) {
					delimOpen = '\u{1325A}';
					delimClose = '\u{1325D}';
				} else {
					delimOpen = '\u{13258}';
					delimClose = '\u{1325B}';
				}
				break;
			case 'Hwtcloseunder':
				if (this.mirrored()) {
					delimOpen = '\u{13259}';
					delimClose = '\u{1325D}';
				} else {
					delimOpen = '\u{13258}';
					delimClose = '\u{1325C}';
				}
				break;
		}
		const corners = this.shadingCorners();
		const shadeOpenCorners = { ts: corners.ts, bs: corners.bs, te: corners.ts, be: corners.bs };
		const shadeCloseCorners = { ts: corners.te, bs: corners.be, te: corners.te, be: corners.be };
		const shadeOpen = ResPart.cornersToShading(shadeOpenCorners);
		const shadeClose = ResPart.cornersToShading(shadeCloseCorners);
		return { group: new Enclosure(type, groups, delimOpen, shadeOpen, delimClose, shadeClose),
					warnings };
	}
}

class ResStack extends ResPart {
	constructor(argList, sw1, group1, sw2, group2, sw3) {
		super();
		this.x = 0.5;
		this.y = 0.5;
		this.onunder = null;
		for (let arg of argList) {
			if (arg.isRealLow('x'))
				this.x = arg.rhs;
			else if (arg.isRealLow('y'))
				this.y = arg.rhs;
			else if (arg.is('on') || arg.is('under'))
				this.onunder = arg.lhs;
			else
				arg.error('Stack');
		}
		this.sw1 = sw1;
		this.group1 = group1;
		this.sw2 = sw2;
		this.group2 = group2;
		this.sw3 = sw3;
	}
	toString() {
		var args = [];
		if (this.x != 0.5)
			args.push('x=' + ResArg.realStr(this.x));
		if (this.y != 0.5)
			args.push('y=' + ResArg.realStr(this.y));
		if (this.onunder != null)
			args.push(this.onunder);
		return 'stack' + ResArg.argsStr(args) + '(' + this.sw1.toString() +
				this.group1.toString() + ',' + this.sw2.toString() +
				this.group2.toString() + ')' + this.sw3.toString();
	}
	propagate(globals) {
		super.propagate(globals);
		globals = this.sw1.update(globals);
		globals = this.group1.propagate(globals);
		globals = this.sw2.update(globals);
		globals = this.group2.propagate(globals);
		return this.sw3.update(globals);
	}
	nColor() {
		const color1 = this.group1.nColor();
		const color2 = this.group2.nColor();
		return { black: color1.black + color2.black, red: color1.red + color2.red };
	}
	toUnicode() {
		const converted1 = this.group1.toUnicode();
		const converted2 = this.group2.toUnicode();
		const group1 = converted1.group;
		const group2 = converted2.group;
		var warnings = converted1.warnings.concat(converted2.warnings);
		if (group1 == null)
			return { group: group2, warnings };
		if (group2 == null)
			return { group: group1, warnings };
		if (ResStack.isFlatHorizontal(group1) && ResStack.isFlatVertical(group2)) {
			const lits1 = group1 instanceof Literal ? [group1] : group1.groups;
			const lits2 = group2 instanceof Literal ? [group2] : group2.groups;
			return { group: new Overlay(lits1, lits2), warnings };
		} else if (ResStack.isFlatVertical(group1) && ResStack.isFlatHorizontal(group2)) {
			const lits2 = group1 instanceof Literal ? [group1] : group1.groups;
			const lits1 = group2 instanceof Literal ? [group2] : group2.groups;
			return { group: new Overlay(lits1, lits2), warnings };
		} else {
			warnings.push('Cannot translate stack');
			return { group: null, warnings };
		}
	}
	static isFlatHorizontal(group) {
		if (group instanceof Literal)
			return true;
		else if (group instanceof Horizontal)
			return group.groups.every(g => g instanceof Literal);
		else
			return false;
	}
	static isFlatVertical(group) {
		if (group instanceof Literal)
			return true;
		else if (group instanceof Vertical)
			return group.groups.every(g => g instanceof Literal);
		else
			return false;
	}
}

class ResInsert extends ResPart {
	constructor(argList, sw1, group1, sw2, group2, sw3) {
		super();
		this.place = '';
		this.x = 0.5;
		this.y = 0.5;
		this.fix = false;
		this.sep = null;
		for (let arg of argList) {
			if (arg.isPlace())
				this.place = arg.lhs;
			else if (arg.isRealLow('x'))
				this.x = arg.rhs;
			else if (arg.isRealLow('y'))
				this.y = arg.rhs;
			else if (arg.is('fix'))
				this.fix = true;
			else if (arg.isReal('sep'))
				this.sep = arg.rhs;
			else
				arg.error('Insert');
		}
		this.sw1 = sw1;
		this.group1 = group1;
		this.sw2 = sw2;
		this.group2 = group2;
		this.sw3 = sw3;
	}
	toString() {
		var args = [];
		if (this.place != '')
			args.push(this.place);
		if (this.x != 0.5)
			args.push('x=' + ResArg.realStr(this.x));
		if (this.y != 0.5)
			args.push('y=' + ResArg.realStr(this.y));
		if (this.fix)
			args.push('fix');
		if (this.sep != null)
			args.push('sep=' + ResArg.realStr(this.sep));
		return 'insert' + ResArg.argsStr(args) + '(' + this.sw1.toString() +
				this.group1.toString() + ',' + this.sw2.toString() +
				this.group2.toString() + ')' + this.sw3.toString();
	}
	propagate(globals) {
		super.propagate(globals);
		globals = this.sw1.update(globals);
		globals = this.group1.propagate(globals);
		globals = this.sw2.update(globals);
		globals = this.group2.propagate(globals);
		return this.sw3.update(globals);
	}
	nColor() {
		const color1 = this.group1.nColor();
		const color2 = this.group2.nColor();
		return { black: color1.black + color2.black, red: color1.red + color2.red };
	}
	position() {
		if (['ts','bs','s'].includes(this.place))
			var x = 0;
		else if (['te','be','e'].includes(this.place))
			var x = 1;
		else
			var x = this.x;
		if (['ts','te','t'].includes(this.place))
			var y = 0;
		else if (['bs','be','b'].includes(this.place))
			var y = 1;
		else
			var y = this.y;
		return { x, y };
	}
	toUnicode() {
		const converted1 = this.group1.toUnicode();
		const converted2 = this.group2.toUnicode();
		const group1 = converted1.group;
		const group2 = converted2.group;
		var warnings = converted1.warnings.concat(converted2.warnings);
		if (group1 == null)
			return { group: group2, warnings };
		if (group2 == null)
			return { group: group1, warnings };
		if (!ResInsert.isInsert(group2)) {
			warnings.push('Cannot insert group of type: ' + group2.constructor.name);
			return { group: group1, warnings };
		}
		const places = ResInsert.allowedPlaces(group1);
		const pos = this.position();
		const place = ResInsert.closestPlace(pos, places, group1);
		if (place == null) {
			warnings.push('Cannot translate insertion');
			return { group: null, warnings };
		}
		if (group1 instanceof Literal || group1 instanceof Overlay) {
			var insertions = { };
			insertions[place] = group2;
			return { group: new Basic(group1, insertions), warnings };
		} else {
			group1[place] = group2;
			return { group: group1, warnings };
		}
	}
	static isInsert(group) {
		switch (group.constructor) {
			case Vertical:
			case Horizontal:
			case Enclosure:
			case Basic:
			case Overlay:
			case Literal:
			case Blank:
			case Lost:
				return true;
			default:
				return false;
		}
	}
	static allowedPlaces(group) {
		if (group instanceof Literal) {
			return Array.from(Shapes.allowedPlaces(group.ch, 0, group.mirror));
		} else if (group instanceof Overlay) {
			return ['ts', 'bs', 'te', 'be'];
		} else if (group instanceof Basic) {
			var places = ResInsert.allowedPlaces(group.core);
			Group.INSERTION_PLACES.forEach(p => {
				if (group[p])
					places = places.filter(place => place != p);
			});
			return places;
		} else {
			return [];
		}
	}
	static closestPlace(pos, places, group) {
		if (places.length == 0)
			return null;
		var bestPlace = places[0];
		var bestDist = ResInsert.distance(pos, ResInsert.groupPos(group, bestPlace));
		for (let i = 1; i < places.length; i++) {
			const otherPlace = places[i];
			const otherDist = ResInsert.distance(pos, ResInsert.groupPos(group, otherPlace));
			if (otherDist < bestDist) {
				bestPlace = otherPlace;
				bestDist = otherDist;
			}
		}
		return bestPlace;
	}
	static groupPos(group, place) {
		if (group instanceof Basic)
			return ResInsert.groupPos(group.core, place);
		var adjustments = { };
		if (group instanceof Literal) {
			for (const alt of Shapes.insertions[group.ch]) {
				if (place in alt) {
					adjustments = alt;
					break;
				}
			}
			if (group.mirror)
				adjustments = Shapes.mirrorAdjustments(adjustments);
		}
		return Shapes.insertionPosition(place, adjustments);
	}
	static distance(pos1, pos2) {
		return (pos1.x-pos2.x)*(pos1.x-pos2.x) + (pos1.y-pos2.y)*(pos1.y-pos2.y);
	}
}

class ResModify extends ResPart {
	constructor(argList, sw1, group, sw2) {
		super();
		this.width = null;
		this.height = null;
		this.above = 0;
		this.below = 0;
		this.before = 0;
		this.after = 0;
		this.omit = false;
		this.shade = null;
		this.shades = [];
		for (let arg of argList) {
			if (arg.isRealNonZero('width'))
				this.width = arg.rhs;
			else if (arg.isRealNonZero('height'))
				this.height = arg.rhs;
			else if (arg.isReal('above'))
				this.above = arg.rhs;
			else if (arg.isReal('below'))
				this.below = arg.rhs;
			else if (arg.isReal('before'))
				this.before = arg.rhs;
			else if (arg.isReal('after'))
				this.after = arg.rhs;
			else if (arg.is('omit'))
				this.omit = true;
			else if (arg.is('shade'))
				this.shade = true;
			else if (arg.is('noshade'))
				this.shade = false;
			else if (arg.isPattern())
				this.shades.push(arg.lhs);
			else
				arg.error('Modify');
		}
		this.sw1 = sw1;
		this.group = group;
		this.sw2 = sw2;
	}
	toString() {
		var args = [];
		if (this.width != null)
			args.push('width=' + ResArg.realStr(this.width));
		if (this.height != null)
			args.push('height=' + ResArg.realStr(this.height));
		if (this.above != 0)
			args.push('above=' + ResArg.realStr(this.above));
		if (this.below != 0)
			args.push('below=' + ResArg.realStr(this.below));
		if (this.before != 0)
			args.push('before=' + ResArg.realStr(this.before));
		if (this.after != 0)
			args.push('after=' + ResArg.realStr(this.after));
		if (this.omit)
			args.push('omit');
		if (this.shade == true)
			args.push('shade');
		else if (this.shade == false)
			args.push('noshade');
		for (var i = 0; i < this.shades.length; i++)
			args.push(this.shades[i]);
		return 'modify' + ResArg.argsStr(args) + '(' + this.sw1.toString() +
				this.group.toString() + ')' + this.sw2.toString();
	}
	propagate(globals) {
		super.propagate(globals);
		globals = this.sw1.update(globals);
		globals = this.group.propagate(globals);
		return this.sw2.update(globals);
	}
	nColor() {
		return this.group.nColor();
	}
	toUnicode() {
		return this.group.toUnicode();
	}
}

class ResNote extends ResPart {
	constructor(str, argList) {
		super();
		this.color = null;
		for (let arg of argList) {
			if (arg.isColor())
				this.color = arg.lhs;
			else
				arg.error('Note');
		}
		this.str = str;
	}
	toString() {
		var args = [];
		if (this.color != null)
			args.push(this.color);
		return '^' + this.str + ResArg.argsStr(args);
	}
	propagate(globals) {
		super.propagate(globals);
		return globals;
	}
	toGroup() {
		return null;
	}
}

class ResSwitch {
	constructor(argList) {
		for (let prop of ResSwitch.properties)
			this[prop] = null;
		for (let arg of argList) {
			if (arg.isColor())
				this.color = arg.lhs;
			else if (arg.is('shade'))
				this.shade = true;
			else if (arg.is('noshade'))
				this.shade = false;
			else if (arg.isReal('sep'))
				this.sep = arg.rhs;
			else if (arg.is('fit'))
				this.fit = true;
			else if (arg.is('nofit'))
				this.fit = false;
			else if (arg.is('mirror'))
				this.mirror = true;
			else if (arg.is('nomirror'))
				this.mirror = false;
			else
				arg.error('Switch');
		}
	}
	toString() {
		var args = [];
		if (this.color != null)
			args.push(this.color);
		if (this.shade == true)
			args.push('shade');
		else if (this.shade == false)
			args.push('noshade');
		if (this.sep != null)
			args.push('sep=' + ResArg.realStr(this.sep));
		if (this.fit == true)
			args.push('fit');
		else if (this.fit == false)
			args.push('nofit');
		if (this.mirror == true)
			args.push('mirror');
		else if (this.mirror == false)
			args.push('nomirror');
		if (args.length > 0)
			return '!' + ResArg.argsStr(args);
		else
			return '';
	}
	isEmpty() {
		for (let prop of ResSwitch.properties)
			if (this[prop] != null)
				return false;
		return true;
	}
	join(sw) {
		var copy = new ResSwitch([]);
		for (let prop of ResSwitch.properties)
			copy[prop] = sw[prop] != null ? sw[prop] : this[prop];
		return copy;
	}
	update(globals) {
		if (this.isEmpty())
			return globals;
		var copy = globals.clone();
		for (let prop of ResSwitch.properties)
			if (this[prop] != null)
				copy[prop] = this[prop];
		return copy;
	}
	toArgs() {
		var args = [];
		if (this.color != null)
			args.push(new ResArg(this.color, null));
		if (this.shade == true)
			args.push(new ResArg('shade', null));
		else if (this.shade == false)
			args.push(new ResArg('noshade', null));
		if (this.sep != null)
			args.push(new ResArg('sep', this.sep));
		if (this.fit == true)
			args.push(new ResArg('fit', null));
		else if (this.fit == false)
			args.push(new ResArg('nofit', null));
		if (this.mirror == true)
			args.push(new ResArg('mirror', null));
		else if (this.mirror == false)
			args.push(new ResArg('nomirror', null));
		return args;
	}
}
ResSwitch.properties = ['color', 'shade', 'sep', 'fit', 'mirror'];

class ResArg {
	constructor(lhs, rhs) {
		this.lhs = lhs;
		this.rhs = rhs;
	}
	is(lhs) {
		return this.lhs == lhs && this.rhs == null;
	}
	isDir() {
		return ResArg.dirs.includes(this.lhs) && this.rhs == null;
	}
	isColor() {
		return ResArg.colors.includes(this.lhs) && this.rhs == null;
	}
	isPlace() {
		return ResArg.places.includes(this.lhs) && this.rhs == null;
	}
	isPattern() {
		return this.lhs.match(/^[tbse]+$/) && this.rhs == null;
	}
	isReal(lhs) {
		return this.lhs == lhs && typeof this.rhs == 'number';
	}
	isRealNonZero(lhs) {
		return this.isReal(lhs) && this.rhs > 0;
	}
	isRealLow(lhs) {
		return this.isReal(lhs) && this.rhs <= 1;
	}
	isNat(lhs) {
		return this.isReal(lhs) && this.rhs % 1 == 0;
	}
	isSizeUnit() {
		return this.isRealNonZero('size') || this.lhs == 'size' && this.rhs == 'inf';
	}
	error(element) {
		console.error('wrong argument', element, this.lhs, this.rhs);
	}
	static argsStr(args) {
		if (args.length == 0) {
			return '';
		} else {
			var s = '[' + args[0];
			for (let i = 1; i < args.length; i++)
				s += ',' + args[i];
			s += ']';
			return s;
		}
	}
	static realStr(val) {
		val -= Math.floor(val / 10) * 10;
		val = Math.floor(val * 100.0);
		var hundreds = Math.floor(val / 100);
		val -= hundreds * 100;
		var tens = Math.floor(val / 10);
		val -= tens * 10;
		var s = hundreds > 0 ? ('' + hundreds) : '0';
		if (tens > 0 || val > 0) {
			s += '.' + tens;
			if (val > 0)
				s += val;
		}
		return s;
	}
}
ResArg.dirs = ['hlr', 'hrl', 'vlr', 'vrl'];
ResArg.colors = ['black', 'red', 'green', 'blue',
	'white', 'aqua', 'fuchsia', 'gray',
	'lime', 'maroon', 'navy', 'olive',
	'purple', 'silver', 'teal', 'yellow'];
ResArg.places = ['t', 'b', 's', 'e', 'ts', 'te', 'bs', 'be'];
