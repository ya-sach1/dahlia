import { parse, stringify } from 'yaml';
import { readFileSync, statSync, writeFileSync } from 'fs';

type Dictionary<V = any> = { [key: string]: V };

export class Configuration {
	private _parsed: Dictionary = {};

	/**
	 * Instantiates a configuration
	 * @param {string} path Path to config file
	 */
	constructor(private readonly path: string) {
		if (!statSync(path)) throw new Error("Couldn't parse the config file; is the path correct? does the file exist?");

		this._parse();
	}

	private _parse() {
		this._parsed = parse(readFileSync(this.path, { encoding: 'utf-8' }));
	}

	private static _isValidPath(segments: string[]): boolean {
		return !segments.some((segment) => ['__proto__', 'prototype', 'constructor'].includes(segment));
	}

	private static _isObj(input: unknown): input is object {
		return typeof input === 'object' && !!input;
	}

	private static _getPathSegments(path: string): string[] {
		const segments = path.split('.');
		const parts: string[] = [];

		for (let iterator = 0; iterator < segments.length; iterator++) {
			let segment = segments[iterator];

			while (segment[segment.length - 1] === '\\' && segments[iterator + 1]) {
				segment = `${segment.slice(0, -1)}.`;
				segment += segments[iterator++];
			}

			parts.push(segment);
		}

		return !Configuration._isValidPath(parts) ? [] : parts;
	}

	/**
	 * Whether or not an object has a property.
	 * @param object The object
	 * @param path The path to the property.
	 */
	static _has(object: Dictionary, path: string): boolean {
		if (!Configuration._isObj(object)) return false;

		const segments = Configuration._getPathSegments(path);
		if (segments.length === 0) return false;

		for (const segment of segments) {
			if (Configuration._isObj(object)) {
				if (!(segment in object)) return false;
				object = object[segment];
			} else {
				return false;
			}
		}

		return true;
	}

	/**
	 * Get a value.
	 * @param obj The object.
	 * @param path The path to the value.
	 * @param defaultValue The default value.
	 */
	static _get<T>(obj: Dictionary, path: string, defaultValue?: T): T | undefined {
		if (!Configuration._isObj(obj)) return defaultValue ?? (obj as T);

		const segments = Configuration._getPathSegments(path);
		if (segments.length === 0) return;

		for (let iterator = 0; iterator < segments.length; iterator++) {
			if (!Object.prototype.propertyIsEnumerable.call(obj, segments[iterator])) return defaultValue;

			obj = obj[segments[iterator]];
			if (!obj) {
				if (iterator !== segments.length - 1) return defaultValue;
				break;
			}
		}

		return obj as T;
	}

	/**
	 * Set a value.
	 * @param object The object.
	 * @param path The path.
	 * @param value The value.
	 */
	static _set(object: Dictionary, path: string, value: unknown): Dictionary {
		if (!Configuration._isObj(object)) return object;

		const root = object;
		const segments = Configuration._getPathSegments(path);

		for (let iterator = 0; iterator < segments.length; iterator++) {
			const segment = segments[iterator];

			if (!Configuration._isObj(object[segment])) object[segment] = {};
			iterator === segments.length - 1 ? (object[segment] = value) : (object = object[segment]);
		}

		return root;
	}

	/**
	 * Delete a property.
	 * @param object The object.
	 * @param path The path.
	 */
	static _delete(object: Dictionary, path: string): void {
		if (!Configuration._isObj(object)) return;

		const segments = Configuration._getPathSegments(path);

		for (let iterator = 0; iterator < segments.length; iterator++) {
			const segment = segments[iterator];
			if (iterator === segments.length - 1) {
				delete object[segment];
				return;
			}

			object = object[segment];
			if (!Configuration._isObj(object)) return;
		}
	}

	/**
	 * Get a value from specified path
	 */
	get<T>(path: string, defaultValue?: T): T | undefined {
		return Configuration._get<T>(this._parsed, path) ?? defaultValue;
	}

	/**
	 * Check if the path exists
	 */
	has(path: string): boolean {
		return Configuration._has(this._parsed, path);
	}

	/**
	 * Set value at specified path
	 */
	set(path: string, value: unknown): this {
		writeFileSync(this.path, stringify(Configuration._set(this._parsed, path, value)));

		this._parse();
		return this;
	}

	/**
	 * Delete value at specified path
	 */
	delete(path: string): this {
		Configuration._delete(this._parsed, path);
		writeFileSync(this.path, stringify(this._parsed));

		this._parse();
		return this;
	}
}
