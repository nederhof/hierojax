function printed(ch, rot) {
	const hiero = document.createElement('span');
	hiero.className = 'hierojax';
	hiero.style.setProperty('font-size', '36px');
	const vs = rot ? Group.numToVariation(Group.rotateToNum(Number(rot))) : '';
	hiero.innerText = ch + vs;
	return hiero;
}

function printRotation(ch) {
	const rotations = Shapes.rotations[ch];
	const li = document.createElement('li');
	const span = document.createElement('span');
	span.innerHTML = '0x' + ch.codePointAt(0).toString(16).toUpperCase();
	li.appendChild(span);
	li.appendChild(printed(ch, 0));
	for (let rot in rotations) {
		const diff = rotations[rot];
		const im = document.createElement('img');
		im.setAttribute('src', 'rotation' + rot + '.svg');
		li.appendChild(im);
		if (diff != 0) {
			const spanDiff = document.createElement('span');
			spanDiff.className = 'diff';
			spanDiff.innerHTML = (diff > 0 ? '+' : '') + diff;
			li.appendChild(spanDiff);
		}
		li.appendChild(printed(ch, rot));
	}
	$('signs').appendChild(li);
}

function printRotations() {
	const signs = Object.keys(Shapes.rotations).sort();
	signs.forEach(s => printRotation(s));
}

window.addEventListener("DOMContentLoaded", () => { 
	printRotations(); 
	hierojax.processFragments(); 
});
