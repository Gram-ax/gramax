import { DOC_ROOT_FILENAMES } from "@app/config/const";
import Path from "@core/FileProvider/Path/Path";

export const isDocRootFsPath = (relPath: string): boolean =>
	(DOC_ROOT_FILENAMES as readonly string[]).includes(new Path(relPath).nameWithExtension);
