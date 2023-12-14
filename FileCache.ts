import * as fs from 'fs';
import * as path from 'path';

type CacheEntry = {
    value: any;
    expiresAt: number;
};

class FileCache {
    private cacheDir: string;
    private cleanupInterval: NodeJS.Timeout;

    constructor(cacheDir: string) {
        this.cacheDir = cacheDir;
        fs.mkdirSync(cacheDir, { recursive: true });
        this.cleanupInterval = setInterval(() => this.cleanupExpired(), 60000);
    }

    private getFilePath(key: string): string {
        return path.join(this.cacheDir, `${key}.json`);
    }

    set(key: string, value: any, ttl: number): void {
        const filePath = this.getFilePath(key);
        const data: CacheEntry = { value, expiresAt: Date.now() + ttl * 1000 };
        fs.writeFile(filePath, JSON.stringify(data), (err) => {
            if (err) console.error('Error writing file:', err);
        });
    }

    get(key: string): any {
        const filePath = this.getFilePath(key);
        try {
            const data: CacheEntry = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (data.expiresAt > Date.now()) {
                return data.value;
            } else {
                this.delete(key);
                return null;
            }
        } catch (err) {
            return null;
        }
    }

    delete(key: string): void {
        const filePath = this.getFilePath(key);
        fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting file:', err);
        });
    }

    clear(): void {
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
        fs.readdir(this.cacheDir, (err, files) => {
            if (err) console.error('Error reading directory:', err);
            files.forEach(file => {
                const filePath = path.join(this.cacheDir, file);
                try {
                    const data: CacheEntry = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    if (data.expiresAt <= Date.now()) {
                        this.delete(path.basename(file, '.json'));
                    }
                } catch (err) {
                    console.error('Error reading file:', err);
                }
            });
        });
    }

    destroy(): void {
        clearInterval(this.cleanupInterval);
    }
}

export { FileCache };
