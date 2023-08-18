const uniHiero = new UniHiero();

class EditHistory {
	constructor() {
		this.states = [];
		this.size = 0;
		this.setButtons();
	}
	remember() {
		const string = tree.toString();
		if (!string)
			return;
		const address = tree.getFocusAddress();
		this.states = this.states.slice(0, this.size);
		this.states.push({ string, address });
		this.size++;
		this.setButtons();
	}
	undo() {
		if (this.size > 0) {
			if (this.size == this.states.length) {
				const string = tree.toString();
				const address = tree.getFocusAddress();
				this.states.push({ string, address });
			}
			const prev = this.states[--this.size];
			Edit.make(prev.string, prev.address);
			this.setButtons();
		}
	}
	redo() {
		if (this.size < this.states.length - 1) {
			const next = this.states[++this.size];
			Edit.make(next.string, next.address);
			this.setButtons();
		}
	}
	setButtons() {
		$('undo').disabled = this.size <= 0;
		$('redo').disabled = this.size >= this.states.length - 1;
	}
}
var editHistory = null;

class Preview {
	dir;
	groups;
	constructor() {
		this.dir = 'hlr';
		this.groups = [];
	}
	setDir(dir) {
		if (dir == this.dir)
			return;
		for (let b of ['hlr', 'hrl', 'vlr', 'vrl']) {
			if (b == dir)
				$(b).className = 'button-selected';
			else
				$(b).className = 'button-unselected';
		}
		this.dir = dir;
		$('header-panel').className = dir;
		$('dir-panel').className = dir;
		$('preview-panel').className = dir;
		$('tree-panel').className = dir;
		Edit.remake();
	}
	rl() {
		return ['hrl', 'vrl'].includes(this.dir);
	}
	mirror() {
		return this.dir == 'hrl';
	}
	updateAll() {
		this.groups = tree.groupNodes().map(node => this.createGroup(node.group.toString()));
		removeChildren($('preview-panel'));
		if (this.mirror())
			this.groups.slice().reverse().forEach(g => $('preview-panel').appendChild(g.elem));
		else
			this.groups.forEach(g => $('preview-panel').appendChild(g.elem));
		this.updateFocus();
	}
	update() {
		const treeStr = tree.groupNodes().map(node => node.group.toString());
		const previewStr = this.groups.map(g => g.str);
		var nPre;
		for (nPre = 0; nPre < treeStr.length && nPre < previewStr.length; nPre++)
			if (treeStr[nPre] != previewStr[nPre])
				break;
		var nSuf, i, j;
		for (nSuf = 0, i = treeStr.length-1, j = previewStr.length-1; i > nPre, j > nPre; nSuf++, i--, j--)
			if (treeStr[i] != previewStr[j])
				break;
		const prev = nPre > 0 ? this.groups[nPre-1].elem : null;
		const next = nSuf > 0 ? this.groups[this.groups.length - nSuf].elem : null;
		for (let i = nPre; i < this.groups.length - nSuf; i++)
			this.groups[i].elem.remove();
		const newStr = treeStr.slice(nPre, treeStr.length - nSuf);
		const groupsNew = newStr.map(this.createGroup);
		this.groups.splice(nPre, this.groups.length - nPre - nSuf, ...groupsNew);
		if (this.mirror())
			for (let i = groupsNew.length-1; i >= 0; i--)
				$('preview-panel').insertBefore(groupsNew[i].elem, prev);
		else
			for (let i = 0; i < groupsNew.length; i++)
				$('preview-panel').insertBefore(groupsNew[i].elem, next);
		this.updateFocus();
		Edit.makeInput();
	}
	updateFocus() {
		const index = tree.getFocusIndex();
		if (index < 0)
			this.setFocusIndex(-1);
		else if (index % 2 == 0)
			this.setFocusIndex(Math.round(index / 2));
		else
			this.setFocusSeparator(Math.floor(index / 2));
	}
	createGroup(str) {
		const elem = document.createElement('span');
		elem.className = 'hierojax preview-group';
		elem.setAttribute('data-fontsize', $('preview-size').value);
		elem.setAttribute('data-bracketcolor', 'red');
		elem.setAttribute('data-dir', preview.dir);
		elem.innerHTML = str;
		const group = { elem, str };
		elem.addEventListener('click', function() { preview.handleClick(group); });
		hierojax.processFragment(elem);
		return group;
	}
	setFocusIndex(i) {
		for (let j = 0; j < this.groups.length; j++) {
			const elem = this.groups[j].elem;
			elem.classList.remove('preview-prefocus');
			elem.classList.remove('preview-postfocus');
			if (j == i) {
				elem.classList.add('preview-focus');
				elem.classList.remove('preview-group');
				elem.scrollIntoView();
			} else {
				elem.classList.remove('preview-focus');
				elem.classList.add('preview-group');
			}
		}
	}
	setFocusSeparator(i) {
		for (let j = 0; j < this.groups.length; j++) {
			const elem = this.groups[j].elem;
			elem.classList.remove('preview-focus');
			if (j == i) {
				elem.classList.add('preview-prefocus');
				elem.classList.remove('preview-group');
				elem.classList.remove('preview-postfocus');
			} else if (j == i+1) {
				elem.classList.add('preview-postfocus');
				elem.classList.remove('preview-group');
				elem.classList.remove('preview-prefocus');
				elem.scrollIntoView();
			} else {
				elem.classList.remove('preview-prefocus');
				elem.classList.remove('preview-postfocus');
				elem.classList.add('preview-group');
			}
		}
	}
	handleClick(group) {
		const i = this.groups.indexOf(group);
		tree.setFocusIndex(2 * i);
	}
}
var preview = null;

class Tree {
	nodes;
	focus;
	constructor() {
		this.nodes = [];
		this.focus = null;
	}
	create(fragment) {
		this.focus = null;
		const ul = $('tree-elems');
		removeChildren(ul);
		this.nodes = [];
		for (let i = 0; i < fragment.groups.length; i++) {
			if (i > 0)
				this.nodes.push(new FragmentOpNode(null));
			this.nodes.push(Node.make(null, fragment.groups[i]));
		}
		const mirroredNodes = preview.rl() ? this.nodes.slice().reverse() : this.nodes;
		mirroredNodes.forEach(n => ul.appendChild(n.li));
	}
	recreate(i) {
		const node = Node.make(null, this.nodes[i].group);
		$('tree-elems').replaceChild(node.li, this.nodes[i].li);
		this.nodes[i] = node;
	}
	toString() {
		return this.nodes.map(n => n.toString()).join('');
	}
	groupNodes() {
		var nodes = [];
		for (let i = 0; i < tree.nodes.length; i += 2)
			nodes.push(tree.nodes[i]);
		return nodes;
	}
	setFocusNode(node) {
		if (node == this.focus)
			return;
		if (this.focus)
			this.focus.a.classList.remove('focus');
		if (!node) {
			this.focus = null;
			return;
		}
		node.a.classList.add('focus');
		this.focus = node;
		node.li.scrollIntoView();
		node.setEditing();
		preview.updateFocus();
	}
	setFocusIndex(i) {
		if (0 <= i && i < this.nodes.length)
			this.setFocusNode(this.nodes[i]);
	}
	setFocusAddress(address) {
		if (address.length > 0 && this.nodes.length <= address[0])
			address = [this.nodes.length-1];
		if (address.length == 0 || address[0] < 0) {
			this.setFocusNode(null);
			Edit.setEditing('');
			return;
		}
		var node = this.nodes[address[0]];
		for (let i = 1; i < address.length; i++) {
			const children = node.children();
			const j = address[i];
			if (0 <= j && j < children.length) {
				node = children[j];
			} else if (children.length > 0) {
				node = children[children.length-1];
				break;
			} else {
				break;
			}
		}
		this.setFocusNode(node);
	}
	setPlaceholderAddress() {
		const address = this.getPlaceholderAddress();
		if (address)
			this.setFocusAddress(address);
	}
	getFocusAddress() {
		return this.focus ? this.focus.address() : [];
	}
	getFocusIndex() {
		return this.focus ? this.focus.root().childNumber() : -1;
	}
	getPlaceholderAddress() {
		for (let i = 0; i < this.nodes.length; i++) {
			const addr = this.nodes[i].getPlaceholderAddress();
			if (addr)
				return [i].concat(addr);
		}
		return null;
	}
	moveStart() {
		if (this.nodes.length > 0)
			this.setFocusNode(this.nodes[0]);
	}
	moveEnd() {
		if (this.nodes.length > 0)
			this.setFocusNode(this.nodes[this.nodes.length-1]);
	}
	moveUp() {
		if (this.focus != null && this.focus.parent != null)
			this.setFocusNode(this.focus.parent);
	}
	moveDown() {
		if (this.focus != null && this.focus.children().length > 0)
			this.setFocusNode(this.focus.children()[0]);
	}
	moveLeft() {
		if (!this.focus) {
			if (preview.rl())
				this.moveEnd();
			else
				this.moveStart();
		} else {
			const i = this.focus.childNumber();
			if (i >= 0) {
				const siblings = this.focus.siblings();
				const j = preview.rl() ? i+1 : i-1;
				if (0 <= j && j < siblings.length)
					this.setFocusNode(siblings[j]);
			}
		}
	}
	moveRight() {
		if (!this.focus) {
			if (preview.rl())
				this.moveStart();
			else
				this.moveEnd();
		} else {
			const i = this.focus.childNumber();
			if (i >= 0) {
				const siblings = this.focus.siblings();
				const j = preview.rl() ? i-1 : i+1;
				if (0 <= j && j < siblings.length)
					this.setFocusNode(siblings[j]);
			}
		}
	}
	static focus() {
		$('tree-panel').focus();
	}
	insertTop(index, group) {
		const node = Node.make(null, group);
		if (this.nodes.length == 0) {
			this.nodes = [node];
			this.insertElement(index, node);
		} else if (index >= this.nodes.length) {
			const op = new FragmentOpNode(null);
			this.nodes.splice(index, 0, op, node);
			this.insertElement(index, op);
			this.insertElement(index+1, node);
		} else {
			const op = new FragmentOpNode(null);
			this.nodes.splice(index, 0, node, op);
			this.insertElement(index, op);
			this.insertElement(index, node);
		}
		this.setFocusNode(node);
	}
	insertElement(index, elem) {
		const ul = $('tree-elems');
		if (preview.rl()) {
			const indexMirror = ul.children.length - index;
			const next = indexMirror <= 0 ? ul.children[0] : ul.children[indexMirror];
			ul.insertBefore(elem.li, next);
		} else {
			const next = index < ul.children.length ? ul.children[index] : null;
			ul.insertBefore(elem.li, next);
		}
	}
	replaceTop(index, group) {
		const address = [index];
		const old = this.nodes[index];
		const node = Node.make(null, group);
		this.nodes[index] = node;
		$('tree-elems').replaceChild(node.li, old.li);
		this.setFocusAddress(address);
	}
	replaceTopMult(index, groups) {
		const address = [this.getFocusIndex() + Math.max(0, groups.length-1) * 2];
		this.replaceTop(index, groups[groups.length-1]);
		for (let i = groups.length-2; i >= 0; i--)
			this.insertTop(index, groups[i]);
		this.setFocusAddress(address);
	}
	replaceTopOp(index, group) {
		const node = Node.make(null, group);
		const prev = this.nodes[index-1];
		const old = this.nodes[index];
		const next = this.nodes[index+1];
		this.nodes.splice(index-1, 3, node);
		$('tree-elems').removeChild(prev.li);
		$('tree-elems').replaceChild(node.li, old.li);
		$('tree-elems').removeChild(next.li);
		this.setFocusNode(node);
	}
	removeTop(index) {
		const address = this.getFocusAddress();
		var olds = [this.nodes[index]];
		if (index < this.nodes.length-1) {
			olds.push(this.nodes[index+1]);
			this.nodes.splice(index, 2);
		} else if (0 < index) {
			olds.push(this.nodes[index-1]);
			this.nodes.splice(index-1, 2);
		} else {
			this.nodes.splice(index, 1);
		}
		olds.forEach(old => $('tree-elems').removeChild(old.li));
		this.setFocusAddress(address);
	}
}

