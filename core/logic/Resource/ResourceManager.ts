import { Buffer } from "buffer";
import Path from "../FileProvider/Path/Path";
import FileProvider from "../FileProvider/model/FileProvider";

class ResourceManager {
	private _resources: Path[];
	constructor(private _basePath: Path, private _rootPath?: Path) {
		this._resources = [];
	}

	get basePath() {
		return this._basePath;
	}

	get rootPath() {
		return this._rootPath;
	}

	get resources() {
		return this._resources;
	}

	setNewBasePath(newBasePath: Path) {
		const oldResources = [...this._resources];
		const absoluteNewBasePath = this._rootPath ? this._rootPath.join(newBasePath) : newBasePath;
		const newResources = this._resources.map((resource) => {
			const absoluteResource = this.getAbsolutePath(resource);
			const relativePath = absoluteNewBasePath.getRelativePath(absoluteResource);
			return relativePath;
		});
		this._basePath = newBasePath;
		this._resources = newResources;
		return { oldResources, newResources };
	}

	async setContent(path: Path, data: string | Buffer, fp: FileProvider) {
		return await fp.write(this.getAbsolutePath(path), data);
	}

	async getContent(path: Path, fp: FileProvider): Promise<Buffer> {
		return await fp.readAsBinary(this.getAbsolutePath(path));
	}

	async delete(path: Path, fp: FileProvider) {
		return await fp.delete(this.getAbsolutePath(path));
	}

	async deleteAll(fp: FileProvider) {
		await Promise.all(this._resources.map(async (path) => await this.delete(path, fp)));
	}

	getAbsolutePath(path: Path): Path {
		return this._rootPath
			? this._rootPath.parentDirectoryPath.join(this._getJoinRootPath().join(path))
			: this._basePath.join(path);
	}

	set(path: Path) {
		if (this._resources.findIndex((p) => p.compare(path)) === -1) {
			this._resources.push(path);
		}
	}

	async exist(path: Path, fp: FileProvider) {
		return await fp.exists(this.getAbsolutePath(path));
	}

	private _getJoinRootPath(basePath?: Path): Path {
		return this._rootPath
			? this._rootPath.parentDirectoryPath.subDirectory(this._rootPath).join(basePath ?? this._basePath)
			: this._basePath;
	}
}

export default ResourceManager;
