import webpack from 'webpack';
import webpackConfig from '../build/webpack.config';
import _debug from 'debug';
import config from '../config';
import express from 'express';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import bodyParser from 'body-parser';
import fs from 'fs';

const debug = _debug('app:server');
const paths = config.utils_paths;
const DEV = config.env === 'development';
const app = express();

const infoDataPath = DEV ? paths.base('infoData.json') : paths.dist('infoData.json');
const staticPath = DEV ? paths.src('static') : paths.dist();

app.use(bodyParser.json());

if (DEV) {
	debug('Server is running in development environment');

	const compiler = webpack(webpackConfig);
	const {publicPath} = webpackConfig.output;

	app.use(webpackDevMiddleware(compiler, {
		publicPath,
		contentBase: paths.src(),
		hot: true,
		quiet: config.compiler_quiet,
		noInfo: config.compiler_quiet,
		lazy: false,
		stats: config.compiler_stats
	}));
	app.use(webpackHotMiddleware(compiler));

	app.get('/infoData.json', (req, res) => {
		res.sendFile(paths.base('infoData.json'));
	});
} else {
	debug('Server is running in production environment');
}

app.use(express.static(staticPath));

app.post('/infoData.json', (req, res) => {
	let {tabIndex, rowIndex, newData, newRow} = req.body;
	let json = JSON.parse(fs.readFileSync(infoDataPath));

	if (!newData && !newRow && tabIndex !== 0) {
		json.tabs[tabIndex].data.splice(rowIndex, 1);
	} else if (newRow) {
		json.tabs[tabIndex].data.push('');
	} else {
		json.tabs[tabIndex].data[rowIndex] = newData;
	}

	fs.writeFile(infoDataPath, JSON.stringify(json), (data, err) => {
		if (err) {
			res.error(err);
		}

		res.status(200).json(json);
	});
});

export default app;
