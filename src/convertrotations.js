function objToHex(obj) {
	var objHex = {};
	for (const key in obj) {
		const hexKey = charToHexString(key);
		objHex[hexKey] = obj[key];
	}
	return JSON.stringify(objHex, null, 2);
}

console.log(objToHex(Shapes.rotations));
