import { Redis } from '@upstash/redis';

const env = process.env;

// Je kono prefix e (KV_, STORAGE_, UPSTASH_) URL ar TOKEN khuje ber kore
const find = (re) => {
  const key = Object.keys(env).find((k) => re.test(k) && env[k]);
  return key ? env[key] : undefined;
};

const url = find(/REST_API_URL$/) || find(/REST_URL$/);
const token = find(/REST_API_TOKEN$/) || find(/REST_TOKEN$/);

if (!url || !token) {
  throw new Error('Upstash Redis variable pawa jay nai. Storage connect kore Redeploy koro.');
}

const redis = new Redis({ url, token });

// Sob user ekta JSON array hishebe "users" key te thake
export const getUsers = async () => (await redis.get('users')) || [];
export const saveUsers = (u) => redis.set('users', u);
