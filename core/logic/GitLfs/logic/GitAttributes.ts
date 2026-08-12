import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import { parseGitAttributes, serializeGitAttributes } from "@core/GitLfs/logic/gitAttributesParsing";
import type { ToSpan } from "@ext/loggers/opentelemetry";

type GitAttributesMap = Map<string, { attributes: string[]; disabled: boolean }>;

const GIT_ATTRIBUTES_PATH = new Path(".gitattributes");

export default class GitAttributes implements ToSpan {
	private _dirty = false;

	constructor(
		private _attrs: GitAttributesMap,
		private _fp: FileProvider,
		private _path: Path,
	) {}

	static async parse(fp: FileProvider, rootPath: Path): Promise<GitAttributes> {
		const path = rootPath.join(GIT_ATTRIBUTES_PATH);
		const exists = await fp.exists(path);

		if (!exists) return new GitAttributes(new Map(), fp, path);

		const raw = await fp.read(path);
		const attrs = new Map(
			parseGitAttributes(raw).map((e) => [e.pattern, { attributes: e.attributes, disabled: e.disabled }]),
		);

		return new GitAttributes(attrs, fp, path);
	}

	findPatternsByAttr(attr: string): string[] {
		return Array.from(this._attrs.entries())
			.filter(([, v]) => !v.disabled && v.attributes.includes(attr))
			.map(([k]) => k);
	}

	setAttr(pattern: string, attr: string): this {
		const entry = this._attrs.has(pattern)
			? this._attrs.get(pattern)
			: this._attrs.set(pattern, { attributes: [], disabled: false }).get(pattern);

		if (entry.attributes.includes(attr)) return this;
		entry.attributes.push(attr);
		entry.disabled = false;

		this._dirty = true;
		return this;
	}

	removeAttr(pattern: string, attr: string): this {
		const entry = this._attrs.get(pattern);
		if (!entry) return this;

		const hasAttr = entry.attributes.includes(attr);
		if (!hasAttr) return this;

		entry.attributes = entry.attributes.filter((a) => a !== attr);

		this._dirty = true;
		return this;
	}

	setAttrMany(patterns: string[], attr: string): this {
		const keys = new Set([...this._attrs.keys(), ...patterns]);
		keys.forEach((pattern) => {
			patterns.includes(pattern) ? this.setAttr(pattern, attr) : this.removeAttr(pattern, attr);
		});

		return this;
	}

	/** Current state as it would be written by {@link save}. */
	serialize(): string {
		const entries = Array.from(this._attrs.entries()).map(([pattern, v]) => ({
			pattern,
			attributes: v.attributes,
			disabled: v.disabled,
		}));

		return serializeGitAttributes(entries);
	}

	async save() {
		if (!this._dirty) return;
		await this._fp.write(this._path, this.serialize());
	}

	toSpan() {
		return Array.from(this._attrs);
	}
}