class Node {
	constructor(type, parent, group) {
		this.type = type;
		this.parent = parent;
		this.group = group;
	}
	static make(parent, group) {
		switch (group.constructor) {
			case Vertical: return new VerticalNode(parent, group);
			case Horizontal: return new HorizontalNode(parent, group);
			case Enclosure: return new EnclosureNode(parent, group);
			case Basic: return new BasicNode(parent, group);
			case Overlay: return new OverlayNode(parent, group);
			case Literal: return new LiteralNode(parent, group);
			case Singleton: return new SingletonNode(parent, group);
			case Blank: return new BlankNode(parent, group);
			case Lost: return new LostNode(parent, group);
			case BracketOpen: return new BracketOpenNode(parent, group);
			case BracketClose: return new BracketCloseNode(parent, group);
			default: console.error('Unknown group', group);
		}
	}
	create() {
		const children = preview.rl() ? this.children().slice().reverse() : this.children();
		this.li = document.createElement('li');
		this.a = document.createElement('a');
		this.div = document.createElement('div');
		this.createLabel(this.div);
		this.a.appendChild(this.div);
		const node = this;
		this.a.addEventListener('click', function() { tree.setFocusNode(node); });
		this.li.appendChild(this.a);
		if (children.length > 0) {
			const ul = document.createElement('ul');
			for (const child of children)
				ul.appendChild(child.li);
			this.li.appendChild(ul);
		}
	}
	recreate() {
		tree.recreate(this.root().childNumber());
	}
	createLabel(div) {
		this.hiero = document.createElement('span');
		this.hiero.className = 'hierojax';
		this.hiero.setAttribute('data-fontsize', $('tree-size').value);
		this.hiero.setAttribute('data-signcolor', 'black');
		this.hiero.setAttribute('data-bracketcolor', 'red');
		this.hiero.setAttribute('data-dir', preview.dir);
		this.hiero.innerHTML = this.toString();
		hierojax.processFragment(this.hiero);
		div.appendChild(this.hiero);
	}
	createControlLabel(div, label) {
		div.className = 'node-control-label';
		this.label = document.createTextNode(label);
		div.appendChild(this.label);
	}
	createSepLabel(div, label) {
		div.className = 'node-label';
		this.label = document.createTextNode(label);
		div.appendChild(this.label);
	}
	toString() {
		return this.group.toString();
	}
	children() {
		return [];
	}
	childNumber() {
		return this.siblings().indexOf(this);
	}
	address() {
		const num = this.childNumber();
		return this.parent ? this.parent.address().concat(num) : [num];
	}
	siblings() {
		if (this.parent)
			return this.parent.children();
		else
			return tree.nodes;
	}
	root() {
		return this.parent ? this.parent.root() : this;
	}
	fragmentRoot() {
		if (this.parent && !(this.parent instanceof EnclosureNode))
			return this.parent.fragmentRoot();
		else
			return this;
	}
	redraw() {
		this.hiero.innerHTML = this.toString();
		hierojax.processFragment(this.hiero);
	}
	redrawToRoot() {
		this.redraw();
		if (this.parent)
			this.parent.redrawToRoot();
	}
	setEditing() {
		Edit.setEditing(this.type);
	}
	nextLiteralNode() {
		const i = this.childNumber();
		const siblings = this.siblings();
		for (let j = i+1; j < siblings.length; j++) {
			const first = siblings[j].firstLiteralNode();
			if (first)
				return first;
		}
		return this.parent ? this.parent.nextLiteralNode() : null;
	}
	firstLiteralNode() {
		for (let node of this.children()) {
			const first = node.firstLiteralNode();
			if (first)
				return first;
		}
		return null;
	}
	getPlaceholderAddress() {
		const children = this.children();
		for (let i = 0; i < children.length; i++) {
			const addr = children[i].getPlaceholderAddress();
			if (addr)
				return [i].concat(addr);
		}
		return null;
	}
	isFlatVertical() {
		return false;
	}
	isFlatHorizontal() {
		return false;
	}
	isCore() {
		return false;
	}
	isInsertion() {
		return false;
	}
	usedAsInsert() {
		return this.parent instanceof BasicNode && this.childNumber() > 0;
	}
	usedAsCore() {
		return this.parent instanceof BasicNode && this.childNumber() == 0;
	}
	acceptsMultipleChildren() {
		return false;
	}
	hasBracketOpen() {
		if (this.parent instanceof HorizontalNode) {
			const i = this.childNumber();
			const siblings = this.siblings();
			return i > 0 && siblings[i-1] instanceof BracketOpenNode;
		} else {
			return false;
		}
	}
	hasBracketClose() {
		if (this.parent instanceof HorizontalNode) {
			const i = this.childNumber();
			const siblings = this.siblings();
			return i < siblings.length-1 && siblings[i+1] instanceof BracketCloseNode;
		} else {
			return false;
		}
	}
	insertSibling(index, group) {
		if (this.parent) {
			const j = Math.round(index / 2);
			this.parent.insertIndex(j, group);
		} else {
			tree.insertTop(index, group);
		}
	}
	replace(group) {
		if (this.parent)
			this.parent.replaceChild(this, group);
		else
			tree.replaceTop(this.childNumber(), group);
	}
	replaceMult(groups) {
		if (this.parent)
			this.parent.replaceChildMult(this, groups);
		else
			tree.replaceTopMult(this.childNumber(), groups);
	}
	replaceOp(group) {
		if (this.parent)
			this.parent.replaceChildOp(this, group);
		else
			tree.replaceTopOp(this.childNumber(), group);
	}
	remove() {
		if (this.parent)
			this.parent.removeChild(this);
		else
			tree.removeTop(this.childNumber());
	}
	static advance(address, diff) {
		if (address.length > 0)
			address[address.length-1] += 2;
		return address;
	}
}

class FragmentOpNode extends Node {
	constructor(parent) {
		super('group boundary', parent, null);
		this.create();
	}
	createLabel(div) {
		this.createSepLabel(div, '-');
	}
	insertOp(group) {
		const index = this.childNumber() + 1;
		this.insertSibling(index, group);
	}
	toString() {
		return '';
	}
	nonSingletonNeighbors() {
		const i = this.childNumber();
		const siblings = this.siblings();
		return !(siblings[i-1] instanceof SingletonNode || siblings[i] instanceof SingletonNode);
	}
}

class VerticalNode extends Node {
	constructor(parent, group) {
		super('vertical', parent, group);
		this.nodes = [Node.make(this, group.groups[0])];
		for (let i = 1; i < group.groups.length; i++) {
			this.nodes.push(new VerticalOpNode(this));
			this.nodes.push(Node.make(this, group.groups[i]));
		}
		this.create();
	}
	children() {
		return this.nodes;
	}
	static initial(groups) {
		const subgroups = groups.map(g => g instanceof Vertical ? g.groups : g).flat();
		return new Vertical(subgroups);
	}
	isFlatVertical() {
		return this.group.groups.map(g => g instanceof Literal).reduce((a,b) => a && b, true);
	}
	isInsertion() {
		return true;
	}
	acceptsMultipleChildren() {
		return true;
	}
	replaceChild(old, group) {
		this.replaceChildMult(old, [group]);
	}
	replaceChildMult(old, groups) {
		const index = this.group.groups.indexOf(old.group);
		const subgroups = groups.map(g => g instanceof Vertical ? g.groups : g).flat();
		const address = this.address().concat((index + subgroups.length - 1) * 2);
		this.group.groups.splice(index, 1, ...subgroups);
		this.recreate();
		tree.setFocusAddress(address);
	}
	replaceChildOp(op, group) {
		const indexOp = op.childNumber();
		const oldPrev = this.nodes[indexOp-1];
		const oldNext = this.nodes[indexOp+1];
		const indexPrev = this.group.groups.indexOf(oldPrev.group);
		const subgroups = group instanceof Vertical ? group.groups : [group];
		this.group.groups.splice(indexPrev, 1, ...subgroups);
		this.removeChild(oldNext);
	}
	removeChild(old) {
		const index = this.group.groups.indexOf(old.group);
		if (this.group.groups.length > 2) {
			const address = this.address().concat(index * 2);
			this.group.groups.splice(index, 1);
			this.recreate();
			tree.setFocusAddress(address);
		} else if (index == 0) {
			this.replace(this.group.groups[1]);
		} else {
			this.replace(this.group.groups[0]);
		}
	}
}

class VerticalOpNode extends Node {
	constructor(parent) {
		super('vertical control', parent, null);
		this.create();
	}
	createLabel(div) {
		this.createControlLabel(div, Group.VER);
	}
}

class HorizontalNode extends Node {
	constructor(parent, group) {
		super('horizontal', parent, group);
		this.nodes = [Node.make(this, group.groups[0])];
		for (let i = 1; i < group.groups.length; i++) {
			if (!(group.groups[i-1] instanceof BracketOpen) &&
					!(group.groups[i] instanceof BracketClose))
				this.nodes.push(new HorizontalOpNode(this));
			this.nodes.push(Node.make(this, group.groups[i]));
		}
		this.create();
	}
	children() {
		return this.nodes;
	}
	static initial(groups) {
		const subgroups = groups.map(g => g instanceof Horizontal ? g.groups : g).flat();
		return new Horizontal(subgroups);
	}
	isFlatHorizontal() {
		return this.group.groups.map(g => g instanceof Literal).reduce((a,b) => a && b, true);
	}
	isInsertion() {
		return true;
	}
	acceptsMultipleChildren() {
		return true;
	}
	replaceChild(old, group) {
		this.replaceChildMult(old, [group]);
	}
	replaceChildMult(old, groups) {
		const index = this.group.groups.indexOf(old.group);
		const subgroups = groups.map(g => g instanceof Horizontal ? g.groups : g).flat();
		const address = this.address().concat((index + subgroups.length - 1) * 2);
		this.group.groups.splice(index, 1, ...subgroups);
		this.removeDuplicateBrackets();
		this.recreate();
		tree.setFocusAddress(address);
	}
	replaceChildOp(op, group) {
		const indexOp = op.childNumber();
		const oldPrev = this.nodes[indexOp-1];
		const oldNext = this.nodes[indexOp+1];
		const indexPrev = this.group.groups.indexOf(oldPrev.group);
		const subgroups = group instanceof Horizontal ? group.groups : [group];
		this.group.groups.splice(indexPrev, 1, ...subgroups);
		this.removeChild(oldNext);
	}
	removeChild(old) {
		const index = this.group.groups.indexOf(old.group);
		if (this.group.groups.length > 2) {
			const address = this.address().concat(index * 2);
			this.group.groups.splice(index, 1);
			this.recreate();
			tree.setFocusAddress(address);
		} else if (index == 0) {
			this.replace(this.group.groups[1]);
		} else {
			this.replace(this.group.groups[0]);
		}
	}
	removeDuplicateBrackets(groups) {
		var norm = [];
		this.group.groups.forEach(group => {
			if (norm.length == 0) {
				norm.push(group);
			} else {
				const prev = norm[norm.length-1];
				if (!(group instanceof BracketOpen && prev instanceof BracketOpen) &&
					!(group instanceof BracketClose && prev instanceof BracketClose))
				norm.push(group);
			}
		});
		this.group.groups = norm;
	}
}

class HorizontalOpNode extends Node {
	constructor(parent) {
		super('horizontal control', parent, null);
		this.create();
	}
	createLabel(div) {
		this.createControlLabel(div, Group.HOR);
	}
}

