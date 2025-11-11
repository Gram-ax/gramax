import { getExecutingEnvironment } from "@app/resolveModule/env";
import { Router } from "@core/Api/Router";
import CustomArticle from "@core/SitePresenter/customArticles/model/CustomArticle";
import DiagramType from "@core/components/Diagram/DiagramType";
import Theme from "@ext/Theme/Theme";
import { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import type { DiffItemContentScope } from "@ext/git/core/GitDiffItemCreator/DiffItemContent/DiffItemContent";
import UiLanguage, { type ContentLanguage } from "@ext/localization/core/model/Language";
import { Syntax } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/model/Syntax";
import { SearcherType } from "@ext/serach/SearcherManager";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import { ExportFormat } from "@ext/wordExport/components/ItemExport";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import MimeTypes from "./Types/MimeTypes";
import Url from "./Types/Url";

/**
 * @deprecated Consider using `useApi(..)` hook instead
 */
export default class ApiUrlCreator {
	constructor(private _basePath: string, private _catalogName?: string, private _articlePath?: string) {}

	fromArticle(articlePath: string) {
		return this.fromNewArticlePath(this._catalogName + "/" + articlePath);
	}

	fromNewArticlePath(articlePath: string) {
		return new ApiUrlCreator(this._basePath, this._catalogName, articlePath);
	}

	public getLogo(theme: Theme, isMobile: boolean = true) {
		if (isMobile) {
			return Url.fromBasePath(
				theme == Theme.dark ? `/images/gramax-logo-hp-dark.svg` : `/images/gramax-logo-hp-light.svg`,
				getExecutingEnvironment() == "next" ? this._basePath : "",
			);
		}

		return Url.fromBasePath(
			theme == Theme.dark ? `/images/gramax-logo-desktop-dark.svg` : `/images/gramax-logo-desktop-light.svg`,
			getExecutingEnvironment() == "next" ? this._basePath : "",
		);
	}

	public switchWorkspace(id: WorkspacePath) {
		return Url.fromBasePath(`/api/workspace/switch`, this._basePath, { id });
	}

	public editWorkspace() {
		return Url.fromBasePath(`/api/workspace/edit`, this._basePath);
	}

	public removeWorkspace(id: WorkspacePath) {
		return Url.fromBasePath(`/api/workspace/remove`, this._basePath, { id });
	}

	public createWorkspace() {
		return Url.fromBasePath(`/api/workspace/create`, this._basePath, {});
	}

	public getCustomStyleAsset(workspacePath: WorkspacePath) {
		return Url.fromBasePath(`/api/workspace/assets/getCustomStyle`, this._basePath, { path: workspacePath });
	}

	public updateHomeLogo(workspacePath: WorkspacePath, theme: Theme) {
		return Url.fromBasePath("/api/workspace/assets/homeLogo/update", this._basePath, {
			theme,
			path: workspacePath,
		});
	}

	public deleteHomeLogo(workspacePath: WorkspacePath, theme: Theme) {
		return Url.fromBasePath("/api/workspace/assets/homeLogo/delete", this._basePath, {
			theme,
			path: workspacePath,
		});
	}
	public getHomeLogo(workspacePath: WorkspacePath, theme: Theme) {
		return Url.fromBasePath("/api/workspace/assets/homeLogo/get", this._basePath, { theme, path: workspacePath });
	}

	public setCustomStyleAsset(workspacePath: WorkspacePath) {
		return Url.fromBasePath(`/api/workspace/assets/setCustomStyle`, this._basePath, { workspacePath });
	}

	public setDefaultPath(path: string) {
		return Url.fromBasePath(`/api/workspace/setDefaultPath`, this._basePath, { path });
	}

	public getArticleResource(
		src: string,
		mimeType?: MimeTypes,
		catalogName?: string,
		itemId?: string,
		providerType?: ArticleProviderType,
	) {
		return Url.fromBasePath(`/api/article/resource/get`, this._basePath, {
			articlePath: itemId || this._articlePath,
			catalogName: catalogName ?? this._catalogName,
			mimeType,
			src,
			providerType,
		});
	}

	public getResourceByPath(fullResourcePath: string) {
		return Url.fromBasePath(`/api/article/resource/getByPath`, this._basePath, {
			fullResourcePath,
			catalogName: this._catalogName,
		});
	}

	public setSourceData() {
		return Url.fromBasePath(`/api/storage/sourceData/setSourceData`, this._basePath);
	}

	public getSourceData() {
		return Url.fromBasePath(`/api/storage/sourceData/getSourceData`, this._basePath);
	}

	public getSourceDataUsage(sourceName: string) {
		return Url.fromBasePath(`/api/storage/getSourceDataUsage`, this._basePath, { sourceName });
	}

	public removeSourceData(sourceName: string) {
		return Url.fromBasePath(`/api/storage/removeSourceData`, this._basePath, { sourceName });
	}

	public initStorage() {
		return Url.fromBasePath(`/api/storage/init`, this._basePath, {
			articlePath: this._articlePath,
			catalogName: this._catalogName,
		});
	}

	public getArticleContentByRelativePath(articleRelativePath: string) {
		return Url.fromBasePath(`/api/article/features/getRenderContent`, this._basePath, {
			articleRelativePath,
			catalogName: this._catalogName,
			articlePath: this._articlePath,
		});
	}

	public getArticleEditorContent() {
		return Url.fromBasePath(`/api/article/features/getEditorContent`, this._basePath, {
			catalogName: this._catalogName,
			articlePath: this._articlePath,
		});
	}

	public getArticleRenderDataByLogicPath(logicPath: string) {
		return Url.fromBasePath(`/api/article/features/getRenderContentByLogicPath`, this._basePath, {
			catalogName: this._catalogName,
			logicPath,
		});
	}

	public getArticleHeadersByRelativePath(articleRelativePath: string) {
		return Url.fromBasePath(`/api/article/features/getArticleHeadersByRelativePath`, this._basePath, {
			articleRelativePath,
			catalogName: this._catalogName,
			articlePath: this._articlePath,
		});
	}

	public setArticleResource(src: string, articlePath?: string, providerType?: ArticleProviderType) {
		return Url.fromBasePath(`/api/article/resource/set`, this._basePath, {
			articlePath: articlePath ?? this._articlePath,
			catalogName: this._catalogName,
			src,
			providerType,
		});
	}

	public deleteArticleResource(src: string, itemId?: string, providerType?: ArticleProviderType) {
		return Url.fromBasePath(`/api/article/resource/remove`, this._basePath, {
			articlePath: itemId || this._articlePath,
			catalogName: this._catalogName,
			src,
			providerType,
		});
	}

	public getArticleFileBrotherNames(itemId?: string, providerType?: ArticleProviderType) {
		return Url.fromBasePath(`/api/article/features/getBrotherNames`, this._basePath, {
			articlePath: itemId || this._articlePath,
			catalogName: this._catalogName,
			providerType,
		});
	}

	public getCommentsByAuthors() {
		return Url.fromBasePath(`/api/comments/getCommentsByAuthors`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public getNewCommentId() {
		return Url.fromBasePath(`/api/comments/getNewCommentId`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public deleteComment(id: string) {
		return Url.fromBasePath(`/api/comments/delete`, this._basePath, {
			catalogName: this._catalogName,
			articlePath: this._articlePath,
			id,
		});
	}

	public getAuthAssertUrl() {
		return Url.fromBasePath("/api/auth/assert", this._basePath);
	}

	public getSendMailTokenUrl(mail: string) {
		return Url.fromBasePath("/api/auth/sendMailToken", this._basePath, { mail });
	}

	public getFileUrl(url: string) {
		return Url.fromBasePath("/api/load/", this._basePath) + url;
	}

	public getDbDiagramUrl(path: string, primary: string, tags: string, draw?: string) {
		return Url.fromBasePath("/api/dbDiagram", this._basePath, {
			path: path,
			tags: tags,
			draw: draw,
			primary: primary,
			catalogName: this._catalogName,
			articlePath: this._articlePath,
		});
	}

	public getDiagramByContentUrl(diagramName: DiagramType, count: number = null) {
		return Url.fromBasePath(`/api/diagram/content`, this._basePath, {
			diagram: diagramName,
			count: count?.toString(),
		});
	}

	public getEditOnSourceLink(articlePath: string) {
		return Url.fromBasePath("/api/article/editOn/source", this._basePath, {
			catalogName: this._catalogName,
			articlePath,
		});
	}

	public getEditOnAppUrl(articlePath: string) {
		return Url.fromBasePath("/api/article/editOn/app", this._basePath, {
			catalogName: this._catalogName,
			articlePath,
		});
	}

	public getLogoUrl(catalogName: string, theme: Theme, force?: boolean) {
		return Url.fromBasePath(`/api/catalog/logo`, this._basePath, {
			catalogName,
			theme,
			force: force?.toString(),
		});
	}
	public catalogLogoExist(catalogName: string, theme: Theme) {
		return Url.fromBasePath(`/api/catalog/logo/exist`, this._basePath, {
			catalogName,
			theme,
		});
	}

	public updateCatalogLogo(catalogName: string, name: string) {
		return Url.fromBasePath(`/api/catalog/logo/update`, this._basePath, {
			catalogName,
			name,
		});
	}

	public deleteCatalogLogo(catalogName: string, theme: Theme) {
		return Url.fromBasePath(`/api/catalog/logo/delete`, this._basePath, {
			catalogName,
			theme,
		});
	}

	public getOpenGraphLogoUrl(domain: string) {
		return domain + (this._basePath ?? "") + "/openGraph/logo.png";
	}

	public getAuthUrl(router: Router, isLogged: boolean) {
		const from = encodeURIComponent(router?.basePath + router?.path);
		return Url.fromBasePath(isLogged ? `/api/auth/logout` : `/api/auth/login`, this._basePath, {
			from,
		});
	}

	public getAddEnterpriseWorkspaceUrl(oneTimeCode: string) {
		return Url.fromBasePath(`api/enterprise/addWorkspace`, this._basePath, { oneTimeCode });
	}

	public getLogoutEnterpriseUrl(id: WorkspacePath) {
		return Url.fromBasePath(`api/enterprise/logout`, this._basePath, { id });
	}

	public getCloneEnterpriseCatalogsUrl() {
		return Url.fromBasePath(`api/enterprise/cloneCatalogs`, this._basePath);
	}

	public getCheckEditEnterpriseWorkspaceUrl(workspaceId: WorkspacePath) {
		return Url.fromBasePath(`api/enterprise/checkEditWorkspace`, this._basePath, { workspaceId });
	}

	public getAuthSsoUrl(data: string, sign: string, from: string) {
		return Url.fromBasePath(`api/auth/sso`, this._basePath, { data, sign, from });
	}

	public getPrintableContentUrl(catalogName: string, isCategory?: boolean, itemPath?: string, titleNumber?: boolean) {
		return Url.fromBasePath(`/api/item/getPrintableContent`, this._basePath, {
			catalogName,
			isCategory: isCategory?.toString?.(),
			itemPath,
			titleNumber: titleNumber?.toString(),
		});
	}

	public getPdfSaveUrl(isCategory: boolean, itemPath?: string) {
		return Url.fromBasePath(`/api/pdf`, this._basePath, {
			itemPath,
			catalogName: this._catalogName,
			isCategory: isCategory?.toString(),
		});
	}

	public getPdfTemplateUrl(name: string) {
		return Url.fromBasePath(`/api/pdf/template`, this._basePath, {
			name,
		});
	}

	public getWordSaveUrl(isCategory: boolean, itemPath?: string, wordTemplateName?: string) {
		return Url.fromBasePath(`/api/word`, this._basePath, {
			itemPath,
			catalogName: this._catalogName,
			isCategory: isCategory ? "true" : "false",
			wordTemplateName,
		});
	}

	public getErrorWordElementsUrl(isCategory: boolean, itemPath?: string, exportFormat?: ExportFormat) {
		return Url.fromBasePath(`/api/word/getErrorElements`, this._basePath, {
			itemPath,
			catalogName: this._catalogName,
			isCategory: isCategory ? "true" : "false",
			exportFormat,
		});
	}

	public getUnsupportedElementsUrl(storageDataName: string, sourceType: SourceType) {
		return Url.fromBasePath(`/api/storage/import/getUnsupportedElements`, this._basePath, {
			storageDataName,
			sourceType,
		});
	}

	public getVersionControlResetBranchesUrl() {
		return Url.fromBasePath("/api/versionControl/branch/reset", this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public resetFileLock() {
		return Url.fromBasePath(`/api/storage/resetFileLock`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public getSyncCountUrl({
		forceCatalogName,
	}: { forceCatalogName?: string; fetch?: boolean; returnError?: boolean } = {}) {
		return Url.fromBasePath(`/api/storage/getSyncCount`, this._basePath, {
			catalogName: forceCatalogName ?? this._catalogName,
		});
	}

	public getAllSyncCountUrl(shouldFetch: boolean, resetSyncCount: boolean) {
		return Url.fromBasePath(`/api/storage/getAllSyncCount`, this._basePath, {
			fetch: shouldFetch.toString(),
			resetSyncCount: resetSyncCount.toString(),
		});
	}

	public getAllSyncableWorkspacesUrl() {
		return Url.fromBasePath(`/api/storage/getAllSyncableWorkspaces`, this._basePath, {});
	}

	public getStoragePublishUrl(message: string) {
		return Url.fromBasePath(`/api/storage/publish`, this._basePath, {
			catalogName: this._catalogName,
			commitMessage: message,
		});
	}

	public getVersionControlDiscardUrl() {
		return Url.fromBasePath(`/api/versionControl/discard`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public getVersionControlDiffTreeUrl(oldScope: TreeReadScope, newScope?: TreeReadScope) {
		return Url.fromBasePath(`/api/versionControl/diff/getDiffTree`, this._basePath, {
			catalogName: this._catalogName,
			oldScope: JSON.stringify(oldScope),
			newScope: newScope ? JSON.stringify(newScope) : undefined,
		});
	}

	public getVersionControlRevisionsUrl(from?: string, depth?: number) {
		return Url.fromBasePath(`/api/versionControl/revision/getRevisions`, this._basePath, {
			catalogName: this._catalogName,
			from,
			depth: depth?.toString(),
		});
	}

	public getVersionControlDiffItemContentUrl(scope: DiffItemContentScope, filePath: string, isResource?: boolean) {
		return Url.fromBasePath(`/api/versionControl/diff/getDiffItemContent`, this._basePath, {
			catalogName: this._catalogName,
			scope: JSON.stringify(scope),
			filePath,
			isResource: isResource?.toString(),
		});
	}

	public getVersionControlStatuses() {
		return Url.fromBasePath(`/api/versionControl/statuses`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public getVersionControlFileStatus(articlePath: string) {
		return Url.fromBasePath(`/api/versionControl/fileStatus`, this._basePath, {
			catalogName: this._catalogName,
			articlePath,
		});
	}

	public getStorageFetch() {
		return Url.fromBasePath(`/api/storage/fetch`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public getStorageHaveToPull(shouldFetch = true) {
		return Url.fromBasePath(`/api/storage/haveToPull`, this._basePath, {
			catalogName: this._catalogName,
			shouldFetch: shouldFetch.toString(),
		});
	}

	public getStorageCanPull() {
		return Url.fromBasePath(`/api/storage/canPull`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public getStorageSyncUrl() {
		return Url.fromBasePath(`/api/storage/sync`, this._basePath, {
			catalogName: this._catalogName,
			articlePath: this._articlePath,
		});
	}

	public markRepositoryAsBroken(message?: string) {
		return Url.fromBasePath(`/api/storage/markAsBroken`, this._basePath, {
			catalogName: this._catalogName,
			message,
		});
	}

	public startRecover() {
		return Url.fromBasePath(`/api/storage/startRecover`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public startClone(
		path: string,
		isBare = false,
		redirectOnClone = null,
		skipCheck?: boolean,
		branch?: string,
		deleteIfExists?: boolean,
	) {
		return Url.fromBasePath(`/api/storage/startClone`, this._basePath, {
			branch,
			skipCheck: skipCheck?.toString(),
			path,
			isBare: isBare?.toString(),
			redirectOnClone,
			deleteIfExists: deleteIfExists?.toString(),
		});
	}

	public getRemoveCloneCatalogUrl(name: string) {
		return Url.fromBasePath(`/api/storage/removeCloneCatalog`, this._basePath, {
			catalogName: name,
		});
	}

	public getCloneProgress(path: string) {
		return Url.fromBasePath(`/api/storage/getCloneProgress`, this._basePath, {
			path,
		});
	}

	public cancelClone(path: string) {
		return Url.fromBasePath(`/api/storage/cancelClone`, this._basePath, {
			path,
		});
	}

	public getStorageUrl() {
		return Url.fromBasePath("/api/storage/getUrl", this._basePath, { catalogName: this._catalogName });
	}

	public getGitCommitAuthors(authorFilter?: string) {
		return Url.fromBasePath("/api/versionControl/getAllCommitAuthors", this._basePath, {
			catalogName: this._catalogName,
			authorFilter,
		});
	}

	public getCurrentBranch(
		{
			onlyName = true,
			cached = true,
			cachedMergeRequests = true,
		}: {
			onlyName?: boolean;
			cached?: boolean;
			cachedMergeRequests?: boolean;
		} = { cached: true, cachedMergeRequests: true, onlyName: true },
	) {
		return Url.fromBasePath(`/api/versionControl/branch/get`, this._basePath, {
			catalogName: this._catalogName,
			cached: cached.toString(),
			onlyName: onlyName.toString(),
			cachedMergeRequests: cachedMergeRequests.toString(),
		});
	}

	public getVersionControlBranchToCheckoutUrl() {
		return Url.fromBasePath(`/api/versionControl/branch/getBranchToCheckout`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public getVersionControlAbortCheckoutStateUrl() {
		return Url.fromBasePath(`/api/versionControl/branch/abortCheckoutState`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public getVersionControlCheckoutBranchUrl(branch: string) {
		return Url.fromBasePath(`/api/versionControl/branch/checkout`, this._basePath, {
			branch: encodeURIComponent(branch),
			catalogName: this._catalogName,
		});
	}

	public getVersionControlCreateNewBranchUrl(branch: string) {
		return Url.fromBasePath(`/api/versionControl/branch/create`, this._basePath, {
			branch: encodeURIComponent(branch),
			catalogName: this._catalogName,
		});
	}

	public getVersionControlDeleteBranchUrl(branch: string) {
		return Url.fromBasePath(`/api/versionControl/branch/delete`, this._basePath, {
			branch: encodeURIComponent(branch),
			catalogName: this._catalogName,
		});
	}

	public getReviewLinkUrl(filePath: string) {
		return Url.fromBasePath(`/api/catalog/review/getReviewLink`, this._basePath, {
			catalogName: this._catalogName,
			filePath,
		});
	}

	public getReviewStorageDataUrl() {
		return Url.fromBasePath(`/api/catalog/review/getReviewLinkData`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public getShareLinkUrl(filePath: string) {
		return Url.fromBasePath(`/api/catalog/share/getShareLink`, this._basePath, {
			catalogName: this._catalogName,
			filePath,
		});
	}

	public getShareLinkDataUrl() {
		return Url.fromBasePath(`/api/catalog/share/getShareLinkData`, this._basePath);
	}

	public getHealthcheckUrl() {
		return Url.fromBasePath(`/api/healthcheck`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public getSearchDataUrl(query: string, catalogName: string, type?: SearcherType) {
		return Url.fromBasePath(`/api/search/searchCommand`, this._basePath, {
			query,
			catalogName,
			type,
		});
	}

	public getSearchChatUrl(
		query: string,
		catalogName: string | null,
		articlesLanguage: ContentLanguage | "none" | null,
		responseLanguage: ContentLanguage | null,
	) {
		return Url.fromBasePath(`/api/search/chat`, this._basePath, {
			query,
			catalogName,
			articlesLanguage,
			responseLanguage,
		});
	}

	public getVersionControlFileHistoryUrl(articlePath: string) {
		return Url.fromBasePath(`/api/versionControl/fileHistory`, this._basePath, {
			path: articlePath,
			catalogName: this._catalogName,
		});
	}

	public mergeInto(branchName: string, deleteAfterMerge?: boolean, squash?: boolean) {
		return Url.fromBasePath(`/api/versionControl/branch/mergeInto`, this._basePath, {
			catalogName: this._catalogName,
			branchName,
			deleteAfterMerge: deleteAfterMerge?.toString(),
			squash: squash?.toString(),
		});
	}

	public getMergeData() {
		return Url.fromBasePath(`/api/versionControl/mergeConflict/getMergeData`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public abortMerge() {
		return Url.fromBasePath(`/api/versionControl/mergeConflict/abort`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public resolveMerge() {
		return Url.fromBasePath(`/api/versionControl/mergeConflict/resolve`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public validateMerge() {
		return Url.fromBasePath(`/api/versionControl/mergeConflict/validateMerge`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public createMergeRequest() {
		return Url.fromBasePath(`/api/mergeRequests/create`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public mergeRequestMerge(validateMerge?: boolean) {
		return Url.fromBasePath(`/api/mergeRequests/merge`, this._basePath, {
			catalogName: this._catalogName,
			validateMerge: validateMerge?.toString(),
		});
	}

	public getVideoUrl(path: string) {
		return Url.fromBasePath("/api/elements/video/getUrl", this._basePath, {
			path: path,
			catalogName: this._catalogName,
			articlePath: this._articlePath,
		});
	}

	public getAddCommentUrl(query: { [name: string]: string }) {
		return Url.fromBasePath("/api/comments/VersionControl/addComment", this._basePath, query);
	}

	public editCommentUrl(query: { [name: string]: string }) {
		return Url.fromBasePath("/api/comments/VersionControl/editComment", this._basePath, query);
	}

	public getAddCommentAnswerUrl(query: { [name: string]: string }) {
		return Url.fromBasePath("/api/comments/VersionControl/addCommentAnswer", this._basePath, query);
	}

	public getEditCommentAnswerUrl(query: { [name: string]: string }) {
		return Url.fromBasePath("/api/comments/VersionControl/editCommentAnswer", this._basePath, query);
	}

	public getSetThemeURL(theme: string) {
		return Url.fromBasePath("/api/theme/set", this._basePath, { theme });
	}

	public getSetLanguageURL(language: UiLanguage) {
		return Url.fromBasePath("/api/lang/set", this._basePath, { language });
	}

	public createCatalog() {
		return Url.fromBasePath(`/api/catalog/create`, this._basePath);
	}

	public removeCatalog(name?: string) {
		return Url.fromBasePath(`/api/catalog/remove`, this._basePath, {
			catalogName: name || this._catalogName,
		});
	}

	public addCatalogLanguage(code: ContentLanguage) {
		return Url.fromBasePath(`/api/catalog/language/add`, this._basePath, {
			catalogName: this._catalogName,
			code,
		});
	}

	public removeCatalogLanguage(code: ContentLanguage) {
		return Url.fromBasePath(`/api/catalog/language/remove`, this._basePath, {
			catalogName: this._catalogName,
			code,
		});
	}

	public updateCatalogProps() {
		return Url.fromBasePath(`/api/catalog/updateProps`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public updateCatalogNav(itemPath: string) {
		return Url.fromBasePath(`/api/catalog/updateNavigation`, this._basePath, {
			itemPath,
			catalogName: this._catalogName,
		});
	}

	public getCatalogBrotherFileNames() {
		return Url.fromBasePath(`/api/catalog/getBrotherFileNames`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public createArticle(parentPath?: string) {
		return Url.fromBasePath(`/api/article/create`, this._basePath, {
			catalogName: this._catalogName,
			parentPath,
		});
	}

	public getItemProps(itemPath: string) {
		return Url.fromBasePath(`/api/article/getProps`, this._basePath, {
			catalogName: this._catalogName,
			path: itemPath,
		});
	}

	public updateArticleContent() {
		return Url.fromBasePath(`/api/article/updateContent`, this._basePath, {
			path: this._articlePath,
			catalogName: this._catalogName,
		});
	}

	public setArticleContent(articlePath: string, rawMarkdown?: boolean) {
		return Url.fromBasePath(`/api/article/features/setContent`, this._basePath, {
			path: articlePath,
			catalogName: this._catalogName,
			rawMarkdown: rawMarkdown?.toString(),
		});
	}

	public getArticleContent(articlePath: string) {
		return Url.fromBasePath(`/api/article/features/getContent`, this._basePath, {
			path: articlePath,
			catalogName: this._catalogName,
		});
	}

	public getLinkItems() {
		return Url.fromBasePath(`/api/article/features/getLinkItems`, this._basePath, {
			path: this._articlePath,
			catalogName: this._catalogName,
		});
	}

	public checkLastModifiedArticle() {
		return Url.fromBasePath(`/api/article/features/checkLastModified`, this._basePath, {
			path: this._articlePath,
			catalogName: this._catalogName,
		});
	}

	public getArticleBrotherFileNames(itemPath: string) {
		return Url.fromBasePath(`/api/article/features/getBrotherFileNames`, this._basePath, {
			path: itemPath,
			catalogName: this._catalogName,
		});
	}

	public getCustomArticle(name: CustomArticle) {
		return Url.fromBasePath("/api/article/features/getCustomArticle", this._basePath, { name });
	}

	public removeItem(articlePath: string) {
		return Url.fromBasePath(`/api/item/remove`, this._basePath, {
			catalogName: this._catalogName,
			articlePath: articlePath,
		});
	}

	public updateItemProps() {
		return Url.fromBasePath(`/api/item/updateProps`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public getPermissionValuesUrl(path?: string) {
		return Url.fromBasePath(`/api/item/getPermission`, this._basePath, {
			catalogName: this._catalogName,
			path,
		});
	}

	public getShareTicket(group: string, date: string) {
		return Url.fromBasePath(`/api/catalog/share/getShareTicket`, this._basePath, {
			catalogName: this._catalogName,
			path: this._articlePath,
			group,
			date,
		});
	}

	public setPermissionValuesUrl(path?: string) {
		return Url.fromBasePath(`/api/item/setPermission`, this._basePath, {
			catalogName: this._catalogName,
			path,
		});
	}

	public getArticlesWithSnippet(snippetId: string) {
		return Url.fromBasePath(`/api/elements/snippet/getArticlesWithSnippet`, this._basePath, {
			catalogName: this._catalogName,
			snippetId,
		});
	}

	public clearArticlesContentWithSnippet(snippetId: string) {
		return Url.fromBasePath(`/api/elements/snippet/clearArticlesContent`, this._basePath, {
			catalogName: this._catalogName,
			snippetId,
		});
	}

	public getSnippetRenderData(snippetId: string) {
		return Url.fromBasePath(`/api/elements/snippet/getRenderData`, this._basePath, {
			catalogName: this._catalogName,
			snippetId,
		});
	}

	public createCustomIcon() {
		return Url.fromBasePath(`/api/elements/icon/create`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public deleteCustomIcon(code: string) {
		return Url.fromBasePath(`/api/elements/icon/delete`, this._basePath, {
			catalogName: this._catalogName,
			code,
		});
	}

	public getCustomIconsList() {
		return Url.fromBasePath(`/api/elements/icon/getIconsList`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public createResourceFromPath(resourcePath: string, resourceName: string) {
		return Url.fromBasePath(`/api/article/resource/createFromPath`, this._basePath, {
			articlePath: this._articlePath,
			catalogName: this._catalogName,
			resourcePath,
			resourceName,
		});
	}

	public getAddedCounters(curArticlePath: string) {
		return Url.fromBasePath(`/api/catalog/actionEditorProperties/getAddedCounters`, this._basePath, {
			articlePath: this._articlePath,
			catalogName: this._catalogName,
			curArticlePath,
		});
	}

	public getViewRenderData() {
		return Url.fromBasePath(`/api/catalog/view/getRenderData`, this._basePath, {
			catalogName: this._catalogName,
			articlePath: this._articlePath,
		});
	}

	public getPropertyUsages(propertyName: string, value: string) {
		return Url.fromBasePath(`/api/article/property/get`, this._basePath, {
			catalogName: this._catalogName,
			propertyName,
			value,
			articlePath: this._articlePath,
		});
	}

	public updateArticleProperty(articlePath: string, propertyName: string, newValue: string, isDelete?: string) {
		return Url.fromBasePath(`/api/article/property/update`, this._basePath, {
			catalogName: this._catalogName,
			articlePath,
			propertyName,
			newValue,
			isDelete,
		});
	}

	public removePropertyFromArticles(propertyName: string, value?: string) {
		return Url.fromBasePath(`/api/article/property/remove`, this._basePath, {
			catalogName: this._catalogName,
			articlePath: this._articlePath,
			propertyName,
			value,
		});
	}

	public getDraftMergeRequest() {
		return Url.fromBasePath(`/api/mergeRequests/getDraft`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public setMergeRequestApproval(approve: boolean) {
		return Url.fromBasePath(`/api/mergeRequests/setApproval`, this._basePath, {
			catalogName: this._catalogName,
			approve: approve.toString(),
		});
	}

	public uploadStatic() {
		return Url.fromBasePath(`/api/catalog/cloud/upload`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public getUploadStatus() {
		return Url.fromBasePath(`/api/catalog/cloud/getUploadStatus`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public getPageData(path: string) {
		return Url.fromBasePath(`/api/page/getPageData`, this._basePath, {
			catalogName: this._catalogName,
			path,
		});
	}

	public getPageDataByArticleData(articlePath: string, catalogName: string, scope?: TreeReadScope) {
		return Url.fromBasePath(`/api/page/getPageDataByArticleData`, this._basePath, {
			catalogName,
			scope: scope ? JSON.stringify(scope) : undefined,
			articlePath,
		});
	}

	public getInboxArticles(userMail: string) {
		return Url.fromBasePath(`/api/inbox/get`, this._basePath, {
			catalogName: this._catalogName,
			userMail,
		});
	}

	public getInboxUsers() {
		return Url.fromBasePath(`/api/inbox/getUsers`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public mergeInboxArticles(draggedLogicPath: string, droppedLogicPath: string) {
		return Url.fromBasePath(`/api/inbox/merge`, this._basePath, {
			catalogName: this._catalogName,
			draggedLogicPath,
			droppedLogicPath,
		});
	}

	public createFileInGramaxDir(id: string, type: ArticleProviderType) {
		return Url.fromBasePath(`/api/article/provider/create`, this._basePath, {
			id,
			type,
			catalogName: this._catalogName,
		});
	}

	public updateFileInGramaxDir(id: string, type: ArticleProviderType) {
		return Url.fromBasePath(`/api/article/provider/update`, this._basePath, {
			id,
			type,
			catalogName: this._catalogName,
		});
	}

	public getFileContentInGramaxDir(id: string, type: ArticleProviderType) {
		return Url.fromBasePath(`/api/article/provider/getFileContent`, this._basePath, {
			id,
			type,
			catalogName: this._catalogName,
		});
	}

	public getArticleListInGramaxDir(type: ArticleProviderType) {
		return Url.fromBasePath(`/api/article/provider/getItemList`, this._basePath, {
			type,
			catalogName: this._catalogName,
		});
	}

	public removeFileInGramaxDir(id: string, type: ArticleProviderType) {
		return Url.fromBasePath(`/api/article/provider/remove`, this._basePath, {
			id,
			type,
			catalogName: this._catalogName,
		});
	}

	public getTemplateProperties(templateId: string) {
		return Url.fromBasePath(`/api/templates/getProperties`, this._basePath, {
			catalogName: this._catalogName,
			templateId,
		});
	}

	public updateTemplateArticleField(field: string) {
		return Url.fromBasePath(`/api/templates/updateArticleField`, this._basePath, {
			catalogName: this._catalogName,
			articlePath: this._articlePath,
			field,
		});
	}

	public removeTemplateArticleField(field: string) {
		return Url.fromBasePath(`/api/templates/removeArticleField`, this._basePath, {
			catalogName: this._catalogName,
			articlePath: this._articlePath,
			field,
		});
	}

	public setSourceState(storageName: string, isValid: boolean) {
		return Url.fromBasePath(`/api/storage/setSourceState`, this._basePath, {
			storageName,
			isValid: isValid.toString(),
		});
	}

	public setSyntax(syntax: Syntax) {
		return Url.fromBasePath(`api/catalog/setSyntax`, this._basePath, {
			catalogName: this._catalogName,
			syntax,
		});
	}

	public getEditTreeInGramaxDir(id: string, type: ArticleProviderType) {
		return Url.fromBasePath(`/api/article/provider/getEditTree`, this._basePath, {
			id,
			type,
			catalogName: this._catalogName,
		});
	}

	public getPrettifiedText(command: string) {
		return Url.fromBasePath(`/api/ai/text/prettify`, this._basePath, {
			command,
			catalogName: this._catalogName,
		});
	}

	public getGeneratedText(command: string) {
		return Url.fromBasePath(`/api/ai/text/generate`, this._basePath, {
			command,
			catalogName: this._catalogName,
		});
	}

	public markArticleAsRead(logicPath: string) {
		return Url.fromBasePath(`/api/article/markAsRead`, this._basePath, {
			catalogName: this._catalogName,
			logicPath,
		});
	}

	public markArticleAsOpened(logicPath: string) {
		return Url.fromBasePath(`/api/article/markAsOpened`, this._basePath, {
			catalogName: this._catalogName,
			logicPath,
		});
	}

	public checkAiAuth(apiUrl: string) {
		return Url.fromBasePath(`/api/ai/server/checkAuth`, this._basePath, {
			apiUrl,
		});
	}

	public checkAiServer(apiUrl: string) {
		return Url.fromBasePath(`/api/ai/server/checkServer`, this._basePath, {
			apiUrl,
		});
	}

	public setAiData(workspacePath: string) {
		return Url.fromBasePath(`/api/ai/server/setData`, this._basePath, {
			workspacePath,
		});
	}

	public removeAiData(workspacePath: string) {
		return Url.fromBasePath(`/api/ai/server/removeData`, this._basePath, {
			workspacePath,
		});
	}

	public getAiData(workspacePath: string) {
		return Url.fromBasePath(`/api/ai/server/getData`, this._basePath, {
			workspacePath,
		});
	}

	public getFavoriteArticleData() {
		return Url.fromBasePath(`/api/catalog/favorite/getArticlesData`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public getArticleBacklinks(articlePath: string) {
		return Url.fromBasePath(`/api/catalog/links/backlinks/get`, this._basePath, {
			catalogName: this._catalogName,
			articlePath,
		});
	}

	public getArticleLinks(articlePath: string) {
		return Url.fromBasePath(`/api/catalog/links/links/get`, this._basePath, {
			catalogName: this._catalogName,
			articlePath,
		});
	}

	public getComment(id: string) {
		return Url.fromBasePath(`/api/comments/get`, this._basePath, {
			catalogName: this._catalogName,
			articlePath: this._articlePath,
			id,
		});
	}

	public updateComment(id: string) {
		return Url.fromBasePath(`/api/comments/update`, this._basePath, {
			catalogName: this._catalogName,
			articlePath: this._articlePath,
			id,
		});
	}

	public copyComment(id: string, copyPath: string) {
		return Url.fromBasePath(`/api/comments/copy`, this._basePath, {
			catalogName: this._catalogName,
			articlePath: this._articlePath,
			id,
			copyPath,
		});
	}

	public transcribeAudio() {
		return Url.fromBasePath(`/api/ai/audio/transcribe`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public getResourcePath(url: string) {
		return Url.fromBasePath(`/api/article/resource/getPath`, this._basePath, {
			articlePath: this._articlePath,
			catalogName: this._catalogName,
			path: url,
		});
	}

	public getAnswers() {
		return Url.fromBasePath(`/api/quiz/answers/get`, this._basePath, {
			catalogName: this._catalogName,
			articlePath: this._articlePath,
		});
	}

	public getMailSendOTPUrl() {
		return Url.fromBasePath(`/api/auth/mailSendOTP`, this._basePath);
	}

	public getMailLoginOTPUrl() {
		return Url.fromBasePath(`/api/auth/mailLoginOTP`, this._basePath);
	}
}
