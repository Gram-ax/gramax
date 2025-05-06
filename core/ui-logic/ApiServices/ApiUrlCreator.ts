import { getExecutingEnvironment } from "@app/resolveModule/env";
import { Router } from "@core/Api/Router";
import { ArticleProviderType } from "@core/FileStructue/Article/ArticleProvider";
import CustomArticle from "@core/SitePresenter/customArticles/model/CustomArticle";
import DiagramType from "@core/components/Diagram/DiagramType";
import Theme from "@ext/Theme/Theme";
import UiLanguage, { type ContentLanguage } from "@ext/localization/core/model/Language";
import { SearcherType } from "@ext/serach/SearcherManager";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import { ExportFormat } from "@ext/wordExport/components/ItemExport";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import MimeTypes from "./Types/MimeTypes";
import Url from "./Types/Url";
import { Syntax } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/model/Syntax";

export default class ApiUrlCreator {
	constructor(private _basePath: string, private _catalogName?: string, private _articlePath?: string) {}

	fromArticle(articlePath: string) {
		return this.fromNewArticlePath(this._catalogName + "/" + articlePath);
	}

	fromNewArticlePath(articlePath: string) {
		return new ApiUrlCreator(this._basePath, this._catalogName, articlePath);
	}

	public getLogo(theme: Theme) {
		return Url.fromBasePath(
			theme == Theme.dark ? `/images/gramax-logo-dark.svg` : `/images/gramax-logo-light.svg`,
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
		return Url.fromBasePath(`/api/workspace/assets/getCustomStyle`, this._basePath, { workspacePath });
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

	public getArticleResource(src: string, mimeType?: MimeTypes, catalogName?: string) {
		return Url.fromBasePath(`/api/article/resource/get`, this._basePath, {
			articlePath: this._articlePath,
			catalogName: catalogName ?? this._catalogName,
			mimeType,
			src,
		});
	}

	public setSourceData() {
		return Url.fromBasePath(`/api/storage/setSourceData`, this._basePath);
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

	public setArticleResource(src: string, articlePath?: string) {
		return Url.fromBasePath(`/api/article/resource/set`, this._basePath, {
			articlePath: articlePath ?? this._articlePath,
			catalogName: this._catalogName,
			src,
		});
	}

	public deleteArticleResource(src: string) {
		return Url.fromBasePath(`/api/article/resource/remove`, this._basePath, {
			articlePath: this._articlePath,
			catalogName: this._catalogName,
			src,
		});
	}

	public getArticleFileBrotherNames() {
		return Url.fromBasePath(`/api/article/features/getBrotherNames`, this._basePath, {
			articlePath: this._articlePath,
			catalogName: this._catalogName,
		});
	}

	public getCommentsByAuthors() {
		return Url.fromBasePath(`/api/comments/getCommentsByAuthors`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public getCommentCount() {
		return Url.fromBasePath(`/api/comments/getCommentCount`, this._basePath, {
			articlePath: this._articlePath,
		});
	}

	public deleteComment(count: string) {
		return Url.fromBasePath(`/api/comments/deleteComment`, this._basePath, {
			articlePath: this._articlePath,
			count,
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

	public getAddEnterpriseWorkspaceUrl(token: string) {
		return Url.fromBasePath(`api/enterprise/addWorkspace`, this._basePath, { token });
	}

	public getLogoutEnterpriseUrl(id: WorkspacePath) {
		return Url.fromBasePath(`api/enterprise/logout`, this._basePath, { id });
	}

	public getCloneEnterpriseCatalogsUrl(token: string) {
		return Url.fromBasePath(`api/enterprise/cloneCatalogs`, this._basePath, { token });
	}

	public getAuthSsoUrl(data: string, sign: string, from: string) {
		return Url.fromBasePath(`api/auth/sso`, this._basePath, { data, sign, from });
	}

	public getPdfSaveUrl(isCategory: boolean, itemPath?: string) {
		return Url.fromBasePath(`/api/pdf`, this._basePath, {
			itemPath,
			catalogName: this._catalogName,
			isCategory: isCategory?.toString(),
		});
	}

	public getWordSaveUrl(isCategory: boolean, itemPath?: string) {
		return Url.fromBasePath(`/api/word`, this._basePath, {
			itemPath,
			catalogName: this._catalogName,
			isCategory: isCategory ? "true" : "false",
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

	public getGitAddUrl(filePaths: string[]) {
		return Url.fromBasePath(`/api/git/add`, this._basePath, {
			catalogName: this._catalogName,
			filePaths: JSON.stringify(filePaths),
		});
	}

	public getVersionControlResetBranchesUrl() {
		return Url.fromBasePath("/api/versionControl/branch/reset", this._basePath, {
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

	public getAllSyncCountUrl(shouldFetch: boolean) {
		return Url.fromBasePath(`/api/storage/getAllSyncCount`, this._basePath, { fetch: shouldFetch.toString() });
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

	public getVersionControlDiffTreeUrl() {
		return Url.fromBasePath(`/api/versionControl/diffTree`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public getVersionControlStatuses(shouldAdd = true) {
		return Url.fromBasePath(`/api/versionControl/statuses`, this._basePath, {
			catalogName: this._catalogName,
			shouldAdd: shouldAdd.toString(),
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

	public getStorageStartCloneUrl(
		path: string,
		recursive = true,
		isBare = false,
		redirectOnClone = null,
		skipCheck?: boolean,
		branch?: string,
	) {
		return Url.fromBasePath(`/api/storage/startClone`, this._basePath, {
			recursive: recursive.toString(),
			branch,
			skipCheck: skipCheck.toString(),
			path,
			isBare: isBare.toString(),
			redirectOnClone,
		});
	}

	public getRemoveCloneCatalogUrl(name: string) {
		return Url.fromBasePath(`/api/storage/removeCloneCatalog`, this._basePath, {
			catalogName: name,
		});
	}

	public getStorageCloneProgressUrl(path: string) {
		return Url.fromBasePath(`/api/storage/getCloneProgress`, this._basePath, {
			path,
		});
	}

	public getStorageCloneCancelUrl(path: string) {
		return Url.fromBasePath(`/api/storage/cancelClone`, this._basePath, {
			path,
		});
	}

	public getStorageUrl() {
		return Url.fromBasePath("/api/storage/getUrl", this._basePath, { catalogName: this._catalogName });
	}

	public getGitCommitAuthors() {
		return Url.fromBasePath("/api/versionControl/getAllCommitAuthors", this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public getVersionControlCurrentBranchUrl(
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

	public getSearchChatUrl(query: string, catalogName: string | null) {
		return Url.fromBasePath(`/api/search/chat`, this._basePath, {
			query,
			catalogName
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

	public mergeRequestDiffTree(sourceBranch: string, targetBranch: string) {
		return Url.fromBasePath(`/api/mergeRequests/diffTree`, this._basePath, {
			catalogName: this._catalogName,
			sourceBranch,
			targetBranch,
		});
	}

	public cleanupReferencesDiff(sourceBranch: string, targetBranch: string) {
		return Url.fromBasePath(`/api/mergeRequests/cleanupReferencesDiff`, this._basePath, {
			catalogName: this._catalogName,
			sourceBranch,
			targetBranch,
		});
	}

	public mountReferencesDiff(sourceBranch: string, targetBranch: string) {
		return Url.fromBasePath(`/api/mergeRequests/mountReferencesDiff`, this._basePath, {
			catalogName: this._catalogName,
			sourceBranch,
			targetBranch,
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

	public removeCatalog() {
		return Url.fromBasePath(`/api/catalog/remove`, this._basePath, {
			catalogName: this._catalogName,
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

	public getSnippetsListData() {
		return Url.fromBasePath(`/api/elements/snippet/getListData`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public getArticlesWithSnippet(snippetId: string) {
		return Url.fromBasePath(`/api/elements/snippet/getArticlesWithSnippet`, this._basePath, {
			catalogName: this._catalogName,
			snippetId,
		});
	}

	public getSnippetEditData(snippetId: string) {
		return Url.fromBasePath(`/api/elements/snippet/getEditData`, this._basePath, {
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
		return Url.fromBasePath(`/api/catalog/static/upload`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public getPageData(path: string) {
		return Url.fromBasePath(`/api/page/getPageData`, this._basePath, {
			catalogName: this._catalogName,
			path,
		});
	}

	public getInboxArticles() {
		return Url.fromBasePath(`/api/inbox/get`, this._basePath, {
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

	public removeFileInGramaxDir(id: string, type: ArticleProviderType) {
		return Url.fromBasePath(`/api/article/provider/remove`, this._basePath, {
			id,
			type,
			catalogName: this._catalogName,
		});
	}

	public getTemplates() {
		return Url.fromBasePath(`/api/templates/get`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public getTemplatesList() {
		return Url.fromBasePath(`/api/templates/getList`, this._basePath, {
			catalogName: this._catalogName,
		});
	}

	public setArticleAsTemplate(articlePath: string, templateId: string) {
		return Url.fromBasePath(`/api/templates/setArticleAsTemplate`, this._basePath, {
			catalogName: this._catalogName,
			articlePath,
			templateId,
		});
	}

	public getTemplateContent(templateId: string) {
		return Url.fromBasePath(`/api/templates/getContent`, this._basePath, {
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
}
