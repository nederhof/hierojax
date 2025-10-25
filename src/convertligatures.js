function fieldToHex(obj) {
	var objHex = {};
	for (const key in obj) {
		if (key == "ch")
			objHex[key] = charToHexString(obj[key]);
		else
			objHex[key] = obj[key];
	}
	return objHex;
}

function fieldsToHex(obj) {
	var objHex = {};
	for (const key in obj) {
		if (key == "horizontal" || key == "vertical")
			objHex[key] = obj[key].map(fieldToHex);
		else
			objHex[key] = obj[key];
	}
	return objHex;
}

function objToHex(obj) {
	var objHex = {};
	for (const key in obj) {
		const hexKey = charToHexString(key);
		objHex[hexKey] = fieldsToHex(obj[key]);
	}
	return JSON.stringify(objHex, null, 2);
}

console.log(objToHex(Shapes.ligatures));
