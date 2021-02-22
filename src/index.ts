import { readFileSync, statSync, writeFileSync } from 'fs';
import { parse, stringify } from 'yaml';
import { get, has, set, delete as dotDelete } from 'dot-prop';

export class Configuration {
	private path: string;
	private parsed: Record<string, any> = {};

	public constructor(path: string) {
		if (!statSync(path))
			throw new Error("Couldn't parse the config file; is the path correct? does the file exist?");

		this.path = path;
		this.parse();
	}

	private parse = (): void => (this.parsed = parse(readFileSync(this.path, { encoding: 'utf-8' })));

	public get = <T>(path: string, defaultValue?: T): T | undefined => get<T>(this.parsed, path) ?? defaultValue;
	public has = (path: string): boolean => has(this.parsed, path);
	public set = (path: string, value: any): void => {
		writeFileSync(
			this.path,
			stringify(set(this.parsed, path, value), {
				indent: 4,
			}),
		);

		this.parse();
	};

	public delete = (path: string): void => {
		dotDelete(this.parsed, path);

		writeFileSync(
			this.path,
			stringify(this.parsed, {
				indent: 4,
			}),
		);

		this.parse();
	};
}
