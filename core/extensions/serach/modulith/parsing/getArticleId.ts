import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";

export function getResourceArticleId(wsPath: WorkspacePath, articleLogicPath: string, resourceName: string) {
	return `${getArticleId(wsPath, articleLogicPath)}#file#${resourceName}`;
}

export function getArticleId(wsPath: WorkspacePath, articleLogicPath: string) {
	return `${wsPath}#${articleLogicPath}`;
}

export function getCatalogId(wsPath: WorkspacePath, catalogName: string, lang: string) {
	return `catalog#${wsPath}#${catalogName}#${lang}`;
}
