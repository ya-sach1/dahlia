import { parse as parseYAML, stringify as stringifyYAML } from 'yaml';
import { readFileSync, statSync, writeFileSync } from 'fs';
import { get, has, set, delete as dotDelete } from 'dot-prop';
import { extname } from 'path';

type AvaiableTypes = 'json' | 'yml' | 'yaml';

class Parser {
	public parse: (...args: any[]) => Record<string, any>;
	public stringify: (...args: any[]) => string;

	public constructor(type: string | AvaiableTypes) {
		switch (type) {
			case 'yaml':
				this.parse = parseYAML;
				this.stringify = stringifyYAML;
				break;
			case 'yml':
				this.parse = parseYAML;
				this.stringify = stringifyYAML;
				break;
			case 'json':
				this.parse = JSON.parse;
				this.stringify = JSON.stringify;
				break;
			default:
				this.parse = JSON.parse;
				this.stringify = JSON.stringify;
				break;
		}
	}
}

export class Configuration {
	private parsed: Record<string, any> = {};
	private parser: Parser;

	public constructor(private readonly path: string, type?: string | AvaiableTypes) {
		if (!statSync(path)) throw new Error("Couldn't parse the config file; is the path correct? does the file exist?");

		this.parser = new Parser(type ?? extname(path).slice(1));
		this.parse();
	}

	// I don't feel like ruining code-style just to return directly with arrow functions

	private parse = (): void => {
		this.parsed = this.parser.parse(readFileSync(this.path, { encoding: 'utf-8' }));
	};

	public get<T>(path: string, defaultValue?: T): T | undefined {
		return get<T>(this.parsed, path) ?? defaultValue;
	};

	public has = (path: string): boolean => {
		return has(this.parsed, path);
	};

	public set = (path: string, value: unknown): this => {
		writeFileSync(this.path, this.parser.stringify(set(this.parsed, path, value)));

		this.parse();
		return this;
	};

	public delete = (path: string): this => {
		dotDelete(this.parsed, path);
		writeFileSync(this.path, this.parser.stringify(this.parsed));

		this.parse();
		return this;
	};
}