class EnclosureNode extends Node {
	constructor(parent, group) {
		super('enclosure', parent, group);
		this.nodes = [];
		for (let i = 0; i < group.groups.length; i++) {
			if (i > 0)
				this.nodes.push(new FragmentOpNode(this));
			this.nodes.push(Node.make(this, group.groups[i]));
		}
		this.create();
	}
	children() {
		return this.nodes;
	}
	setEditing() {
		super.setEditing();
		$('enclosure-select').value = this.group.type;
		$('enclosure-param').classList.remove('hidden');
		Edit.setEnclosureType(this.group.type);
		const open = this.group.delimOpen;
		$('open-select').value = open ? open : '';
		$('open-param').classList.remove('hidden');
		const close = this.group.delimClose;
		$('close-select').value = close ? close : '';
		$('close-param').classList.remove('hidden');
		if (this.group.damageOpen == 15) {
			$('damage-open-all').checked = true;
			$('damage-open-ts').checked = false;
			$('damage-open-te').checked = false;
			$('damage-open-bs').checked = false;
			$('damage-open-be').checked = false;
		} else {
			$('damage-open-all').checked = false;
			$('damage-open-ts').checked = this.group.damageOpen & 1;
			$('damage-open-bs').checked = this.group.damageOpen & 2;
			$('damage-open-te').checked = this.group.damageOpen & 4;
			$('damage-open-be').checked = this.group.damageOpen & 8;
		}
		if (open)
			$('damage-open-param').classList.remove('hidden');
		if (this.group.damageClose == 15) {
			$('damage-close-all').checked = true;
			$('damage-close-ts').checked = false;
			$('damage-close-te').checked = false;
			$('damage-close-bs').checked = false;
			$('damage-close-be').checked = false;
		} else {
			$('damage-close-all').checked = false;
			$('damage-close-ts').checked = this.group.damageClose & 1;
			$('damage-close-bs').checked = this.group.damageClose & 2;
			$('damage-close-te').checked = this.group.damageClose & 4;
			$('damage-close-be').checked = this.group.damageClose & 8;
		}
		if (close)
			$('damage-close-param').classList.remove('hidden');
	}
	static initial(groups) {
		return new Enclosure('plain', groups, '\u{13379}', 0, '\u{1337A}', 0);
	}
	isInsertion() {
		return true;
	}
	acceptsMultipleChildren() {
		return true;
	}
	insertIndex(index, group) {
		const address = this.address().concat(index * 2);
		this.group.groups.splice(index, 0, group);
		this.recreate();
		tree.setFocusAddress(address);
	}
	replaceChild(old, group) {
		this.replaceChildMult(old, [group]);
	}
	replaceChildMult(old, groups) {
		const index = this.group.groups.indexOf(old.group);
		const address = this.address().concat((index + groups.length - 1) * 2);
		this.group.groups.splice(index, 1, ...groups);
		this.recreate();
		tree.setFocusAddress(address);
	}
	replaceChildOp(op, group) {
		const indexOp = op.childNumber();
		const oldPrev = this.nodes[indexOp-1];
		const oldNext = this.nodes[indexOp+1];
		const indexPrev = this.group.groups.indexOf(oldPrev.group);
		this.group.groups.splice(indexPrev, 1, group);
		this.removeChild(oldNext);
	}
	removeChild(node) {
		const index = this.group.groups.indexOf(node.group);
		const address = this.address().concat(index * 2);
		this.group.groups.splice(index, 1);
		this.recreate();
		tree.setFocusAddress(address);
	}
}

class BasicNode extends Node {
	constructor(parent, group) {
		super('basic', parent, group);
		this.coreNode = Node.make(this, group.core);
		if (group.ts) {
			this.tsNode = Node.make(this, group.ts);
			this.tsOp = new BasicOpNode(this, 'ts');
		}
		if (group.bs) {
			this.bsNode = Node.make(this, group.bs);
			this.bsOp = new BasicOpNode(this, 'bs');
		}
		if (group.te) {
			this.teNode = Node.make(this, group.te);
			this.teOp = new BasicOpNode(this, 'te');
		}
		if (group.be) {
			this.beNode = Node.make(this, group.be);
			this.beOp = new BasicOpNode(this, 'be');
		}
		if (group.m) {
			this.mNode = Node.make(this, group.m);
			this.mOp = new BasicOpNode(this, 'm');
		}
		if (group.t) {
			this.tNode = Node.make(this, group.t);
			this.tOp = new BasicOpNode(this, 't');
		}
		if (group.b) {
			this.bNode = Node.make(this, group.b);
			this.bOp = new BasicOpNode(this, 'b');
		}
		this.create();
	}
	children() {
		var children = [this.coreNode];
		if (this.group.ts) {
			children.push(this.tsOp);
			children.push(this.tsNode);
		}
		if (this.group.bs) {
			children.push(this.bsOp);
			children.push(this.bsNode);
		}
		if (this.group.te) {
			children.push(this.teOp);
			children.push(this.teNode);
		}
		if (this.group.be) {
			children.push(this.beOp);
			children.push(this.beNode);
		}
		if (this.group.m) {
			children.push(this.mOp);
			children.push(this.mNode);
		}
		if (this.group.t) {
			children.push(this.tOp);
			children.push(this.tNode);
		}
		if (this.group.b) {
			children.push(this.bOp);
			children.push(this.bNode);
		}
		return children;
	}
	places() {
		return Group.INSERTION_PLACES.filter(p => this.group[p]);
	}
	static initial(core, group) {
		var place = 'ts';
		if (core instanceof Literal) {
			const places = Shapes.allowedPlaces(core.ch, core.rotationCoarse(), false);
			if (places.size > 0)
				place = places.values().next().value;
		}
		var insertions = {};
		insertions[place] = group;
		return new Basic(core, insertions);
	}
	allowedPlaces() {
		return this.group.core.allowedPlaces();
	}
	isInsertion() {
		return true;
	}
	insertChild(group) {
		const address = this.address().concat(this.places().length * 2 + 2);
		var place = null;
		for (let p of this.allowedPlaces())
			if (!this.group[p]) {
				place = p;
				break;
			}
		if (!place)
			for (let p of Group.INSERTION_PLACES)
				if (!this.group[p]) {
					place = p;
					break;
				}
		this.group[place] = group;
		this.recreate();
		tree.setFocusAddress(address);
	}
	replaceChild(old, group) {
		const address = old.address();
		if (this.group.core == old.group) {
			this.group.core = group;
		} else {
			for (let place of Group.INSERTION_PLACES) {
				if (this.group[place] == old.group) {
					this.group[place] = group;
					break;
				}
			}
		}
		this.recreate();
		tree.setFocusAddress(address);
	}
	removeChild(old) {
		for (let place of Group.INSERTION_PLACES) {
			if (this.group[place] == old.group) {
				const address = old.address();
				delete this.group[place];
				if (this.group.places().length) {
					this.recreate();
					tree.setFocusAddress(address);
				} else {
					this.replace(this.group.core);
				}
				return;
			}
		}
	}
}

class BasicOpNode extends Node {
	constructor(parent, place) {
		super('insert control', parent, null);
		this.place = place;
		this.create();
	}
	setEditing() {
		super.setEditing();
		const allowedPlaces = this.parent.allowedPlaces();
		['ts','bs','te','be','m','t','b'].forEach(place => {
			$('place-' + place).checked = this.place == place;
			$('place-' + place).disabled =
					this.parent.group[place] && this.place != place;
			if (allowedPlaces.has(place))
				$('place-' + place + '-label').classList.remove('error-text');
			else
				$('place-' + place + '-label').classList.add('error-text');
		});
		$('place-param').classList.remove('hidden');
	}
	createLabel(div) {
		const op = BasicOpNode.placeToControl(this.place);
		this.createControlLabel(div, op);
	}
	redraw() {
		this.label.nodeValue = BasicOpNode.placeToControl(this.place);
	}
	static placeToControl(place) {
		switch (place) {
			case 'ts': return Group.INSERT_TS;
			case 'bs': return Group.INSERT_BS;
			case 'te': return Group.INSERT_TE;
			case 'be': return Group.INSERT_BE;
			case 'm': return Group.INSERT_M;
			case 't': return Group.INSERT_T;
			case 'b': return Group.INSERT_B;
			default: return '';
		}
	}
}

class OverlayNode extends Node {
	constructor(parent, group) {
		super('overlay', parent, group);
		if (group.lits1.length == 1)
			this.lits1Node = Node.make(this, group.lits1[0]);
		else
			this.lits1Node = new FlatHorizontalNode(this, group.lits1);
		this.op = new OverlayOpNode(this);
		if (group.lits2.length == 1)
			this.lits2Node = Node.make(this, group.lits2[0]);
		else
			this.lits2Node = new FlatVerticalNode(this, group.lits2);
		this.create();
	}
	children() {
		return [this.lits1Node, this.op, this.lits2Node];
	}
	static initial(groups1, groups2) {
		const lits1 = groups1.map(g => g instanceof Horizontal ? g.groups : g).flat();
		const lits2 = groups2.map(g => g instanceof Vertical ? g.groups : g).flat();
		return new Overlay(lits1, lits2);
	}
	isCore() {
		return true;
	}
	isInsertion() {
		return true;
	}
	insertHorizontal(index, group) {
		const address = this.address().concat(0, index * 2);
		this.group.lits1.splice(index, 0, group);
		this.recreate();
		tree.setFocusAddress(address);
	}
	insertVertical(index, group) {
		const address = this.address().concat(2, index * 2);
		this.group.lits2.splice(index, 0, group);
		this.recreate();
		tree.setFocusAddress(address);
	}
	removeHorizontal(index) {
		const address = this.address().concat(0, index * 2);
		this.group.lits1.splice(index, 1);
		this.recreate();
		tree.setFocusAddress(address);
	}
	removeVertical(index) {
		const address = this.address().concat(2, index * 2);
		this.group.lits2.splice(index, 1);
		this.recreate();
		tree.setFocusAddress(address);
	}
}

class OverlayOpNode extends Node {
	constructor(parent) {
		super('overlay control', parent, null);
		this.create();
	}
	createLabel(div) {
		this.createControlLabel(div, Group.OVERLAY);
	}
}

class FlatHorizontalNode extends Node {
	constructor(parent, lits) {
		super('flat horizontal', parent, new Horizontal(lits));
		this.nodes = [Node.make(this, lits[0])];
		for (let i = 1; i < lits.length; i++) {
			this.nodes.push(new FlatHorizontalOpNode(this));
			this.nodes.push(Node.make(this, lits[i]));
		}
		this.create();
	}
	children() {
		return this.nodes;
	}
}

class FlatHorizontalOpNode extends Node {
	constructor(parent) {
		super('flat horizontal control', parent, null);
		this.create();
	}
	createLabel(div) {
		this.createControlLabel(div, Group.HOR);
	}
}

class FlatVerticalNode extends Node {
	constructor(parent, lits) {
		super('flat vertical', parent, new Vertical(lits));
		this.nodes = [Node.make(this, lits[0])];
		for (let i = 1; i < lits.length; i++) {
			this.nodes.push(new FlatVerticalOpNode(this));
			this.nodes.push(Node.make(this, lits[i]));
		}
		this.create();
	}
	children() {
		return this.nodes;
	}
	isInsertion() {
		return true;
	}
}

class FlatVerticalOpNode extends Node {
	constructor(parent) {
		super('flat vertical control', parent, null);
		this.create();
	}
	createLabel(div) {
		this.createControlLabel(div, Group.VER);
	}
}

class LiteralNode extends Node {
	constructor(parent, group) {
		super('literal', parent, group);
		this.create();
	}
	setEditing() {
		super.setEditing();
		const name = uniHiero.pointToText[this.group.ch];
		$('name-text').value = name ? name : '';
		$('name-param').classList.remove('hidden');
		if (!name)
			$('name-text').focus();
		this.showAllowedRotations();
		switch (this.group.vs) {
			case 1: $('rotate-90').checked = true; break;
			case 2: $('rotate-180').checked = true; break;
			case 3: $('rotate-270').checked = true; break;
			case 4: $('rotate-45').checked = true; break;
			case 5: $('rotate-135').checked = true; break;
			case 6: $('rotate-225').checked = true; break;
			case 7: $('rotate-315').checked = true; break;
			default: $('rotate-0').checked = true; break;
		}
		$('rotate-param').classList.remove('hidden');
		$('mirror-check').checked = this.group.mirror;
		$('mirror-param').classList.remove('hidden');
		if (this.group.damage == 15) {
			$('damage-all').checked = true;
			$('damage-ts').checked = false;
			$('damage-te').checked = false;
			$('damage-bs').checked = false;
			$('damage-be').checked = false;
		} else {
			$('damage-all').checked = false;
			$('damage-ts').checked = this.group.damage & 1;
			$('damage-bs').checked = this.group.damage & 2;
			$('damage-te').checked = this.group.damage & 4;
			$('damage-be').checked = this.group.damage & 8;
		}
		$('damage-param').classList.remove('hidden');
	}
	showAllowedRotations() {
		const rotations = Shapes.allowedRotations(this.group.ch);
		for (let rot = 45; rot < 360; rot += 45) {
			if (rotations.includes(rot))
				$('rotate-' + rot + '-label').classList.remove('error-text');
			else
				$('rotate-' + rot + '-label').classList.add('error-text');
		}
	}
	static initial() {
		return new Literal(Shapes.PLACEHOLDER, 0, false, 0);
	}
	firstLiteralNode() {
		return this;
	}
	getPlaceholderAddress() {
		return this.group.ch == Shapes.PLACEHOLDER ? [] : null;
	}
	isFlatVertical() {
		return true;
	}
	isFlatHorizontal() {
		return true;
	}
	isCore() {
		return true;
	}
	isInsertion() {
		return true;
	}
	usedInOverlay() {
		return this.parent instanceof OverlayNode ||
			this.parent instanceof FlatVerticalNode ||
			this.parent instanceof FlatHorizontalNode;
	}
	usedInOverlayHorizontal() {
		return this.parent instanceof OverlayNode && this.childNumber() == 0 ||
			this.parent instanceof FlatHorizontalNode;
	}
	usedInOverlayVertical() {
		return this.parent instanceof OverlayNode && this.childNumber() == 2 ||
			this.parent instanceof FlatVerticalNode;
	}
}

