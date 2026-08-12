import type FileProvider from "@core/FileProvider/model/FileProvider";
import type Path from "@core/FileProvider/Path/Path";
import { Level, trace } from "@ext/loggers/opentelemetry";
import type { FsRequestMethod, FsScope, SearchWorkerOutMessage } from "@ext/serach/modulith/search/worker/types";

export type PendingFsRequest = {
	resolve: (value: unknown) => void;
	reject: (reason: unknown) => void;
};

export type FsRpcState = {
	fsPending: Map<string, PendingFsRequest>;
	fsReqId: number;
};

export class RpcFileProvider implements FileProvider {
	constructor(
		private readonly _root: Path,
		private readonly _scope: FsScope,
		private readonly _postMessage: (message: SearchWorkerOutMessage) => void,
		private readonly _fsRpcState: FsRpcState,
	) {}

	get kind(): "git" | "disk" {
		throw new Error("kind is not supported in RpcFileider");
	}

	get storageId(): string {
		return this._throwNotImplemented("storageId");
	}

	get rootPath(): Path {
		return this._throwNotImplemented("rootPath");
	}

	get isReadOnly(): boolean {
		return this._throwNotImplemented("isReadOnly");
	}

	get isFallbackOnRoot(): boolean {
		return this._throwNotImplemented("isFallbackOnRoot");
	}

	@trace({ level: Level.Full })
	isRootPathExists(): Promise<boolean> {
		return this._callFs("isRootPathExists", { path: "" });
	}

	@trace({ level: Level.Full })
	exists(path: Path): Promise<boolean> {
		return this._callFs("exists", { path: this._toFsPath(path) });
	}

	@trace({ level: Level.Full })
	read(path: Path): Promise<string> {
		return this._callFs("read", { path: this._toFsPath(path) });
	}

	@trace({ level: Level.Full })
	readAsArrayBuffer(path: Path): Promise<Uint8Array> {
		return this._callFs("readAsArrayBuffer", { path: this._toFsPath(path) });
	}

	@trace({ level: Level.Full })
	readdir(path: Path): Promise<string[]> {
		return this._callFs("readdir", { path: this._toFsPath(path) });
	}

	@trace({ level: Level.Files })
	async delete(path: Path): Promise<void> {
		await this._callFs("delete", { path: this._toFsPath(path) });
	}

	@trace({ level: Level.Files })
	async write(path: Path, data: string | Buffer): Promise<void> {
		await this._callFs("write", { path: this._toFsPath(path), data });
	}

	@trace({ level: Level.Files })
	async mkdir(path: Path, mode?: number): Promise<void> {
		await this._callFs("mkdir", { path: this._toFsPath(path), mode });
	}

	@trace({ level: Level.Files })
	async createRootPathIfNeed(): Promise<void> {
		await this._callFs("createRootPathIfNeed", { path: this._root.value });
	}

	withMountPath(): void {
		this._throwNotImplemented("withMountPath");
	}

	async getItems(): Promise<never[]> {
		this._throwNotImplemented("getItems");
	}

	getItemRef(): never {
		this._throwNotImplemented("getItemRef");
	}

	async getStat(): Promise<never> {
		this._throwNotImplemented("getStat");
	}

	async readAsBinary(): Promise<Buffer> {
		this._throwNotImplemented("readAsBinary");
	}

	async isFolder(): Promise<boolean> {
		this._throwNotImplemented("isFolder");
	}

	async readlink(): Promise<string> {
		this._throwNotImplemented("readlink");
	}

	async hardlink(): Promise<void> {
		this._throwNotImplemented("symlink");
	}

	async deleteEmptyDirs(): Promise<void> {
		this._throwNotImplemented("deleteEmptyFolders");
	}

	async move(): Promise<void> {
		this._throwNotImplemented("move");
	}

	async copy(): Promise<void> {
		this._throwNotImplemented("copy");
	}

	watch(): void {
		this._throwNotImplemented("watch");
	}

	startWatch(): void {
		this._throwNotImplemented("startWatch");
	}

	stopWatch(): void {
		this._throwNotImplemented("stopWatch");
	}

	private async _callFs<T>(method: FsRequestMethod, args: Record<string, unknown>): Promise<T> {
		const requestId = this._nextRequestId();
		return new Promise<T>((resolve, reject) => {
			this._fsRpcState.fsPending.set(requestId, { resolve, reject });
			this._postMessage({
				type: "fs",
				requestId,
				scope: this._scope,
				method,
				args,
			});
		});
	}

	private _nextRequestId(): string {
		return (++this._fsRpcState.fsReqId).toString();
	}

	private _toFsPath(path: Path): string {
		return path.value;
	}

	private _throwNotImplemented(method: string): never {
		throw new Error(`${method} is not supported in RpcFileProvider`);
	}
}
