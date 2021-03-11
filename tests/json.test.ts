import { resolve } from 'path';
import { Configuration } from '../src';

const config = new Configuration(resolve(__dirname, 'config', 'config.yaml'));

test('Gets string correctly', () => {
	expect(config.get('config.foo')).toEqual('bar');
});

test('Gets number correctly', () => {
	expect(config.get('config.bar')).toEqual(5);
});

test('Gets boolean correctly', () => {
	expect(config.get('config.baz')).toEqual(true);
});

test('Gets array correctly', () => {
	expect(config.get('config.foobar')).toEqual([1, 2, 3]);
});

test('Has correctly', () => {
	expect(config.has('foo')).toEqual(false);
});

test('Sets correctly', () => {
	config.set('config.foo', 'baz');
	expect(config.get('config.foo')).toEqual('baz');
	config.set('config.foo', 'bar');
});

test('Deletes correctly', () => {
	config.delete('config.foo');
	expect(config.has('config.foo')).toEqual(false);
	config.set('config.foo', 'bar');
});
