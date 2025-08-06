import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import type Path from "@core/FileProvider/Path/Path";

export default class ReadOnlyDiskFileProvider extends DiskFileProvider {
	override get isReadOnly(): boolean {
		return true;
	}

	override toAbsolute(path: Path): string {
		return super.toAbsolute(path);
	}

	override async delete() {
		this._throw();
	}

	override async write() {
		this._throw();
	}

	override async move() {
		this._throw();
	}

	override async copy() {
		this._throw();
	}

	override async mkdir() {
		this._throw();
	}

	override async symlink() {
		this._throw();
	}

	override async deleteEmptyFolders() {
		this._throw();
	}

	private _throw() {
		const message = `This file provider is read only, mounted at '${this._rootPath.value}'. If you see this error, this is likely a bug`;
		throw new Error(message);
	}
}
