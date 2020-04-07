import program from 'commander';
import http from 'http';
import httpProxy from 'http-proxy';

program
  .option('-p, --port <port>', 'port number to listen on', parseInt, 3000)
  .option('-t, --target <url>', 'target server url', 'https://trailhead.salesforce.com/en/home')
  .parse(process.argv);

const { port, target } = program;
const proxy = httpProxy.createProxyServer({});

proxy.on('proxyReq', (proxyReq, req, res) => {
    // This only works if you're adding new headers.
    // Rewriting or removing existing headers doesn't work here.
    res.setHeader('x-foo', 'bar');
});

http.createServer((req, res) => {
    // Save original writeHead method.
    const { writeHead: origWriteHead } = res;

    // Override res.writeHead with custom logic that manipulates headers.
    res.writeHead = (...args) => {
        // Rewrite or remove headers here.
        res.removeHeader('content-security-policy');
        res.removeHeader('x-frame-options');

        // Invoke original method.
        origWriteHead.call(res, ...args);
    };

    proxy.web(req, res, { target, changeOrigin: true });
}).listen(port);




