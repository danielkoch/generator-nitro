'use strict';

const fs = require('fs');
const path = require('path');
const config = require('config');

function getLayoutPath(layoutName) {
	const layoutPath = `${config.get('nitro.viewLayoutsDirectory').replace(config.get('nitro.viewDirectory') + '/', '')}/${layoutName}`;
	return layoutPath;
}

function layoutExists(layoutName) {
	const layoutPath = path.join(
		config.get('nitro.basePath'),
		config.get('nitro.viewLayoutsDirectory'),
		`/${layoutName}.${config.get('nitro.viewFileExtension')}`
	);
	return fs.existsSync(layoutPath);
}

module.exports = {
	getLayoutPath,
	layoutExists,
};
