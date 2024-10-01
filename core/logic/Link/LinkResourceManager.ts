import FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import ResourceManager from "@core/Resource/ResourceManager";

class LinkResourceManager extends ResourceManager {
	private _linkResources?: { resource: Path; hash?: string }[] = [];

	constructor(fp: FileProvider, basePath: Path, rootPath?: Path) {
		super(fp, basePath, rootPath);
	}

	override set(path: Path, hash?: string) {
		if (hash) this._setHash(path, hash);
		super.set(path);
	}

	public get linkResources() {
		return this._linkResources;
	}

	protected _setHash(resource: Path, hash?: string) {
		const result = this.linkResources.some(({ resource: itemResource, hash: itemHash }) => {
			return itemResource.value === resource.value && hash === itemHash;
		});

		if (!result) this._linkResources.push({ resource, hash });
	}
}

export default LinkResourceManager;