class SingletonNode extends Node {
	constructor(parent, group) {
		super('singleton', parent, group);
		this.create();
	}
	setEditing() {
		super.setEditing();
		$('singleton-select').value = this.group.ch;
		$('singleton-param').classList.remove('hidden');
		if (this.group.damage == 15) {
			$('damage-all').checked = true;
			$('damage-ts').checked = false;
			$('damage-te').checked = false;
			$('damage-bs').checked = false;
			$('damage-be').checked = false;
		} else {
			$('damage-all').checked = false;
			$('damage-ts').checked = this.group.damage & 1;
			$('damage-bs').checked = this.group.damage & 2;
			$('damage-te').checked = this.group.damage & 4;
			$('damage-be').checked = this.group.damage & 8;
		}
		$('damage-param').classList.remove('hidden');
	}
	static initial() {
		return new Singleton('\u{13258}', 0);
	}
}

class BlankNode extends Node {
	constructor(parent, group) {
		super('blank', parent, group);
		this.create();
	}
	setEditing() {
		super.setEditing();
		$('blank-full').checked = this.group.dim == 1;
		$('blank-half').checked = this.group.dim == 0.5;
		$('blank-param').classList.remove('hidden');
	}
	static initial() {
		return new Blank(1);
	}
	isInsertion() {
		return true;
	}
}

class LostNode extends Node {
	constructor(parent, group) {
		super('lost', parent, group);
		this.create();
	}
	setEditing() {
		super.setEditing();
		$('lost-half').checked = this.group.width == 0.5 && this.group.height == 0.5;
		$('lost-tall').checked = this.group.width == 0.5 && this.group.height == 1;
		$('lost-wide').checked = this.group.width == 1 && this.group.height == 0.5;
		$('lost-full').checked = this.group.width == 1 && this.group.height == 1;
		$('lost-param').classList.remove('hidden');
		$('expand-check').checked = this.group.expand;
		$('expand-param').classList.remove('hidden');
	}
	static initial() {
		return new Lost(1, 1, true);
	}
	isInsertion() {
		return true;
	}
}

class BracketOpenNode extends Node {
	constructor(parent, group) {
		super('bracket open', parent, group);
		this.create();
	}
	setEditing() {
		super.setEditing();
		$('bracket-open-select').value = this.group.ch;
		$('bracket-open-param').classList.remove('hidden');
	}
	static initial() {
		return new BracketOpen('[');
	}
	createLabel(div) {
		this.createControlLabel(div, this.group.ch);
	}
	redraw() {
		this.label.nodeValue = this.group.ch;
	}
}

class BracketCloseNode extends Node {
	constructor(parent, group) {
		super('bracket close', parent, group);
		this.create();
	}
	setEditing() {
		super.setEditing();
		$('bracket-close-select').value = this.group.ch;
		$('bracket-close-param').classList.remove('hidden');
	}
	static initial() {
		return new BracketClose(']');
	}
	createLabel(div) {
		this.createControlLabel(div, this.group.ch);
	}
	redraw() {
		this.label.nodeValue = this.group.ch;
	}
}

