import {Keyv} from 'keyv';
import {
	beforeEach, describe, expect, it,
} from 'vitest';
import {faker} from '@faker-js/faker';
import {createCache} from '../src/index.js';
import {sleep} from './sleep.js';

describe('get', () => {
	let keyv: Keyv;
	let cache: ReturnType<typeof createCache>;
	let ttl = 500;
	const data = {key: '', value: ''};

	beforeEach(async () => {
		data.key = faker.string.alpha(20);
		data.value = faker.string.sample();
		ttl = faker.number.int({min: 500, max: 1000});
		keyv = new Keyv();
		cache = createCache({stores: [keyv]});
	});

	it('basic', async () => {
		await cache.set(data.key, data.value);
		await expect(cache.get(data.key)).resolves.toEqual(data.value);
	});

	it('expired', async () => {
		await cache.set(data.key, data.value, ttl);
		await sleep(ttl + 100);
		await expect(cache.get(data.key)).resolves.toBeUndefined();
	});

	it('error', async () => {
		await cache.set(data.key, data.value);
		keyv.get = () => {
			throw new Error('get error');
		};

		await expect(cache.get(data.key)).resolves.toBeUndefined();
	});
	it('error on non-blocking enabled', async () => {
		const secondKeyv = new Keyv();
		keyv.get = () => {
			throw new Error('get error');
		};

		const cache = createCache({stores: [keyv, secondKeyv], nonBlocking: true});
		await cache.set(data.key, data.value);
		await expect(cache.get(data.key)).resolves.toBeUndefined();
	});
});
