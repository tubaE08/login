import { Redis } from '@upstash/redis';
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});
// Sob user ekta JSON array hishebe "users" key te thake
export const getUsers = async () => (await redis.get('users')) || [];
export const saveUsers = (u) => redis.set('users', u);
