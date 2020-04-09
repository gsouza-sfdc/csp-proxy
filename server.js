import program from 'commander';
import fs from 'fs';
import http from 'http';
import https from 'https'
import httpProxy from 'http-proxy';

program
    .option('-c, --cert <cert>', 'path to cert', 'cert.pem')
    .option('-d, --debug', 'output debugging info')
    .option('-k, --key <key>', 'path to cert key', 'key.pem')
    .option('-p, --port <port>', 'port number to listen on', (val) => parseInt(val), 3000)
    .option('-s, --ssl', 'use use https', false)
    .option('-t, --target <url>', 'target server url', 'https://trailhead.salesforce.com')
    .parse(process.argv);

const { cert, debug, key, port, ssl, target } = program;

if (debug) {
    console.log('csp-proxy started with the following options:\n', program.opts());
}

let options = {};
let protocol = null;

if (ssl) {
    protocol = https;
    Object.assign(options, {
        key: fs.readFileSync(key),
        cert: fs.readFileSync(cert)
    });
} else {
    protocol = http;
}

const proxy = httpProxy.createProxyServer({});

proxy.on('proxyReq', (proxyReq, req, res) => {
    // This only works if you're adding new headers.
    // Rewriting or removing existing headers doesn't work here.
    res.setHeader('x-forwarded-by', 'csp-proxy');
});

protocol['createServer'](options, (req, res) => {
    // Save original writeHead method.
    const { writeHead: origWriteHead } = res;

    // Override res.writeHead with custom logic that manipulates headers.
    res.writeHead = (...args) => {
        // Rewrite or remove headers that prevent loading the target url in an iframe.
        res.setHeader('content-security-policy', 'frame-src *.force.com;');
        res.removeHeader('x-frame-options');

        // Invoke original method.
        origWriteHead.call(res, ...args);
    };

    proxy.web(req, res, { target, changeOrigin: true });
}).listen(port);