class Edit {
	static changeText() {
		editHistory.remember();
		Edit.makeFromInput();
	}
	static make(string, address) {
		Edit.makeFromString(string, address);
		Edit.makeInput();
	}
	static remake() {
		Edit.makeFromString(tree.toString(), tree.getFocusAddress());
	}
	static makeFromInput() {
		editHistory.remember();
		const str = Edit.hexToString($('unicode-text').value);
		Edit.makeFromString(str, [0]);
	}
	static clearText() {
		editHistory.remember();
		$('unicode-text').value = '';
		Edit.makeFromInput('', [0]);
	}
	static copyText() {
		$('unicode-text').select();
		navigator.clipboard.writeText($('unicode-text').value);
	}
	static makeInput() {
		const str = tree.toString();
		$('unicode-text').value = str;
	}
	static makeFromString(string, address) {
		try {
			var fragment = syntax.parse(string);
			var error = '';
		} catch(err) {
			var fragment = syntax.parse('');
			var error = 'Parsing error';
		}
		$('error').innerHTML = error;
		tree.create(fragment);
		tree.setFocusAddress(address);
		preview.updateAll();
		Tree.focus();
	}
	static setEditing(type) {
		$('param-type').innerHTML = type;
		$('literal-button').disabled = !Edit.canDoLiteral();
		$('singleton-button').disabled = !Edit.canDoSingleton();
		$('blank-button').disabled = !Edit.canDoBlank();
		$('lost-button').disabled = !Edit.canDoLost();
		$('append-button').disabled = !Edit.canDoAppend();
		$('prepend-button').disabled = !Edit.canDoPrepend();
		$('star-button').disabled = !Edit.canDoStar();
		$('plus-button').disabled = !Edit.canDoPlus();
		$('colon-button').disabled = !Edit.canDoColon();
		$('semicolon-button').disabled = !Edit.canDoSemicolon();
		$('bracket-open-button').disabled = !Edit.canDoBracketOpen();
		$('bracket-close-button').disabled = !Edit.canDoBracketClose();
		$('overlay-button').disabled = !Edit.canDoOverlay();
		$('insert-button').disabled = !Edit.canDoInsert();
		$('enclosure-button').disabled = !Edit.canDoEnclosure();
		$('swap-button').disabled = !Edit.canDoSwap();
		$('delete-button').disabled = !Edit.canDoDelete();
		['name-param','singleton-param','enclosure-param','open-param','close-param',
			'damage-open-param','damage-close-param',
			'bracket-open-param','bracket-close-param',
			'damage-param','mirror-param','rotate-param','place-param',
			'blank-param','lost-param','expand-param'].forEach(par => {$(par).classList.add('hidden')});
	}
	static doNameFocus() {
		if (tree.focus instanceof LiteralNode)
			$('name-text').focus();
	}
	static doMenu() {
		if (tree.focus instanceof LiteralNode)
			signMenu.show();
	}
	static canDoLiteral() {
		const node = tree.focus;
		if (!node)
			return true;
		switch (node.constructor) {
			case EnclosureNode:
				return node.group.groups.length == 0;
			case FragmentOpNode:
			case SingletonNode:
			case BlankNode:
			case LostNode:
				return true;
			default:
				return false;
		}
	}
	static doLiteral() {
		if (!Edit.canDoLiteral())
			return;
		editHistory.remember();
		const node = tree.focus;
		if (!node) {
			tree.insertTop(0, LiteralNode.initial());
		} else {
			switch (node.constructor) {
				case EnclosureNode: {
					node.insertIndex(0, LiteralNode.initial());
					break;
				}
				case FragmentOpNode: {
					node.insertOp(LiteralNode.initial());
					break;
				}
				case SingletonNode:
				case BlankNode:
				case LostNode: {
					node.replace(LiteralNode.initial());
					break;
				}
			}
		}
		tree.setPlaceholderAddress();
		preview.update();
	}
	static canDoSingleton() {
		const node = tree.focus;
		if (!node)
			return true;
		switch (node.constructor) {
			case FragmentOpNode:
			case LiteralNode:
			case BlankNode:
			case LostNode:
				return !node.parent;
			default:
				return false;
		}
	}
	static doSingleton() {
		if (!Edit.canDoSingleton())
			return;
		editHistory.remember();
		const node = tree.focus;
		if (!node) {
			tree.insertTop(0, SingletonNode.initial());
		} else {
			switch (node.constructor) {
				case FragmentOpNode: {
					node.insertOp(SingletonNode.initial());
					break;
				}
				case LiteralNode:
				case BlankNode:
				case LostNode: {
					node.replace(SingletonNode.initial());
					break;
				}
			}
		}
		preview.update();
	}
	static canDoBlank() {
		const node = tree.focus;
		if (!node)
			return true;
		switch (node.constructor) {
			case EnclosureNode:
				return node.group.groups.length == 0;
			case LiteralNode:
				return !node.usedInOverlay() && !node.usedAsCore();
			case FragmentOpNode:
			case SingletonNode:
			case LostNode:
				return true;
			default:
				return false;
		}
	}
	static doBlank() {
		if (!Edit.canDoBlank())
			return;
		editHistory.remember();
		const node = tree.focus;
		if (!node) {
			tree.insertTop(0, BlankNode.initial());
		} else {
			switch (node.constructor) {
				case EnclosureNode: {
					node.insertIndex(0, BlankNode.initial());
					break;
				}
				case FragmentOpNode: {
					node.insertOp(BlankNode.initial());
					break;
				}
				case LiteralNode:
				case SingletonNode:
				case LostNode: {
					node.replace(BlankNode.initial());
					break;
				}
			}
		}
		preview.update();
	}
	static canDoLost() {
		const node = tree.focus;
		if (!node)
			return true;
		switch (node.constructor) {
			case EnclosureNode:
				return node.group.groups.length == 0;
			case LiteralNode:
				return !node.usedInOverlay() && !node.usedAsCore();
			case FragmentOpNode:
			case SingletonNode:
			case BlankNode:
				return true;
			default:
				return false;
		}
	}
	static doLost() {
		if (!Edit.canDoLost())
			return;
		editHistory.remember();
		const node = tree.focus;
		if (!node) {
			tree.insertTop(0, LostNode.initial());
		} else {
			switch (node.constructor) {
				case EnclosureNode: {
					node.insertIndex(0, LostNode.initial());
					break;
				}
				case FragmentOpNode: {
					node.insertOp(LostNode.initial());
					break;
				}
				case LiteralNode:
				case SingletonNode:
				case BlankNode: {
					node.replace(LostNode.initial());
					break;
				}
			}
		}
		preview.update();
	}
	static canDoAppend() {
		const node = tree.focus;
		if (!node)
			return false;
		switch (node.constructor) {
			case FragmentOpNode:
				return false;
			default:
				return true;
		}
	}
	static doAppend() {
		if (!Edit.canDoAppend())
			return;
		editHistory.remember();
		const fragmentRoot = tree.focus.fragmentRoot();
		const index = fragmentRoot.childNumber() + 2;
		fragmentRoot.insertSibling(index, LiteralNode.initial());
		preview.update();
	}
	static canDoPrepend() {
		const node = tree.focus;
		if (!node)
			return false;
		switch (node.constructor) {
			case FragmentOpNode:
				return false;
			default:
				return true;
		}
	}
	static doPrepend() {
		if (!Edit.canDoPrepend())
			return;
		editHistory.remember();
		const fragmentRoot = tree.focus.fragmentRoot();
		const index = fragmentRoot.childNumber();
		fragmentRoot.insertSibling(index, LiteralNode.initial());
		preview.update();
	}
	static canDoStar() {
		const node = tree.focus;
		if (!node)
			return false;
		switch (node.constructor) {
			case VerticalNode:
			case VerticalOpNode:
			case HorizontalNode:
			case EnclosureNode:
			case BasicNode:
			case FlatHorizontalNode:
			case BlankNode:
			case LostNode:
				return true;
			case FragmentOpNode:
				return node.nonSingletonNeighbors();
			case BasicOpNode:
				return node.siblings().length == 3;
			case OverlayNode:
				return !node.usedAsCore();
			case OverlayOpNode:
				return !node.parent.usedAsCore();
			case LiteralNode:
				return !node.usedInOverlayVertical() && !node.usedAsCore();
			default:
				return false;
		}
	}
	static doStar() {
		if (!Edit.canDoStar())
			return;
		editHistory.remember();
		const node = tree.focus;
		switch (node.constructor) {
			case HorizontalNode: {
				const groups = node.group.groups.concat(LiteralNode.initial());
				node.replace(HorizontalNode.initial(groups));
				tree.setPlaceholderAddress();
				break;
			}
			case FlatHorizontalNode: {
				const siblings = node.siblings();
				const lits1 = node.group.groups.concat(LiteralNode.initial());
				const lits2 = node.parent.group.lits2;
				node.parent.replace(OverlayNode.initial(lits1, lits2));
				tree.setPlaceholderAddress();
				break;
			}
			case VerticalOpNode:
			case FragmentOpNode: {
				const address = node.address();
				const siblings = node.siblings();
				const index = node.childNumber();
				const node1 = siblings[index-1];
				const node2 = siblings[index+1];
				node.replaceOp(HorizontalNode.initial([node1.group, node2.group]));
				tree.setFocusAddress(address);
				break;
			}
			case BasicOpNode:
			case OverlayOpNode: {
				const address = node.address();
				const siblings = node.siblings();
				const node1 = siblings[0];
				const node2 = siblings[2];
				node.parent.replace(HorizontalNode.initial([node1.group, node2.group]));
				tree.setFocusAddress(address);
				break;
			}
			case OverlayNode:
			case VerticalNode:
			case EnclosureNode:
			case BasicNode:
			case BlankNode:
			case LostNode: {
				node.replace(HorizontalNode.initial([node.group, LiteralNode.initial()]));
				tree.setPlaceholderAddress();
				break;
			}
			case LiteralNode: {
				const lit = LiteralNode.initial();
				if (node.parent instanceof OverlayNode) {
					const overlayNode = node.parent;
					overlayNode.insertHorizontal(overlayNode.group.lits1.length, lit);
				} else if (node.parent instanceof FlatHorizontalNode) {
					const overlayNode = node.parent.parent;
					const index = overlayNode.group.lits1.indexOf(node.group);
					overlayNode.insertHorizontal(index+1, lit);
				} else {
					node.replace(HorizontalNode.initial([node.group, lit]));
				}
				tree.setPlaceholderAddress();
				break;
			}
		}
		preview.update();
	}
	static canDoPlus() {
		const node = tree.focus;
		if (!node)
			return false;
		switch (node.constructor) {
			case HorizontalNode:
			case VerticalNode:
			case EnclosureNode:
			case BasicNode:
			case FlatHorizontalNode:
			case BlankNode:
			case LostNode:
				return true;
			case OverlayNode:
				return !node.usedAsCore();
			case LiteralNode:
				return !node.usedInOverlayVertical() && !node.usedAsCore();
			default:
				return false;
		}
	}
	static doPlus() {
		if (!Edit.canDoPlus())
			return;
		editHistory.remember();
		const node = tree.focus;
		switch (node.constructor) {
			case HorizontalNode: {
				const groups = [LiteralNode.initial()].concat(node.group.groups);
				node.replace(HorizontalNode.initial(groups));
				tree.setPlaceholderAddress();
				break;
			}
			case FlatHorizontalNode: {
				const siblings = node.siblings();
				const lits1 = [LiteralNode.initial()].concat(node.group.groups);
				const lits2 = node.parent.group.lits2;
				node.parent.replace(OverlayNode.initial(lits1, lits2));
				tree.setPlaceholderAddress();
				break;
			}
			case VerticalNode:
			case EnclosureNode:
			case BasicNode:
			case BlankNode:
			case LostNode:
			case OverlayNode: {
				node.replace(HorizontalNode.initial([LiteralNode.initial(), node.group]));
				tree.setPlaceholderAddress();
				break;
			}
			case LiteralNode: {
				const lit = LiteralNode.initial();
				if (node.parent instanceof OverlayNode) {
					const overlayNode = node.parent;
					overlayNode.insertHorizontal(0, lit);
				} else if (node.parent instanceof FlatHorizontalNode) {
					const overlayNode = node.parent.parent;
					const index = overlayNode.group.lits1.indexOf(node.group);
					overlayNode.insertHorizontal(index, lit);
				} else {
					node.replace(HorizontalNode.initial([lit, node.group]));
				}
				tree.setPlaceholderAddress();
				break;
			}
		}
		preview.update();
	}
	static canDoColon() {
		const node = tree.focus;
		if (!node)
			return false;
		switch (node.constructor) {
			case VerticalNode:
			case HorizontalNode:
			case EnclosureNode:
			case BasicNode:
			case FlatVerticalNode:
			case BlankNode:
			case LostNode:
				return true;
			case HorizontalOpNode: {
				const siblings = node.siblings();
				const index = node.childNumber();
				const node1 = siblings[index-1];
				const node2 = siblings[index+1];
				return !(node1 instanceof BracketCloseNode ||
							node2 instanceof BracketOpenNode);
			}
			case FragmentOpNode:
				return node.nonSingletonNeighbors();
			case BasicOpNode:
				return node.siblings().length == 3;
			case OverlayNode:
				return !node.usedAsCore();
			case OverlayOpNode:
				return !node.parent.usedAsCore();
			case LiteralNode:
				return !node.usedInOverlayHorizontal() && !node.usedAsCore();
			default:
				return false;
		}
	}
	static doColon() {
		if (!Edit.canDoColon())
			return;
		editHistory.remember();
		const node = tree.focus;
		switch (node.constructor) {
			case VerticalNode: {
				const groups = node.group.groups.concat(LiteralNode.initial());
				node.replace(VerticalNode.initial(groups));
				tree.setPlaceholderAddress();
				break;
			}
			case FlatVerticalNode: {
				const siblings = node.siblings();
				const lits1 = node.parent.group.lits1;
				const lits2 = node.group.groups.concat(LiteralNode.initial());
				node.parent.replace(OverlayNode.initial(lits1, lits2));
				tree.setPlaceholderAddress();
				break;
			}
			case HorizontalOpNode:
			case FragmentOpNode: {
				const address = node.address();
				const siblings = node.siblings();
				const index = node.childNumber();
				const node1 = siblings[index-1];
				const node2 = siblings[index+1];
				node.replaceOp(VerticalNode.initial([node1.group, node2.group]));
				tree.setFocusAddress(address);
				break;
			}
			case BasicOpNode:
			case OverlayOpNode: {
				const address = node.address();
				const siblings = node.siblings();
				const node1 = siblings[0];
				const node2 = siblings[2];
				node.parent.replace(VerticalNode.initial([node1.group, node2.group]));
				tree.setFocusAddress(address);
				break;
			}
			case OverlayNode:
			case HorizontalNode:
			case EnclosureNode:
			case BasicNode:
			case BlankNode:
			case LostNode: {
				node.replace(VerticalNode.initial([node.group, LiteralNode.initial()]));
				tree.setPlaceholderAddress();
				break;
			}
			case LiteralNode: {
				const lit = LiteralNode.initial();
				if (node.parent instanceof OverlayNode) {
					const overlayNode = node.parent;
					overlayNode.insertVertical(overlayNode.group.lits2.length, lit);
				} else if (node.parent instanceof FlatVerticalNode) {
					const overlayNode = node.parent.parent;
					const index = overlayNode.group.lits2.indexOf(node.group);
					overlayNode.insertVertical(index+1, lit);
				} else {
					node.replace(VerticalNode.initial([node.group, lit]));
				}
				tree.setPlaceholderAddress();
				break;
			}
		}
		preview.update();
	}
	static canDoSemicolon() {
		const node = tree.focus;
		if (!node)
			return false;
		switch (node.constructor) {
			case VerticalNode:
			case HorizontalNode:
			case EnclosureNode:
			case BasicNode:
			case FlatVerticalNode:
			case BlankNode:
			case LostNode:
				return true;
			case OverlayNode:
				return !node.usedAsCore();
			case LiteralNode:
				return !node.usedInOverlayHorizontal() && !node.usedAsCore();
			default:
				return false;
		}
	}
	static doSemicolon() {
		if (!Edit.canDoSemicolon())
			return;
		editHistory.remember();
		const node = tree.focus;
		switch (node.constructor) {
			case VerticalNode: {
				const groups = [LiteralNode.initial()].concat(node.group.groups);
				node.replace(VerticalNode.initial(groups));
				tree.setPlaceholderAddress();
				break;
			}
			case FlatVerticalNode: {
				const siblings = node.siblings();
				const lits1 = node.parent.group.lits1;
				const lits2 = [LiteralNode.initial()].concat(node.group.groups);
				node.parent.replace(OverlayNode.initial(lits1, lits2));
				tree.setPlaceholderAddress();
				break;
			}
			case OverlayNode:
			case HorizontalNode:
			case EnclosureNode:
			case BasicNode:
			case BlankNode:
			case LostNode: {
				node.replace(VerticalNode.initial([LiteralNode.initial(), node.group]));
				tree.setPlaceholderAddress();
				break;
			}
			case LiteralNode: {
				const lit = LiteralNode.initial();
				if (node.parent instanceof OverlayNode) {
					const overlayNode = node.parent;
					overlayNode.insertVertical(0, lit);
				} else if (node.parent instanceof FlatVerticalNode) {
					const overlayNode = node.parent.parent;
					const index = overlayNode.group.lits2.indexOf(node.group);
					overlayNode.insertVertical(index, lit);
				} else {
					node.replace(VerticalNode.initial([node.group, lit]));
				}
				tree.setPlaceholderAddress();
				break;
			}
		}
		preview.update();
	}
	static canDoBracketOpen() {
		const node = tree.focus;
		if (!node)
			return false;
		switch (node.constructor) {
			case VerticalNode:
			case EnclosureNode:
			case BasicNode:
			case BlankNode:
			case LostNode:
				return !node.hasBracketOpen();
			case LiteralNode:
				return !node.hasBracketOpen() && !node.usedAsCore() && !node.usedInOverlay();
			case OverlayNode:
				return !node.hasBracketOpen() && !node.usedAsCore();
			default:
				return false;
		}
	}
	static doBracketOpen() {
		if (!Edit.canDoBracketOpen())
			return;
		editHistory.remember();
		const node = tree.focus;
		switch (node.constructor) {
			case VerticalNode:
			case EnclosureNode:
			case BasicNode:
			case OverlayNode:
			case LiteralNode:
			case BlankNode:
			case LostNode: {
				const address = node.address().concat(0);
				node.replace(HorizontalNode.initial([BracketOpenNode.initial(), node.group]));
				tree.setFocusAddress(address);
				break;
			}
		}
		preview.update();
	}
	static canDoBracketClose() {
		const node = tree.focus;
		if (!node)
			return false;
		switch (node.constructor) {
			case VerticalNode:
			case EnclosureNode:
			case BasicNode:
			case BlankNode:
			case LostNode:
				return !node.hasBracketClose();
			case LiteralNode:
				return !node.hasBracketClose() && !node.usedAsCore() && !node.usedInOverlay();
			case OverlayNode:
				return !node.hasBracketClose() && !node.usedAsCore();
			default:
				return false;
		}
	}
	static doBracketClose() {
		if (!Edit.canDoBracketClose())
			return;
		editHistory.remember();
		const node = tree.focus;
		switch (node.constructor) {
			case VerticalNode:
			case EnclosureNode:
			case BasicNode:
			case OverlayNode:
			case LiteralNode:
			case BlankNode:
			case LostNode: {
				const address = node.address().concat(1);
				node.replace(HorizontalNode.initial([node.group, BracketCloseNode.initial()]));
				tree.setFocusAddress(address);
				break;
			}
		}
		preview.update();
	}
	static canDoOverlay() {
		const node = tree.focus;
		if (!node)
			return false;
		switch (node.constructor) {
			case HorizontalNode:
				return node.isFlatHorizontal();
			case VerticalNode:
				return node.isFlatVertical();
			case FragmentOpNode:
			case VerticalOpNode:
			case HorizontalOpNode:
				const childNum = node.childNumber();
				const sibling1 = node.siblings()[childNum-1];
				const sibling2 = node.siblings()[childNum+1];
				return sibling1.isFlatHorizontal() && sibling2.isFlatVertical();
			case BasicOpNode:
				const siblings = node.siblings();
				return siblings.length == 3 &&
					siblings[0].isFlatHorizontal() && siblings[2].isFlatVertical();
			case LiteralNode:
				return !node.usedInOverlay();
			default:
				return false;
		}
	}
	static doOverlay() {
		if (!Edit.canDoOverlay())
			return;
		editHistory.remember();
		const node = tree.focus;
		switch (node.constructor) {
			case HorizontalNode: {
				node.replace(OverlayNode.initial(node.group.groups, [LiteralNode.initial()]));
				tree.setPlaceholderAddress();
				break;
			}
			case VerticalNode: {
				node.replace(OverlayNode.initial([LiteralNode.initial()], node.group.groups));
				tree.setPlaceholderAddress();
				break;
			}
			case FragmentOpNode:
			case VerticalOpNode:
			case HorizontalOpNode: {
				const address = node.address();
				const siblings = node.siblings();
				const index = node.childNumber();
				const node1 = siblings[index-1];
				const node2 = siblings[index+1];
				node.replaceOp(OverlayNode.initial([node1.group], [node2.group]));
				tree.setFocusAddress(address);
				break;
			}
			case BasicOpNode: {
				const address = node.address();
				const siblings = node.siblings();
				const node1 = siblings[0];
				const node2 = siblings[2];
				node.parent.replace(OverlayNode.initial([node1.group], [node2.group]));
				tree.setFocusAddress(address);
				break;
			}
			case LiteralNode: {
				node.replace(OverlayNode.initial([node.group], [LiteralNode.initial()]));
				tree.setPlaceholderAddress();
				break;
			}
		}
		preview.update();
	}
	static canDoInsert() {
		const node = tree.focus;
		if (!node)
			return false;
		switch (node.constructor) {
			case OverlayNode:
				return !node.usedAsCore();
			case OverlayOpNode:
				const siblings = node.siblings();
				return !node.parent.usedAsCore() && siblings[0].isCore() && siblings[2].isInsertion();
			case FragmentOpNode:
			case VerticalOpNode:
			case HorizontalOpNode:
				const childNum = node.childNumber();
				const sibling1 = node.siblings()[childNum-1];
				const sibling2 = node.siblings()[childNum+1];
				return sibling1.isCore() && sibling2.isInsertion();
			case LiteralNode:
				return !node.usedInOverlay() && !node.usedAsCore();
			case BasicNode:
				return node.group.places().length < Group.INSERTION_PLACES.length;
			default:
				return false;
		}
	}
	static doInsert() {
		if (!Edit.canDoInsert())
			return;
		editHistory.remember();
		const node = tree.focus;
		switch (node.constructor) {
			case FragmentOpNode:
			case VerticalOpNode:
			case HorizontalOpNode: {
				const address = node.address();
				const siblings = node.siblings();
				const index = node.childNumber();
				node.replaceOp(BasicNode.initial(siblings[index-1].group, siblings[index+1].group));
				tree.setFocusAddress(address);
				break;
			}
			case OverlayOpNode: {
				const address = node.address();
				const siblings = node.siblings();
				node.parent.replace(BasicNode.initial(siblings[0].group, siblings[2].group));
				tree.setFocusAddress(address);
				break;
			}
			case OverlayNode:
			case LiteralNode: {
				node.replace(BasicNode.initial(node.group, LiteralNode.initial()));
				tree.setPlaceholderAddress();
				break;
			}
			case BasicNode: {
				node.insertChild(LiteralNode.initial());
				tree.setPlaceholderAddress();
				break;
			}
		}
		preview.update();
	}
	static canDoEnclosure() {
		const node = tree.focus;
		if (!node)
			return false;
		switch (node.constructor) {
			case VerticalNode:
			case HorizontalNode:
			case EnclosureNode:
			case BasicNode:
			case OverlayNode:
			case BlankNode:
			case LostNode:
				return true;
			case LiteralNode:
				return !node.usedInOverlay() && !node.usedAsCore();
			default:
				return false;
		}
	}
	static doEnclosure() {
		if (!Edit.canDoEnclosure())
			return;
		editHistory.remember();
		const node = tree.focus;
		switch (node.constructor) {
			case VerticalNode:
			case HorizontalNode:
			case EnclosureNode:
			case BasicNode:
			case OverlayNode:
			case BlankNode:
			case LostNode:
			case LiteralNode: {
				node.replace(EnclosureNode.initial([node.group]));
				break;
			}
		}
		preview.update();
	}
	static canDoSwap() {
		const node = tree.focus;
		if (!node)
			return false;
		switch (node.constructor) {
			case LiteralNode:
				return node.nextLiteralNode();
			default:
				return false;
		}
	}
	static doSwap() {
		if (!Edit.canDoSwap())
			return;
		editHistory.remember();
		const node = tree.focus;
		const next = node.nextLiteralNode();
		const tmp = node.group.ch;
		node.group.ch = next.group.ch;
		next.group.ch = tmp;
		node.redrawToRoot();
		next.redrawToRoot();
		preview.update();
	}
	static canDoDelete() {
		const node = tree.focus;
		if (!node)
			return false;
		switch (node.constructor) {
			case VerticalNode:
			case HorizontalNode:
			case BasicNode:
			case OverlayNode:
				return !node.parent || node.parent.acceptsMultipleChildren();
			case BlankNode:
			case LostNode:
				return !node.hasBracketOpen() && !node.hasBracketClose();
			case SingletonNode:
			case BracketOpenNode:
			case BracketCloseNode:
				return true;
			case EnclosureNode:
				return node.group.groups.length == 0 || !node.parent ||
					node.parent.acceptsMultipleChildren();
			case LiteralNode:
				if (node.parent instanceof FlatHorizontalNode)
					return true;
				else if (node.parent instanceof FlatVerticalNode)
					return true;
				else if (node.parent instanceof OverlayNode)
					return node.parent.group.lits1.length == 1 && node.parent.group.lits2.length == 1;
				else
					return !node.usedAsCore() && !node.hasBracketOpen() && !node.hasBracketClose();
			default:
				return false;
		}
	}
	static doDelete() {
		if (!Edit.canDoDelete())
			return;
		editHistory.remember();
		const node = tree.focus;
		switch (node.constructor) {
			case BasicNode: {
				const childGroups = [node.group.core].concat(Group.INSERTION_PLACES.map(p =>
						node.group[p] ? node.group[p] : []).flat());
				node.replaceMult(childGroups);
				break;
			}
			case OverlayNode: {
				var child1 = node.group.lits1.length == 1 ? node.group.lits1[0] :
					HorizontalNode.initial(node.group.lits1);
				var child2 = node.group.lits2.length == 1 ? node.group.lits2[0] :
					VerticalNode.initial(node.group.lits2);
				node.replaceMult([child1, child2]);
				break;
			}
			case VerticalNode:
			case EnclosureNode: {
				if (node.group.groups.length == 0)
					node.remove();
				else
					node.replaceMult(node.group.groups);
				break;
			}
			case HorizontalNode: {
				node.replaceMult(node.group.groups.filter(g =>
					!(g instanceof BracketOpen || g instanceof BracketClose)));
				break;
			}
			case BracketOpenNode:
			case BracketCloseNode:
			case SingletonNode:
			case BlankNode:
			case LostNode: {
				node.remove();
				break;
			}
			case LiteralNode: {
				if (node.parent instanceof FlatHorizontalNode) {
					const overlayNode = node.parent.parent;
					const index = overlayNode.group.lits1.indexOf(node.group);
					overlayNode.removeHorizontal(index);
				} else if (node.parent instanceof FlatVerticalNode) {
					const overlayNode = node.parent.parent;
					const index = overlayNode.group.lits2.indexOf(node.group);
					overlayNode.removeVertical(index);
				} else if (node.parent instanceof OverlayNode) {
					if (node.parent.group.lits1[0] == node.group)
						node.parent.replace(node.parent.group.lits2[0]);
					else
						node.parent.replace(node.parent.group.lits1[0]);
				} else {
					node.remove();
				}
				break;
			}
		}
		preview.update();
	}
	static adjustName() {
		if (!(tree.focus instanceof LiteralNode))
			return;
		var codepoint = null;
		const name = $('name-text').value;
		if (name.slice(-1) == '-') {
			Edit.doAppend();
			return;
		} else if (name.slice(-1) == '*') {
			Edit.doStar();
			return;
		} else if (name.slice(-1) == '+') {
			Edit.doPlus();
			return;
		} else if (name.slice(-1) == ':') {
			Edit.doColon();
			return;
		} else if (name.slice(-1) == ';') {
			Edit.doSemicolon();
			return;
		} else if (name in uniGlyphs) {
			codepoint = uniGlyphs[name];
		} else if (name in uniMnemonics) {
			codepoint = uniGlyphs[uniMnemonics[name]];
		} else if (name == '') {
			codepoint = 0xFFFD;
		} else if (name == 'u') {
			$('name-text').value = '';
			signMenu.show();
			return;
		} else {
			return;
		}
		editHistory.remember();
		tree.focus.group.ch = String.fromCodePoint(codepoint);
		tree.focus.showAllowedRotations();
		Edit.redrawFocus();
	}
	static adjustNameOnEnter(e) {
		if (e.keyCode == 13)
			Tree.focus();
	}
	static adjustSingleton() {
		if (!(tree.focus instanceof SingletonNode))
			return;
		editHistory.remember();
		tree.focus.group.ch = $('singleton-select').value;
		Edit.redrawFocus();
	}
	static adjustEnclosure() {
		if (!(tree.focus instanceof EnclosureNode))
			return;
		const newType = $('enclosure-select').value;
		if (tree.focus.group.type != newType) {
			editHistory.remember();
			if (newType == 'plain') {
				tree.focus.group.delimOpen = '\u{13379}';
				tree.focus.group.delimClose = '\u{1337A}';
			} else {
				tree.focus.group.delimOpen = '\u{13286}';
				tree.focus.group.delimClose = '\u{13287}';
			}
			$('open-select').value = tree.focus.group.delimOpen;
			$('close-select').value = tree.focus.group.delimClose;
			$('damage-open-param').classList.remove('hidden');
			$('damage-close-param').classList.remove('hidden');
			tree.focus.group.type = newType;
			Edit.redrawFocus();
			Edit.setEnclosureType(newType);
		}
	}
	static adjustOpen() {
		if (!(tree.focus instanceof EnclosureNode))
			return;
		const open = $('open-select').value;
		editHistory.remember();
		tree.focus.group.delimOpen = open ? open : null;
		if (open)
			$('damage-open-param').classList.remove('hidden');
		else
			$('damage-open-param').classList.add('hidden');
		Edit.redrawFocus();
	}
	static adjustClose() {
		if (!(tree.focus instanceof EnclosureNode))
			return;
		const close = $('close-select').value;
		editHistory.remember();
		tree.focus.group.delimClose = close ? close : null;
		if (close)
			$('damage-close-param').classList.remove('hidden');
		else
			$('damage-close-param').classList.add('hidden');
		Edit.redrawFocus();
	}
	static adjustBracketOpen() {
		if (!(tree.focus instanceof BracketOpenNode))
			return;
		editHistory.remember();
		tree.focus.group.ch = $('bracket-open-select').value;
		Edit.redrawFocus();
	}
	static adjustBracketClose() {
		if (!tree.focus || !(tree.focus instanceof BracketCloseNode))
			return;
		editHistory.remember();
		tree.focus.group.ch = $('bracket-close-select').value;
		Edit.redrawFocus();
	}
	static adjustRotate(r) {
		if (!(tree.focus instanceof LiteralNode))
			return;
		editHistory.remember();
		switch (r) {
			case 90: tree.focus.group.vs = 1; break;
			case 180: tree.focus.group.vs = 2; break;
			case 270: tree.focus.group.vs = 3; break;
			case 45: tree.focus.group.vs = 4; break;
			case 135: tree.focus.group.vs = 5; break;
			case 225: tree.focus.group.vs = 6; break;
			case 315: tree.focus.group.vs = 7; break;
			default: tree.focus.group.vs = 0; break;
		}
		Edit.redrawFocus();
	}
	static adjustRotateNext() {
		if (!(tree.focus instanceof LiteralNode))
			return;
		var rot = Group.numToRotate(tree.focus.group.vs);
		var allowed = Shapes.allowedRotations(tree.focus.group.ch);
		for (var diff = 45; diff < 360; diff += 45) {
			const rotNew = (rot + diff) % 360;
			if (rotNew == 0 || allowed.length == 0 || allowed.includes(rotNew)) {
				editHistory.remember();
				tree.focus.group.vs = Group.rotateToNum(rotNew);
				$('rotate-' + rotNew).checked = true;
				Edit.redrawFocus();
				break;
			}
		}
	}
	static adjustMirror(val) {
		if (!(tree.focus instanceof LiteralNode))
			return;
		editHistory.remember();
		tree.focus.group.mirror = $('mirror-check').checked;
		Edit.redrawFocus();
	}
	static adjustMirrorToggle(val) {
		if (!(tree.focus instanceof LiteralNode))
			return;
		editHistory.remember();
		tree.focus.group.mirror = !$('mirror-check').checked;
		$('mirror-check').checked = tree.focus.group.mirror;
		Edit.redrawFocus();
	}
	static adjustDamage(type) {
		if (!(tree.focus instanceof LiteralNode || tree.focus instanceof SingletonNode))
			return;
		if (type == 'full') {
			$('damage-ts').checked = false;
			$('damage-bs').checked = false;
			$('damage-te').checked = false;
			$('damage-be').checked = false;
		} else {
			$('damage-all').checked = false;
		}
		editHistory.remember();
		if ($('damage-all').checked) {
			tree.focus.group.damage = 15;
		} else {
			tree.focus.group.damage =
				($('damage-ts').checked ? 1 : 0) +
				($('damage-bs').checked ? 2 : 0) +
				($('damage-te').checked ? 4 : 0) +
				($('damage-be').checked ? 8 : 0);
		}
		Edit.redrawFocus();
	}
	static adjustDamageToggle() {
		if (!(tree.focus instanceof LiteralNode || tree.focus instanceof SingletonNode))
			return;
		$('damage-ts').checked = false;
		$('damage-bs').checked = false;
		$('damage-te').checked = false;
		$('damage-be').checked = false;
		editHistory.remember();
		if ($('damage-all').checked) {
			$('damage-all').checked = false;
			tree.focus.group.damage = 0;
		} else {
			$('damage-all').checked = true;
			tree.focus.group.damage = 15;
		}
		Edit.redrawFocus();
	}
	static adjustDamageOpen(type) {
		if (!(tree.focus instanceof EnclosureNode))
			return;
		if (type == 'full') {
			$('damage-open-ts').checked = false;
			$('damage-open-bs').checked = false;
			$('damage-open-te').checked = false;
			$('damage-open-be').checked = false;
		} else {
			$('damage-open-all').checked = false;
		}
		editHistory.remember();
		if ($('damage-open-all').checked) {
			tree.focus.group.damageOpen = 15;
		} else {
			tree.focus.group.damageOpen =
				($('damage-open-ts').checked ? 1 : 0) +
				($('damage-open-bs').checked ? 2 : 0) +
				($('damage-open-te').checked ? 4 : 0) +
				($('damage-open-be').checked ? 8 : 0);
		}
		Edit.redrawFocus();
	}
	static adjustDamageClose(type) {
		if (!(tree.focus instanceof EnclosureNode))
			return;
		if (type == 'full') {
			$('damage-close-ts').checked = false;
			$('damage-close-bs').checked = false;
			$('damage-close-te').checked = false;
			$('damage-close-be').checked = false;
		} else {
			$('damage-close-all').checked = false;
		}
		editHistory.remember();
		if ($('damage-close-all').checked) {
			tree.focus.group.damageClose = 15;
		} else {
			tree.focus.group.damageClose =
				($('damage-close-ts').checked ? 1 : 0) +
				($('damage-close-bs').checked ? 2 : 0) +
				($('damage-close-te').checked ? 4 : 0) +
				($('damage-close-be').checked ? 8 : 0);
		}
		Edit.redrawFocus();
	}
	static adjustPlace(place) {
		if (!(tree.focus instanceof BasicOpNode))
			return;	
		const basic = tree.focus.parent;
		const prev = tree.focus.place;
		if (place == prev)
			return;
		if (basic.places().includes(place))
			return;
		editHistory.remember();
		basic.group[place] = basic.group[prev];
		delete basic.group[prev];
		tree.focus.place = place;
		basic[place + 'Op'] = basic[prev + 'Op'];
		basic[place + 'Node'] = basic[prev + 'Node'];
		delete basic[prev + 'Op'];
		delete basic[prev + 'Node'];
		Edit.redrawFocus();
	}
	static adjustPlaceNext() {
		if (!(tree.focus instanceof BasicOpNode))
			return;	
		var index = Group.INSERTION_PLACES.indexOf(tree.focus.place);
		for (let i = 1; i < Group.INSERTION_PLACES.length; i++) {
			index = (index+1) % Group.INSERTION_PLACES.length;
			const place = Group.INSERTION_PLACES[index];
			if (tree.focus.parent.allowedPlaces().has(place) &&
					!tree.focus.parent.places().includes(place)) {
				$('place-' + place).checked = true;
				Edit.adjustPlace(place);
				break;
			}
		}
	}
		
