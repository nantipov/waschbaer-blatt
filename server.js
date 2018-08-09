const express = require('express');
var webpack = require('webpack');
var webpackDevMiddleware = require('webpack-dev-middleware');
var webpackHotMiddleware = require('webpack-hot-middleware');
var webPackConfig = require('./webpack.config');
var fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 9002;

var compiler = webpack(webPackConfig);


app.get('/api/events', (req, res) => {
    const baseUrl = 'http://localhost:9001/api/events';
    let parameters = {};
    if (!(req.query.start_time === 'null')) {
        parameters.start_time = new Date(+req.query.start_time).toISOString()
    }
    if (!(req.query.end_time === 'null')) {
        parameters.end_time = new Date(+req.query.end_time).toISOString()
    }
    fetch(
        buildUrl(baseUrl, parameters))
        .then(baum_resp => baum_resp.json())
        .then(json => res.send(json));
});

app.post('/api/actions', (req, res) => {
    const baseUrl = 'http://localhost:9001/api/actions';
    fetch(
        baseUrl, {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                type: "POUR"
            })
        })
        .then(baum_resp => baum_resp.status)
        .then(status => res.status(status).send());
});

app.use(webpackDevMiddleware(compiler));
app.use(webpackHotMiddleware(compiler));

app.listen(port, () => console.log(`Listening on port ${port}`));


function buildUrl(url, parameters) {
    let qs = "";
    for (const key in parameters) {
        if (parameters.hasOwnProperty(key)) {
            const value = parameters[key];
            qs +=
                encodeURIComponent(key) + "=" + encodeURIComponent(value) + "&";
        }
    }
    if (qs.length > 0) {
        qs = qs.substring(0, qs.length - 1); //chop off last "&"
        url = url + "?" + qs;
    }
    return url;
}
