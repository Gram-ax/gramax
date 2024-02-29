import ResourceMovements from "@core/Resource/models/ResourceMovements";
import { Buffer } from "buffer";
import Path from "../FileProvider/Path/Path";
import FileProvider from "../FileProvider/model/FileProvider";

class ResourceManager {
	private _resources: Path[];
	constructor(private _fp: FileProvider, private _basePath: Path, private _rootPath?: Path) {
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

	setNewBasePath(newBasePath: Path): ResourceMovements {
		if (newBasePath.compare(this._basePath)) {
			return { oldResources: this._resources, newResources: this._resources };
		}
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

	async move(oldPath: Path, newPath: Path): Promise<ResourceMovements> {
		if (oldPath.compare(newPath)) {
			return { oldResources: this._resources, newResources: this._resources };
		}
		const oldResources = [...this._resources];
		const newResources = await Promise.all(
			this._resources.map(async (resource) => {
				const newResource = new Path(`./${resource.nameWithExtension.replaceAll(oldPath.name, newPath.name)}`);
				const absoluteResource = this.getAbsolutePath(resource);
				const newAbsoluteResource = this.getAbsolutePath(newResource);
				if (!(await this._fp.exists(absoluteResource))) return newResource;
				await this._fp.move(absoluteResource, newAbsoluteResource);
				return newResource;
			}),
		);
		this._resources = newResources;
		return { oldResources, newResources };
	}

	async setContent(path: Path, data: string | Buffer) {
		return await this._fp.write(this.getAbsolutePath(path), data);
	}

	async getContent(path: Path): Promise<Buffer> {
		return await this._fp.readAsBinary(this.getAbsolutePath(path));
	}

	async delete(path: Path) {
		if (!(await this._fp.exists(this.getAbsolutePath(path)))) return;
		return await this._fp.delete(this.getAbsolutePath(path));
	}

	async deleteAll() {
		await Promise.all(this._resources.map(async (path) => await this.delete(path)));
	}

	set(path: Path) {
		if (this._resources.findIndex((p) => p.compare(path)) === -1) {
			this._resources.push(path);
		}
	}

	async exists(path: Path) {
		return await this._fp.exists(this.getAbsolutePath(path));
	}

	getAbsolutePath(path: Path): Path {
		return this._rootPath
			? this._rootPath.parentDirectoryPath.join(this._getJoinRootPath().join(path))
			: this._basePath.join(path);
	}

	private _getJoinRootPath(basePath?: Path): Path {
		return this._rootPath
			? this._rootPath.parentDirectoryPath.subDirectory(this._rootPath).join(basePath ?? this._basePath)
			: this._basePath;
	}
}

export default ResourceManager;
