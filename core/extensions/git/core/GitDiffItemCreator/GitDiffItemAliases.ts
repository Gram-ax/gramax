import t from "@ext/localization/locale/translate";
import DiffFile from "@ext/VersionControl/model/DiffFile";

type Aliases = {
	[path: string]:
		| { path: string; title: string }
		| { path?: string; title: string }
		| { path: string; title?: string };
};

export default abstract class GitDiffItemAliases {
	private static _mergeRequestAliases: Aliases = { ".gramax/mr/open.yaml": { title: t("git.merge-requests.name") } };
	private static _aliases: Aliases = { ...this._mergeRequestAliases };

	static applyAliases(diffFiles: DiffFile[]): void {
		diffFiles.forEach((file) => {
			const alias = this._aliases[file.filePath.path];
			if (!alias) return;
			if (alias.title) file.title = alias.title;
			if (alias.path) file.filePath = { path: alias.path };
		});
	}
}
