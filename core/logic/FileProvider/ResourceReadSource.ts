import type { FsScope } from "@core/FileProvider/DiskFileProvider/DFPIntermediateCommands";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import MountFileProvider from "@core/FileProvider/MountFileProvider/MountFileProvider";
import type FileProvider from "@core/FileProvider/model/FileProvider";
import type Path from "@core/FileProvider/Path/Path";
import GitTreeFileProvider from "@ext/versioning/GitTreeFileProvider";

export type ResourceReadTarget = { kind: "disk"; path: string } | { kind: "git"; scope: FsScope; path: string };

export type ResourceReadSource = {
	targets: ResourceReadTarget[];
};

export function resolveResourceReadSource(fp: FileProvider, paths: Path[]): ResourceReadSource {
	const targets = paths.map<ResourceReadTarget>((path) => {
		const resourceFp = fp instanceof MountFileProvider ? fp.at(path) : fp;
		if (resourceFp instanceof GitTreeFileProvider) {
			const { scope, scopedPath } = resourceFp.getNativeScope(path);
			return { kind: "git", scope, path: scopedPath };
		}
		if (resourceFp instanceof DiskFileProvider) return { kind: "disk", path: resourceFp.toAbsolute(path) };
		return { kind: "disk", path: path.value };
	});
	return { targets };
}
