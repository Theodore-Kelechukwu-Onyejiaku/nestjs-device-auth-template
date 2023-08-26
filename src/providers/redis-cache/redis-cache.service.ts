import { Inject, Injectable } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

@Injectable()
export class RedisCacheService {
    constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) { }

    async get(key: string): Promise<any> {
        return await this.cache.get(key);
    }

    async set<T>(key: string, value: T) {
        await this.cache.set(key, value);
    }

    async reset() {
        await this.cache.reset();
    }

    async del(key: string) {
        await this.cache.del(key);
    }
}