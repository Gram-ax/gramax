import { FRAGMENTS_DIRECTORY, GRAMAX_DIRECTORY, SNIPPETS_DIRECTORY } from "@app/config/const";
import Path from "@core/FileProvider/Path/Path";

const fragmentsPath = `${GRAMAX_DIRECTORY}/${FRAGMENTS_DIRECTORY}`;

export const getFragmentLegacyPath = (basePath: Path, rootPath?: Path): ((path: Path) => Path) | null => {
	if (!basePath?.value.includes(fragmentsPath)) return null;
	const fallbackBasePath = new Path(
		basePath.value.replace(fragmentsPath, `${GRAMAX_DIRECTORY}/${SNIPPETS_DIRECTORY}`),
	);

	return (path: Path): Path =>
		rootPath
			? rootPath.parentDirectoryPath.join(
					rootPath.parentDirectoryPath.subDirectory(rootPath).join(fallbackBasePath).join(path),
				)
			: fallbackBasePath.join(path);
};
