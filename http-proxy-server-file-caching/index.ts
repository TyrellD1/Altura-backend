import { FileCache } from "./file-based-caching/FileCache";
import * as http from 'http';
import * as net from 'net';
import * as zlib from 'zlib';
import { URL } from 'url';

const cache = new FileCache('file-based-caching/cache');

const createCacheKey = (url: string) => {
    // replace / with _ to avoid creating subdirectories
    return url.replace(/\//g, '_');
}

/*
Does handle multiple concurrent requests.
Can scale horizontally (clustering, load balancer, etc.) if needed.
*/
const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
    if (!req.url) {
        res.writeHead(400);
        res.end('Bad Request');
        return;
    }

    const isHttps = req.url.startsWith('https://');

    const url = new URL(req.url);

    if (req.method === 'GET') {
        const cacheKey = createCacheKey(url.toString());

        const cachedData = cache.get(cacheKey);

        if (cachedData) {
            const data = Buffer.isBuffer(cachedData) ? cachedData : Buffer.from(cachedData)

            zlib.gunzip(data, (err, decompressedBuffer) => {
                if (err) {
                    console.error('Error decompressing:', err);
                    res.writeHead(500);
                    res.end('Internal server error');
                    return;
                }

                console.log(`Serving ${url} from cache`)
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(decompressedBuffer);
                return;
            });
            return;
        }
    }

    const options: http.RequestOptions = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: req.method,
        headers: req.headers
    };

    const proxyRequest = http.request(options, (proxyRes: http.IncomingMessage) => {
        if (req.method === 'GET') {            
            let body: Buffer[] = []; // Array to hold Buffer chunks
            proxyRes.on('data', (chunk: Buffer) => {
                body.push(chunk); // Collect chunks
            });
            proxyRes.on('end', () => {
                const responseBody = Buffer.concat(body);

                // Cache the response
                const cacheKey = createCacheKey(url.toString());
                cache.set(cacheKey, responseBody, 3600 * 1000); // Cache for 1 hour

                res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
                res.end(responseBody);
            });
        } else {
            res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
            proxyRes.pipe(res);
        }
    });

    proxyRequest.on('error', (error: Error) => {
        console.error('Proxy request error:', error);
        res.writeHead(500);
        res.end('Internal server error');
    });

    req.pipe(proxyRequest);
});

/*
Only caching http get requests.
Caching https violates security as far as I understand.
*/
server.on('connect', (req: http.IncomingMessage, clientSocket: net.Socket, head: Buffer) => {
    const url = new URL(`http://${req.url}`);
    const hostname = url.hostname;
    const port = parseInt(url.port) || 443; // Default HTTPS port = 443

    const serverSocket = net.connect(port, hostname, () => {
        clientSocket.write('HTTP/1.1 200 Connection Established\r\n' +
            'Proxy-agent: Node.js-Proxy\r\n' +
            '\r\n');
        serverSocket.write(head);
        serverSocket.pipe(clientSocket);
        clientSocket.pipe(serverSocket);
    });


    serverSocket.on('error', (error) => {
        console.error('Server Socket Error:', error);
        clientSocket.end('HTTP/1.1 500 Internal Server Error\r\n');
    });


    clientSocket.on('error', (error) => {
        console.error('Client Socket Error:', error);
        serverSocket.end();
    });
});


server.listen(8080, () => {
    console.log('Proxy server listening on port 8080');
});


