import { parse, stringify } from 'yaml';
import { readFileSync, statSync, writeFileSync } from 'fs';
import { get, has, set, delete as dotDelete } from 'dot-prop';

export class Configuration {
	private _parsed: Record<string, unknown> = {};

	/**
	 * Instantiates a configuration
	 * @param {string} path Path to config file
	 */
	constructor(private readonly path: string) {
		if (!statSync(path)) throw new Error("Couldn't parse the config file; is the path correct? does the file exist?");

		this._parse();
	}

	private _parse(): void {
		this._parsed = parse(readFileSync(this.path, { encoding: 'utf-8' }));
	}

	/**
	 * Get a value from specified path
	 */
	get<T>(path: string, defaultValue?: T): T | undefined {
		return get<T>(this._parsed, path) ?? defaultValue;
	}

	/**
	 * Check if the path exists
	 */
	has(path: string): boolean {
		return has(this._parsed, path);
	}

	/**
	 * Set value at specified path
	 */
	set(path: string, value: unknown): this {
		writeFileSync(this.path, stringify(set(this._parsed, path, value)));

		this._parse();
		return this;
	}

	/**
	 * Delete value at specified path
	 */
	delete(path: string): this {
		dotDelete(this._parsed, path);
		writeFileSync(this.path, stringify(this._parsed));

		this._parse();
		return this;
	}
}
