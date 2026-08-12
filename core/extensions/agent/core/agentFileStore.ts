import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";

export class AgentFileStore {
	private readonly _fp: DiskFileProvider;
	private readonly _writeQueues = new Map<string, Promise<void>>();

	constructor(agentDataPath: Path) {
		this._fp = new DiskFileProvider(agentDataPath);
	}

	async readFile(relativePath: string): Promise<string | null> {
		const path = new Path(relativePath);
		if (!(await this._fp.exists(path))) return null;
		return this._fp.read(path);
	}

	private async _enqueue(relativePath: string, op: () => Promise<void>): Promise<void> {
		const prev = this._writeQueues.get(relativePath) ?? Promise.resolve();
		const next = prev.then(op);
		this._writeQueues.set(relativePath, next);
		try {
			await next;
		} finally {
			if (this._writeQueues.get(relativePath) === next) this._writeQueues.delete(relativePath);
		}
	}

	async writeFile(relativePath: string, content: string): Promise<void> {
		await this._enqueue(relativePath, async () => {
			await this._fp.write(new Path(relativePath), content);
		});
	}

	async readJsonFile<T>(fileName: string, fallback: T): Promise<T> {
		const raw = await this.readFile(fileName);
		if (raw == null) return fallback;

		try {
			return JSON.parse(raw) as T;
		} catch {
			return fallback;
		}
	}

	async writeJsonFile(fileName: string, value: unknown): Promise<void> {
		await this.writeFile(fileName, JSON.stringify(value));
	}

	async listDir(relativeDir: string): Promise<string[]> {
		const path = new Path(relativeDir);
		if (!(await this._fp.exists(path))) return [];
		return this._fp.readdir(path);
	}

	async deletePath(relativePath: string): Promise<void> {
		await this._enqueue(relativePath, async () => {
			await this._fp.delete(new Path(relativePath));
		});
	}
}
