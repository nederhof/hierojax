function glyphValToHex(obj) {
	var objHex = {};
	for (const key in obj) {
		if (key == "glyph")
			objHex["ch"] = charToHexString(obj[key]);
		else
			objHex[key] = obj[key];
	}
	return objHex;
}

function objToHex(obj) {
	var objHex = {};
	for (const key in obj) {
		const hexKey = charToHexString(key);
		objHex[hexKey] = obj[key].map(glyphValToHex);
	}
	return JSON.stringify(objHex, null, 2);
}

console.log(objToHex(Shapes.insertions));
