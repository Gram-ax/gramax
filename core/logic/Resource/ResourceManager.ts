import assertMaxFileSize from "@core/Resource/assertMaxFileSize";
import ResourceMovements from "@core/Resource/models/ResourceMovements";
import createNewFilePathUtils from "@core/utils/createNewFilePathUtils";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
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

	setNewBasePath(newBasePath: Path, ignoredResources?: Path[]): ResourceMovements {
		if (newBasePath.compare(this._basePath)) {
			return { oldResources: this._resources, newResources: this._resources };
		}
		const oldResources = [...this._resources];
		const absoluteNewBasePath = this._rootPath ? this._rootPath.join(newBasePath) : newBasePath;
		const newResources = this._resources.map((resource) => {
			const absoluteResource = this.getAbsolutePath(resource);
			if (ignoredResources?.some((ignoredResource) => ignoredResource.compare(absoluteResource))) return resource;

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
		const newResources = [];
		for (const resource of this._resources) {
			let newResource = new Path(`./${resource.nameWithExtension.replaceAll(oldPath.name, newPath.name)}`);
			const absoluteResource = this.getAbsolutePath(resource);
			let newAbsoluteResource = this.getAbsolutePath(newResource);
			if (!(await this._fp.exists(absoluteResource))) {
				newResources.push(newResource);
				continue;
			}

			if (await this._fp.exists(newAbsoluteResource)) {
				const basePath = newAbsoluteResource.parentDirectoryPath;
				const brothers = (await this._fp.getItems(basePath)).map((b) => b.path);
				const renamePath = createNewFilePathUtils.create(
					newAbsoluteResource,
					brothers,
					newAbsoluteResource.name,
					`.${newAbsoluteResource.extension}`,
				);
				newAbsoluteResource = renamePath;
				newResource = new Path(`./${renamePath.nameWithExtension}`);
			}

			await this._fp.move(absoluteResource, newAbsoluteResource);
			newResources.push(newResource);
		}
		this._resources = newResources;
		return { oldResources, newResources };
	}

	async setContent(path: Path, data: string | Buffer) {
		this._assertMaxFileSize(data);
		return await this._fp.write(this.getAbsolutePath(path), data);
	}

	async getContent(path: Path): Promise<Buffer> {
		try {
			return await this._fp.readAsBinary(this.getAbsolutePath(path));
		} catch {}
	}

	async delete(path: Path) {
		if (!(await this._fp.exists(this.getAbsolutePath(path)))) return;
		return await this._fp.delete(this.getAbsolutePath(path), true);
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

	async assertExists(src: Path, error: { title: string; message: string }) {
		if (!(await this.exists(src))) throw new DefaultError(error.message, null, null, false, error.title);
	}

	private _assertMaxFileSize(data: string | Buffer) {
		assertMaxFileSize(data.length ?? (data as ArrayBuffer).byteLength);
	}

	private _getJoinRootPath(basePath?: Path): Path {
		return this._rootPath
			? this._rootPath.parentDirectoryPath.subDirectory(this._rootPath).join(basePath ?? this._basePath)
			: this._basePath;
	}
}

export default ResourceManager;