	static adjustBlankSize(s) {
		if (!(tree.focus instanceof BlankNode))
			return;
		editHistory.remember();
		tree.focus.group.dim = s == 'half' ? 0.5 : 1;
		Edit.redrawFocus();
	}
	static adjustBlankSizeToggle() {
		editHistory.remember();
		if ($('blank-half').checked) {
			$('blank-full').checked = true;
			tree.focus.group.dim = 1;
		} else {
			$('blank-half').checked = true;
			tree.focus.group.dim = 0.5;
		}
		Edit.redrawFocus();
	}
	static adjustLostSize(s) {
		if (!(tree.focus instanceof LostNode))
			return;
		editHistory.remember();
		switch (s) {
			case 'half':
				tree.focus.group.width = 0.5; tree.focus.group.height = 0.5; break;
			case 'tall':
				tree.focus.group.width = 0.5; tree.focus.group.height = 1; break;
			case 'wide':
				tree.focus.group.width = 1; tree.focus.group.height = 0.5; break;
			default:
				tree.focus.group.width = 1; tree.focus.group.height = 1; break;
		}
		Edit.redrawFocus();
	}
	static adjustLostSizeToggle() {
		editHistory.remember();
		if ($('lost-half').checked) {
			$('lost-wide').checked = true;
			tree.focus.group.width = 1; tree.focus.group.height = 0.5;
		} else if ($('lost-wide').checked) {
			$('lost-tall').checked = true;
			tree.focus.group.width = 0.5; tree.focus.group.height = 1;
		} else if ($('lost-tall').checked) {
			$('lost-full').checked = true;
			tree.focus.group.width = 1; tree.focus.group.height = 1;
		} else {
			$('lost-half').checked = true;
			tree.focus.group.width = 0.5; tree.focus.group.height = 0.5;
		}
		Edit.redrawFocus();
	}
	static adjustExpand() {
		if (!(tree.focus instanceof LostNode))
			return;
		editHistory.remember();
		tree.focus.group.expand = $('expand-check').checked;
		Edit.redrawFocus();
	}
	static adjustExpandToggle() {
		if (!(tree.focus instanceof LostNode))
			return;
		editHistory.remember();
		tree.focus.group.expand = !$('expand-check').checked;
		$('expand-check').checked = tree.focus.group.expand;
		Edit.redrawFocus();
	}
	static adjustSizeToggle() {
		if (tree.focus instanceof LostNode)
			Edit.adjustLostSizeToggle();
		else (tree.focus instanceof BlankNode)
			Edit.adjustBlankSizeToggle();
	}
	static redrawFocus() {
		tree.focus.redrawToRoot();
		const rootIndex = tree.getFocusIndex();
		preview.update();
	}
	static setEnclosureType(type) {
		if (type == 'walled') {
			$('13258').classList.add('hidden');
			$('13259').classList.add('hidden');
			$('1325A').classList.add('hidden');
			$('13286').classList.remove('hidden');
			$('13288').classList.remove('hidden');
			$('13379').classList.add('hidden');
			$('1342F').classList.add('hidden');
			$('1325B').classList.add('hidden');
			$('1325C').classList.add('hidden');
			$('1325D').classList.add('hidden');
			$('13282').classList.add('hidden');
			$('13287').classList.remove('hidden');
			$('13289').classList.remove('hidden');
			$('1337A').classList.add('hidden');
			$('1337B').classList.add('hidden');
		} else {
			$('13258').classList.remove('hidden');
			$('13259').classList.remove('hidden');
			$('1325A').classList.remove('hidden');
			$('13286').classList.add('hidden');
			$('13288').classList.add('hidden');
			$('13379').classList.remove('hidden');
			$('1342F').classList.remove('hidden');
			$('1325B').classList.remove('hidden');
			$('1325C').classList.remove('hidden');
			$('1325D').classList.remove('hidden');
			$('13282').classList.remove('hidden');
			$('13287').classList.add('hidden');
			$('13289').classList.add('hidden');
			$('1337A').classList.remove('hidden');
			$('1337B').classList.remove('hidden');
		}
	}
	static processKeyDown(e) {
		switch (e.keyCode) {
			case 35: tree.moveEnd(); break; // End
			case 36: tree.moveStart(); break; // Home
			case 37: tree.moveLeft(); break; // left
			case 38: tree.moveUp(); break; // up
			case 39: tree.moveRight(); break; // right
			case 40: tree.moveDown(); break; // down
			case 46: Edit.doDelete(); break; // delete
			default: return;
		}
		e.preventDefault();
	}
	static processKeyPress(e) {
		switch (String.fromCharCode(e.charCode)) {
			case 'l': Edit.doLiteral(); break;
			case 's': Edit.doSingleton(); break;
			case 'b': Edit.doBlank(); break;
			case 'o': Edit.doLost(); break;
			case 'a': Edit.doAppend(); break;
			case '-': Edit.doAppend(); break;
			case 'p': Edit.doPrepend(); break;
			case '*': Edit.doStar(); break;
			case '+': Edit.doPlus(); break;
			case ':': Edit.doColon(); break;
			case ';': Edit.doSemicolon(); break;
			case '[': Edit.doBracketOpen(); break;
			case ']': Edit.doBracketClose(); break;
			case 'v': Edit.doOverlay(); break;
			case 'i': Edit.doInsert(); break;
			case 'e': Edit.doEnclosure(); break;
			case 'w': Edit.doSwap(); break;
			case 'u': Edit.doMenu(); break;
			case ' ': Edit.doNameFocus(); break;
			case 'd': Edit.adjustDamageToggle(); break;
			case 'm': Edit.adjustMirrorToggle(); break;
			case 'r': Edit.adjustRotateNext(); break;
			case 'c': Edit.adjustPlaceNext(); break;
			case 'x': Edit.adjustExpandToggle(); break;
			case 'z': Edit.adjustSizeToggle(); break;
			default: return;
		}
		e.preventDefault();
	}
	static charToHex(c) {
		return '&#x' + c.codePointAt(0).toString(16) + ';';
	}
	static hexToChar(match, str) {
		return String.fromCharCode(parseInt(str, 16));
	}
	static decToChar(match, str) {
		return String.fromCharCode(parseInt(str));
	}
	static stringToHex(str) {
		return [...str].map(Edit.charToHex).join('');
	}
	static hexToString(str) {
		str = str.replace(/\s/g, '');
		str = str.replace(/&#x([a-f0-9]+);/g, Edit.hexToChar);
		str = str.replace(/&#([0-9]+);/g, Edit.decToChar);
		return str;
	}
}

class SignMenu {
	constructor() {
		this.catLinks = {};
		this.catSecs = {};
		this.panel = $('cats-panel');
		this.menu = $('cats-menu');
		this.extraMenu = $('cats-extra-menu');
		this.sections = $('cat-sections');
		this.chosen = $('chosen-sign');
		this.info = $('sign-info');
		this.infoButton = $('sign-info-button');
		for (const cat in uniHiero.catToTexts)
			this.makeCatMenu(this.menu, cat, uniHiero.catToTexts[cat]);
		for (const shape in uniGlyphsByShape)
			this.makeCatMenu(this.extraMenu, shape, uniGlyphsByShape[shape]);
		this.makeTransliterationMenu(this.extraMenu);
		const signMenu = this;
		this.panel.addEventListener('keydown', function(e) { signMenu.processMenuKey(e); }, false);
		this.showCat('A');
		this.hide();
		this.hideInfo();
	}
	makeCatMenu(menu, cat, texts) {
		const signMenu = this;
		const c = cat;
		const tab = document.createElement('li');
		const link = document.createElement('a');
		const text = document.createTextNode(cat);
		link.setAttribute('href', '#');
		link.appendChild(text);
		link.addEventListener('click', function(e) { e.preventDefault(); signMenu.showCat(c); });
		link.addEventListener('mouseover', function(e) { signMenu.processSignInfo('', link); });
		this.catLinks[cat] = link;
		tab.appendChild(link);
		menu.appendChild(tab);

		const section = document.createElement('div');
		section.className = 'cat-section';
		this.fillCatSection(section, texts);
		this.catSecs[cat] = section;
		this.sections.appendChild(section);
	}
	fillCatSection(section, texts) {
		for (const text of texts) {
			const signLink = document.createElement('a');
			const sign = document.createElement('div');
			const glyph = document.createElement('span');
			const label = document.createElement('span');
			signLink.className = 'sign-button-link';
			signLink.setAttribute('href', '#');
			signLink.appendChild(sign);
			sign.className = 'sign-button';
			sign.appendChild(glyph);
			glyph.className = 'sign-button-hi';
			const codepoint = uniGlyphs[text];
			glyph.innerHTML = String.fromCodePoint(codepoint);
			sign.appendChild(label);
			label.className = 'sign-button-label';
			label.innerHTML = text;
			signLink.addEventListener('mouseover',
				function(e) { signMenu.processSignInfo(text, glyph); });
			signLink.addEventListener('click',
				function(e) { e.preventDefault(); signMenu.chooseSign(text); });
			section.appendChild(signLink);
		}
	}
	makeTransliterationMenu(menu) {
		const tab = document.createElement('li');
		const link = document.createElement('a');
		const text = document.createTextNode('transliteration');
		link.setAttribute('href', '#');
		link.appendChild(text);
		link.addEventListener('click', function(e) { e.preventDefault(); signMenu.showCat('transliteration'); });
		link.addEventListener('mouseover', function(e) { signMenu.processSignInfo('', link); });
		this.catLinks['transliteration'] = link;
		tab.appendChild(link);
		menu.appendChild(tab);

		const section = $('transliteration-section');
		this.catSecs['transliteration'] = section;
		this.sections.appendChild(section);
	}
	show() {
		this.panel.classList.remove('hidden');
		this.panel.focus();
		const name = $('name-text').value;
		const parts = uniNameStructure.exec(name);
		if (parts)
			this.showCat(parts[1]);
	}
	hide() {
		this.panel.classList.add('hidden');
		if ($('name-text').value != '')
			Tree.focus();
		else
			Edit.doNameFocus();
	}
	showCat(cat) {
		for (const other of uniCategoriesAndShapes.concat('transliteration'))
			if (other === cat) {
				this.catLinks[other].classList.add('selected');
				this.catSecs[other].classList.remove('hidden');
			} else {
				this.catLinks[other].classList.remove('selected');
				this.catSecs[other].classList.add('hidden');
			}
		this.chosen.value = uniCategories.includes(cat) ? cat : '';
		if (cat == 'transliteration')
			removeChildren($('transliteration-section'));
	}
	shownCat() {
		for (const cat of uniCategoriesAndShapes.concat('transliteration'))
			if (this.catLinks[cat].classList.contains('selected'))
				return cat;
		return '';
	}
	showCatLeft() {
		const cat = this.shownCat();
		var i = uniCategories.indexOf(cat);
		if (i == 0) {
			return;
		} else if (i > 0) {
			this.showCat(uniCategories[i-1]);
		} else if (cat == 'transliteration') {
			this.showCat(uniShapes[uniShapes.length-1]);
		} else {
			i = uniShapes.indexOf(cat);
			if (i >= 1)
				this.showCat(uniShapes[i-1]);
		}
	}
	showCatRight() {
		const cat = this.shownCat();
		var i = uniCategories.indexOf(cat);
		if (i == uniCategories.length-1) {
			return;
		} else if (i >= 0) {
			this.showCat(uniCategories[i+1]);
		} else {
			i = uniShapes.indexOf(cat);
			if (i == uniShapes.length-1)
				this.showCat('transliteration');
			else if (i >= 0 && i < uniShapes.length-1)
				this.showCat(uniShapes[i+1]);
		}
	}
	showCatUp() {
		const cat = this.shownCat();
		const i = uniShapes.indexOf(cat);
		if (i >= 0)
			return;
		else
			this.showCat(uniShapes[0])
	}
	showCatDown() {
		const cat = this.shownCat();
		const i = uniCategories.indexOf(cat);
		if (i >= 0)
			return;
		else
			this.showCat(uniCategories[0]);
	}
	backspaceSign() {
		this.chosen.value.length > 0;
		this.chosen.value = this.chosen.value.substring(0, this.chosen.value.length-1);
	}
	chooseTypedSign() {
		if (this.chosen.value in uniGlyphs)
			this.chooseSign(this.chosen.value);
	}
	chooseSign(name) {
		$('name-text').value = name;
		this.hide();
		Edit.adjustName();
	}
	showInfo() {
		this.info.classList.remove('hidden');
		this.infoButton.classList.remove('inactive');
		this.infoButton.innerHTML = 'info';
	}
	hideInfo() {
		this.info.classList.add('hidden');
		this.infoButton.classList.add('inactive');
		this.infoButton.innerHTML = '<del>info</del>';
	}
	toggleInfo() {
		if (this.info.classList.contains('hidden'))
			this.showInfo();
		else
			this.hideInfo();
	}
	processSignInfo(name, elem) {
		if (this.panel.classList.contains('hidden') || this.info.classList.contains('hidden'))
			return;
		var menuX = this.panel.offsetWidth / 2;
		var linkX = elem.offsetLeft + elem.offsetWidth / 2;
		if (linkX > menuX)
			this.info.style.left = '3%';
		else
			this.info.style.left = '55%';
		if (name == '') {
			this.info.innerHTML = '';
		} else {
			var text = hierojax.uniInfo[name];
			if (text !== undefined) {
				text = text.replace('&amp;', '&');
				this.info.innerHTML = text;
				hierojax.processFragmentsIn(this.info);
				SignMenu.mapTransIn(this.info);
			}
		}
	}
	static mapTransIn(elem) {
		const spans = elem.getElementsByTagName("span");
		for (let span of spans)
			if (span.classList.contains('egytransl')) {
				const trans = span.firstChild.nodeValue;
				span.innerHTML = SignMenu.mapTrans(trans);
			}
	}
	static mapTrans(trans) {
		var uni = '';
		for (let j = 0; j < trans.length; j++)
			if (trans[j] === '^' && j < trans.length-1) {
				j++;
				uni += SignMenu.transUnicode(trans[j], true);
			} else {
				uni += SignMenu.transUnicode(trans[j], false);
			}
		return uni;
	}
	static transUnicode(c, upper) {
		switch (c) {
			case 'A': return upper ? "\uA722" : "\uA723";
			case 'j': return upper ? "J" : "j";
			case 'i': return upper ? "I\u0313" : "i\u0313";
			case 'y': return upper ? "Y" : "y";
			case 'a': return upper ? "\uA724" : "\uA725";
			case 'w': return upper ? "W" : "w";
			case 'b': return upper ? "B" : "b";
			case 'p': return upper ? "P" : "p";
			case 'f': return upper ? "F" : "f";
			case 'm': return upper ? "M" : "m";
			case 'n': return upper ? "N" : "n";
			case 'r': return upper ? "R" : "r";
			case 'l': return upper ? "L" : "l";
			case 'h': return upper ? "H" : "h";
			case 'H': return upper ? "\u1E24" : "\u1E25";
			case 'x': return upper ? "\u1E2A" : "\u1E2B";
			case 'X': return upper ? "H\u0331" : "\u1E96";
			case 'z': return upper ? "Z" : "z";
			case 's': return upper ? "S" : "s";
			case 'S': return upper ? "\u0160" : "\u0161";
			case 'q': return upper ? "Q" : "q";
			case 'K': return upper ? "\u1E32" : "\u1E33";
			case 'k': return upper ? "K" : "k";
			case 'g': return upper ? "G" : "g";
			case 't': return upper ? "T" : "t";
			case 'T': return upper ? "\u1E6E" : "\u1E6F";
			case 'd': return upper ? "D" : "d";
			case 'D': return upper ? "\u1E0E" : "\u1E0F";
			default: return c;
		}
	}
	processMenuKey(e) {	
		if (this.tryProcessMenuKey(e))
			e.preventDefault();
	}
	tryProcessMenuKey(e) {
		var c = e.keyCode;
		switch (c) {
			case 13: this.chooseTypedSign(); return true; // enter
			case 27: this.hide(); return true; // escape
			case 32: this.toggleInfo(); return true; // space
			case 37: this.showCatLeft(); return true; // left
			case 38: this.showCatUp(); return true; // up
			case 39: this.showCatRight(); return true; // right
			case 40: this.showCatDown(); return true; // down
			case 191: {
				if (this.shownCat() == 'transliteration')
					this.showCat('A');
				else
					this.showCat('transliteration');
				return true; // ?
			}
		}
		if (this.shownCat() == 'transliteration')
			return this.addTransChar(e);
		if (c == 8) { // backspace
			this.backspaceSign();
			return true;
		}
		c = String.fromCharCode(c);
		if (/^[A-Z]$/.test(c)) {
			if (this.chosen.value == 'N' && /^[LU]$/.test(c))
				this.showCat('N' + c);
			else if (this.chosen.value == 'A' && c == 'A')
				this.showCat('Aa');
			else if (/^([A-IK-Z]?|NL|NU|Aa)$/.test(this.chosen.value) && /^[A-IK-Z]$/.test(c))
				this.showCat(c);
			else if (/^[a-zA-Z]+[0-9]+$/.test(this.chosen.value))
				this.chosen.value = this.chosen.value + c.toLowerCase();
			return true;
		} else if (/^[0-9]$/.test(c)) {
			if (/^[a-zA-Z]+[0-9]*$/.test(this.chosen.value))
				this.chosen.value = this.chosen.value + c;
			return true;
		}
		return false;
	}
	addTransChar(e) {
		var c = e.key;
		if (e.keyCode == 8) {
			this.chosen.value = this.chosen.value.replace(/.$/, '');
			this.filterTransliteration();
			return true;
		} else if ('AjiyawbpfmnrlhHxXzsSqKkgtTdD'.includes(c)) {
			if (c == 'i')
				c = 'j';
			else if (c == 'z')
				c = 's';
			else if (c == 'K')
				c = 'q';
			this.chosen.value = this.chosen.value + SignMenu.transUnicode(c, false);
			this.filterTransliteration();
			return true;
		}
		return false;
	}
	filterTransliteration() {
		removeChildren($('transliteration-section'));
		var signs = [];
		for (const cat in uniHiero.catToTexts)
			for (const sign of uniHiero.catToTexts[cat])
				if (this.infoHasTranslit(sign, this.chosen.value)) {
					signs.push(sign);
				}
		this.fillCatSection($('transliteration-section'), signs);
	}
	infoHasTranslit(name, trans) {
		const info = hierojax.uniInfo[name];
		if (info) {
			const transs = this.extractInfoTranslit(name);
			return transs.indexOf(trans) >= 0;
		} else {
			return false;
		}
	}
	extractInfoTranslit(name) {
		const info = hierojax.uniInfo[name];
		if (info) {
			return [... info.matchAll(/<span class="egytransl">\^?([a-zA-Z]+)<\/span>/g)]
				.map(m => SignMenu.mapTrans(m[1]));
		} else {
			return [];
		}
	}
}
var signMenu = null;

class Embedded {
	constructor() {
		const query = window.location.search.substring(1);
		const pair = query.split('=');
		if (pair.length > 1) {
			const hiero = decodeURIComponent(pair[1]);
			Edit.make(hiero, [0]);
		} else {
			$('embedded').classList.add('hidden');
		}
	}
	save() {
		if (window.opener) {
			window.opener.saveEncoding(tree.toString());
			window.close();
		}
	}
	cancel() {
		if (window.opener) {
			window.opener.cancelEncoding();
			window.close();
		}
	}
};
var embedded = null;

window.addEventListener('DOMContentLoaded', () => {
	editHistory = new EditHistory();
	preview = new Preview();
	tree = new Tree();
	signMenu = new SignMenu();
	Edit.make(Shapes.PLACEHOLDER, [0]);
	Edit.doNameFocus();
	embedded = new Embedded();
});
