'use strict';

const path = require('path');
const fs = require('fs');
const config = require('config');
const utils = require('./utils');
const view = require('../lib/view');
const dot = require('dot-object');
const extend = require('extend');
const express = require('express');
const router = express.Router({
	caseSensitive: false,
	strict: false,
});
const isProduction = config.get('server.production');
const isOffline = config.get('nitro.mode.offline');
const useMinifiedAssets = config.get('nitro.mode.minified');

/**
 * static routes
 */
router.use('/', express.static(config.get('nitro.basePath') + '/public/'));

/**
 * views
 */
function getView(req, res, next) {
	const tpl = req.params.view ? req.params.view.toLowerCase() : 'index';
	const data = {
		pageTitle: tpl,
		_layout: config.get('nitro.defaultLayout'),
		_production: isProduction,
		_offline: isOffline,
		_minified: useMinifiedAssets,
	};
	const viewPathes = view.getViewCombinations(tpl);
	let rendered = false;

	viewPathes.forEach((viewPath) => {
		if (!rendered) {
			const tplPath = path.join(
				config.get('nitro.basePath'),
				config.get('nitro.viewDirectory'),
				'/',
				`${viewPath}.${config.get('nitro.viewFileExtension')}`
			);

			if (fs.existsSync(tplPath)) {

				// collect data
				const dataPath = path.join(
					config.get('nitro.basePath'),
					config.get('nitro.viewDataDirectory'),
					'/',
					`${viewPath}.json`
				);
				const customDataPath = req.query._data ? path.join(
					config.get('nitro.basePath'),
					config.get('nitro.viewDataDirectory'),
					`/${req.query._data}.json`
				) : false;

				if (customDataPath && fs.existsSync(customDataPath)) {
					extend(true, data, JSON.parse(fs.readFileSync(customDataPath, 'utf8')));
				} else if (fs.existsSync(dataPath)) {
					extend(true, data, JSON.parse(fs.readFileSync(dataPath, 'utf8')));
				}

				// handle query string parameters
				if (Object.keys(req.query).length !== 0) {
					const reqQuery = JSON.parse(JSON.stringify(req.query)); // simple clone
					dot.object(reqQuery);
					extend(true, data, reqQuery);
					data._query = reqQuery; // save query for use in patterns
				}

				// layout handling
				if (data._layout) {
					if (utils.layoutExists(data._layout)) {
						data.layout = utils.getLayoutPath(data._layout);
					} else if (utils.layoutExists(config.get('nitro.defaultLayout'))) {
						data.layout = utils.getLayoutPath(config.get('nitro.defaultLayout'));
					}
				}

				// locals
				extend(true, data, res.locals);
				res.locals = data;

				// render
				res.render(tplPath);
				rendered = true;
			}
		}
	});

	if (!rendered) {
		next();
	}
}
router.get('/', getView);
router.get('/:view', getView);

/**
 * everything else gets a 404
 */
router.use((req, res) => {
	res.locals.pageTitle = '404 - Not Found';
	res.locals._production = isProduction;
	res.locals._offline = isOffline;
	res.locals._minified = useMinifiedAssets;
	if (utils.layoutExists(config.get('nitro.defaultLayout'))) {
		res.locals.layout = utils.getLayoutPath(config.get('nitro.defaultLayout'));
	}
	res.status(404);
	res.render('404', (err, html) => {
		if (err) {
			res.send('404 - Not Found');
		}
		res.send(html);
	});
});

module.exports = router;
