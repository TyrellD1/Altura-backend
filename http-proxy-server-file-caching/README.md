## Setup

Install node packages
```bash
npm install
```

## Run Server

```bash
npm run start
```

## File-based caching system requirements

### File I/O performance

In-memory cache for better I/O performance. See 

[/file-based-caching/FileCache.ts](file-based-caching/FileCache.ts)

Line 13

### Concurrency issues

Implemented atomic writes. See

[/file-based-caching/FileCache.ts](file-based-caching/FileCache.ts)

Line 81

## http proxy server requirements

### Configuration options for the target server's host, port, and protocol.

Dynamically pulls host, port and protocol from url. As far as I understand this implimentation satisfies requirements. Open to feedback.

### Support for handling multiple concurrent requests.

Does handle multiple concurrent requests.
Can scale horizontally (clustering, load balancer, etc.) if needed.

### Implement caching for GET requests using the file-based caching system developed in Task 1.

Does cache http requests using file-based caching system developed in tasked one.

Not caching https requests as that violates security as far as I understand.