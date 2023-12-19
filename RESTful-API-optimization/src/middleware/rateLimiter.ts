/*
Simple implementation
Could track when each request is made
Then wouldn't need complete reset every 30 seconds
This is easier on memory - would need to weigh tradeoffs
*/

import { Request, Response } from "express";

const rateLimitWindowMs = 30 * 1000; // 30 seconds
const maxRequestsPerWindow = 30; // Max number of requests per IP during window
/**
 * IP address -> { count: number, timerId: NodeJS.Timeout }
 */
const requestCounts = new Map<string, { count: number, timerId: NodeJS.Timeout }>();

const rateLimiter = (req: Request, res: Response, next: () => void) => {
    const ip = req.ip;
    if (!ip) {
        res.status(400).send('Bad Request');
        return;
    }
    const requestInfo = requestCounts.get(ip);

    if (!requestInfo) {
        // Set a timer to reset the count for this IP
        const timerId = setTimeout(() => requestCounts.delete(ip), rateLimitWindowMs);
        requestCounts.set(ip, { count: 1, timerId });
        next();
    } else if (requestInfo.count >= maxRequestsPerWindow) {
        // Could ban IP here after x offenses.
        res.status(429).send('Too many requests, please try again later.');
    } else {
        requestInfo.count += 1;
        next();
    }
}

export default rateLimiter;