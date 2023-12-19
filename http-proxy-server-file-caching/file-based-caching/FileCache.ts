import * as fs from 'fs';
import * as path from 'path';
import { MinHeap } from './MinHeap';

type CacheEntry = {
    value: any;
    expiresAt: number;
};

class FileCache {
    private cacheDir: string;
    /*
    In-memory cache for better I/O performance.
    Would implement LRU cache for memory efficiency.
    */
    private memoryCache: Map<string, CacheEntry> = new Map();
    private expirationHeap: MinHeap;
    private cleanupInterval: NodeJS.Timeout;

    constructor(cacheDir: string) {
        this.cacheDir = cacheDir;
        this.memoryCache = new Map();
        this.expirationHeap = new MinHeap();
        fs.mkdirSync(cacheDir, { recursive: true });
        this.rebuildHeapFromPersistentStorage();
        this.cleanupInterval = setInterval(() => this.cleanupExpired(), 5000);
    }

    private rebuildHeapFromPersistentStorage(): void {
        fs.readdir(this.cacheDir, (err, files) => {
            if (err) {
                console.error('Error reading cache directory during heap rebuild:', err);
                return;
            }

            files.forEach(file => {
                const filePath = path.join(this.cacheDir, file);                
                // Some envs create ._ files for all files.
                // If sure environment won't, remove below line.
                if (filePath.includes('._')) return;
                fs.readFile(filePath, 'utf8', (readErr, data) => {
                    if (readErr) {
                        console.error(`Error reading file ${file} during heap rebuild:`, readErr);
                        return;
                    }

                    try {
                        const cacheEntry: CacheEntry = JSON.parse(data);
                        // assumes one . in filename
                        const key = file.split('.')[0]
                        if (cacheEntry.expiresAt > Date.now()) {
                            // Only add entries that haven't expired yet
                            this.expirationHeap.insert({ key, expiresAt: cacheEntry.expiresAt });
                        } else {
                            this.delete(key);
                        }
                    } catch (parseErr) {
                        console.error(`Error parsing file ${file} during heap rebuild:`, parseErr);
                    }
                });
            });
        });
    }

    private getFilePath(key: string): string {
        return path.join(this.cacheDir, `${key}.json`);
    }

    private getTempFilePath(key: string): string {
        return path.join(this.cacheDir, `${key}.tmp`);
    }

    set(key: string, value: any, ttl: number): void {
        const filePath = this.getFilePath(key);
        const tempFilePath = this.getTempFilePath(key);
        const data: CacheEntry = { value, expiresAt: Date.now() + ttl };

        this.memoryCache.set(key, data);
        this.expirationHeap.insert({ key, expiresAt: data.expiresAt });
        /*
        Atomic writes for concurrency.

        Could take further steps if planned to recieve two set requests
        for same key at same time. Like queueing requests by key.
        That way 0 chance of an earlier request overwriting a later one.
        */
        fs.writeFile(tempFilePath, JSON.stringify(data), (err) => {
            if (err) {
                console.error('Error writing temp file:', err);
                return;
            }
            fs.rename(tempFilePath, filePath, (err) => {
                if (err) console.error('Error renaming file:', err);
            });
        });
    }

    get(key: string): any {
        // Could reset expiration time when retrieved
        const inMemoryEntry = this.memoryCache.get(key);
        if (inMemoryEntry && inMemoryEntry.expiresAt > Date.now()) {
            return inMemoryEntry.value;
        }

        if(inMemoryEntry && inMemoryEntry.expiresAt < Date.now()) {
            this.delete(key);
            return null;
        }

        // Fallback to file system if not in memory
        const filePath = this.getFilePath(key);
        try {
            const fileEntry: CacheEntry = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (fileEntry.expiresAt > Date.now()) {
                // if not in memory, add to memory
                this.memoryCache.set(key, fileEntry);
                return fileEntry.value;
            } else {
                this.delete(key);
                return null;
            }
        } catch (err) {
            return null;
        }
    }

    delete(key: string): void {
        this.memoryCache.delete(key);

        const filePath = this.getFilePath(key);
        fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting file:', err);
        });
    }

    clear(): void {
        this.memoryCache.clear();
        fs.readdir(this.cacheDir, (err, files) => {
            if (err) console.error('Error reading directory:', err);
            files.forEach(file => {
                fs.unlink(path.join(this.cacheDir, file), (err) => {
                    if (err) console.error('Error deleting file:', err);
                });
            });
        });
    }

    private cleanupExpired(): void {
        while (this.expirationHeap.peek() && this.expirationHeap.peek()!.expiresAt < Date.now()) {
            const expiredEntry = this.expirationHeap.pop()!;
            this.delete(expiredEntry.key);
        }
    }

    destroy(): void {
        clearInterval(this.cleanupInterval);
    }
}

export { FileCache };
