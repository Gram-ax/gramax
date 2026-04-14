import Divider from "@components/Atoms/Divider";
import DiffFileInput from "@components/Atoms/FileInput/DiffFileInput/DiffFileInput";
import Path from "@core/FileProvider/Path/Path";
import getStringByteSize from "@core/utils/getStringByteSize";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import useRestoreRightSidebar from "@core-ui/hooks/diff/useRestoreRightSidebar";
import useSetupRightNavCloseHandler from "@core-ui/hooks/diff/useSetupRightNavCloseHandler";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import ArticleContextWrapper from "@core-ui/ScopedContextWrapper/ArticleContextWrapper";
import CatalogContextWrapper from "@core-ui/ScopedContextWrapper/CatalogContextWrapper";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { OpenUnknownFile } from "@ext/git/actions/Publish/components/OpenUnknownFile";
import { useResourceViewResolver } from "@ext/git/actions/Publish/logic/useResourceViewResolver";
import { DOCUMENT_SIZE_LIMIT_BYTES } from "@ext/git/actions/Publish/model/consts";
import type { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import t from "@ext/localization/locale/translate";
import RenderDiffBottomBarInBody from "@ext/markdown/elements/diff/components/RenderDiffBottomBarInBody";
import { updateDiffViewMode, useDiffViewMode } from "@ext/markdown/elements/diff/components/store/DiffViewModeStore";
import NavigationEvents from "@ext/navigation/NavigationEvents";
import type { DiffFilePaths } from "@ext/VersionControl/model/Diff";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { useEffect, useLayoutEffect, useState } from "react";

export type ResourceType = "image" | "diagram" | "text" | "unknown";

interface DiffResourceScopesWrapperProps {
	parentPath: DiffFilePaths;
	children: JSX.Element;
	oldScope: TreeReadScope;
	status: FileStatus;
	type: ResourceType;
	newScope: TreeReadScope;
	oldChildren?: JSX.Element;
}

interface ResourceDiffViewProps {
	children: JSX.Element;
	type: ResourceType;
	newContent: string;
	oldContent: string;
	filePath: DiffFilePaths;
	isTextTooLarge?: boolean;
}

const StatusContainer = styled.div`
	max-width: var(--article-max-width);
	overflow-y: auto;

	&[data-status="delete"] {
		align-content: center;
	}
`;

const DiffResourceScopesWrapper = (props: DiffResourceScopesWrapperProps) => {
	const { children, oldScope, newScope, status, oldChildren, parentPath, type } = props;
	const hasParentPath = !!parentPath?.path || !!parentPath?.oldPath;

	const currentArticlePath = ArticlePropsService.value?.ref.path;
	const catalogName = useCatalogPropsStore((state) => state.data?.name);

	const newArticlePath = parentPath?.path ? Path.join(catalogName, parentPath.path) : currentArticlePath;
	const oldArticlePath = parentPath?.oldPath ? Path.join(catalogName, parentPath.oldPath) : currentArticlePath;

	const isImg = type === "image";

	if (!oldChildren) {
		const isDeleted = status === FileStatus.delete;

		return (
			<StatusContainer data-status={status}>
				<StatusWrapper isImg={isImg} status={status}>
					<ScopeWrapper
						articlePath={isDeleted ? oldArticlePath : newArticlePath}
						hasParentPath={hasParentPath}
						scope={isDeleted ? oldScope : newScope}
					>
						{children}
					</ScopeWrapper>
				</StatusWrapper>
			</StatusContainer>
		);
	}

	return (
		<StatusContainer data-status={status}>
			<StatusWrapper isImg={isImg} status={FileStatus.delete}>
				<ScopeWrapper articlePath={oldArticlePath} hasParentPath={hasParentPath} scope={oldScope}>
					{oldChildren}
				</ScopeWrapper>
			</StatusWrapper>
			<Divider style={{ marginBottom: "0.5rem", marginTop: "0.5rem" }} />
			<StatusWrapper isImg={isImg} status={FileStatus.new}>
				<ScopeWrapper articlePath={newArticlePath} hasParentPath={hasParentPath} scope={newScope}>
					{children}
				</ScopeWrapper>
			</StatusWrapper>
		</StatusContainer>
	);
};

export interface UseResourceArticleViewType {
	parentPath: DiffFilePaths;
	id: number;
	resourcePath: Path;
	type: ResourceType;
	oldResourcePath?: Path;
	filePath?: DiffFilePaths;
	relativeTo?: Path;
	oldRelativeTo?: Path;
	status?: FileStatus;
	newContent?: string;
	oldContent?: string;
	oldScope?: TreeReadScope;
	newScope?: TreeReadScope;
}

const ExactResourceViewWithContent = (props: UseResourceArticleViewType) => {
	const {
		parentPath,
		id,
		resourcePath,
		type,
		oldResourcePath,
		relativeTo,
		oldRelativeTo,
		newContent,
		oldContent,
		filePath,
		status,
		oldScope,
		newScope,
	} = props;
	const ext = resourcePath.extension;

	const isTextTooLarge =
		type === "text" &&
		(getStringByteSize(newContent) > DOCUMENT_SIZE_LIMIT_BYTES ||
			getStringByteSize(oldContent) > DOCUMENT_SIZE_LIMIT_BYTES);
	const src = relativeTo ? relativeTo.getRelativePath(resourcePath).value : resourcePath.nameWithExtension;
	const oldSrc = oldRelativeTo
		? oldRelativeTo.getRelativePath(oldResourcePath).value
		: oldResourcePath.nameWithExtension;
	const isDeleteOrAdded = status === FileStatus.delete || status === FileStatus.new;

	const { element, oldElement } = useResourceViewResolver({
		type,
		src,
		oldSrc,
		extension: ext,
		parentPath,
		filePath,
		isDeleteOrAdded,
	});

	return (
		<ResourceDiffView
			filePath={filePath}
			isTextTooLarge={isTextTooLarge}
			key={filePath.path}
			newContent={newContent}
			oldContent={oldContent}
			type={type}
		>
			{element && (
				<Center className="article" key={id}>
					<DiffResourceScopesWrapper
						newScope={newScope}
						oldChildren={oldElement}
						oldScope={oldScope}
						parentPath={parentPath}
						status={status}
						type={type}
					>
						{element}
					</DiffResourceScopesWrapper>
				</Center>
			)}
		</ResourceDiffView>
	);
};

const Center = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100%;
	height: 100%;
`;

const StatusWrapper = styled.div<{ status: FileStatus; isImg: boolean }>`
	${({ status, isImg }) => {
		if (status !== FileStatus.new && status !== FileStatus.delete) return "";

		const statusStyles = css`
			border: 2px solid var(--color-status-${status === FileStatus.new ? "new" : "deleted"});
			border-radius: 2px;
		`;

		return isImg
			? css`
					img {
						${statusStyles}
						box-shadow: none;
					}
			  `
			: statusStyles;
	}};
`;

type ContextWrapperProps = { children: JSX.Element; scope?: TreeReadScope } & (
	| { hasParentPath: false }
	| { hasParentPath: true; articlePath: string }
);

const ScopeWrapper = (props: ContextWrapperProps) => {
	const { scope, children, hasParentPath } = props;

	if (hasParentPath) {
		return (
			<ArticleContextWrapper articlePath={props.articlePath} scope={scope}>
				{children}
			</ArticleContextWrapper>
		);
	}

	return <CatalogContextWrapper scope={scope}>{children}</CatalogContextWrapper>;
};

const Message = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100%;
	padding: 1rem;
	text-align: center;
	color: var(--color-text-secondary);
`;

const DiffMessage = ({ children, resourcePath }: { children: JSX.Element; resourcePath: string }) => {
	const { isTauri } = usePlatform();
	return (
		<Message>
			<div>
				{children}
				{isTauri && (
					<Center className="mt-2">
						<OpenUnknownFile resourcePath={resourcePath} />
					</Center>
				)}
			</div>
		</Message>
	);
};

const ResourceDiffView = (props: ResourceDiffViewProps) => {
	const { children, type, newContent, oldContent, filePath, isTextTooLarge } = props;
	const diffViewService = useDiffViewMode();
	const [diffView, setDiffView] = useState(diffViewService);
	const hasContent = !!oldContent || !!newContent;

	const isWysiwyg = diffView === "wysiwyg-single" || diffView === "wysiwyg-double";

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useLayoutEffect(() => {
		if (type === "text" && isWysiwyg) setDiffView("single-panel");
		if (type === "image" && !hasContent) setDiffView("wysiwyg-single");
	}, []);

	const setupRightNavCloseHandler = useSetupRightNavCloseHandler();

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		setupRightNavCloseHandler();
	}, []);

	const restoreRightSidebar = useRestoreRightSidebar();

	useEffect(() => {
		const listener = () => {
			restoreRightSidebar();
			ArticleViewService.setDefaultView();
			refreshPage();
		};

		const token = NavigationEvents.on("item-click", listener);

		return () => {
			NavigationEvents.off(token);
		};
	}, [restoreRightSidebar]);

	const resourceView = () => {
		if (isTextTooLarge)
			return <DiffMessage resourcePath={filePath?.path}>{t("diff.file-too-large-for-preview")}</DiffMessage>;
		if (type === "unknown")
			return <DiffMessage resourcePath={filePath?.path}>{t("diff.unknown-extension")}</DiffMessage>;
		if (isWysiwyg) return children;
		return (
			<DiffFileInput
				containerStyles={{ padding: "0" }}
				height={"100vh"}
				modified={newContent}
				onMount={(editor) => {
					// https://github.com/microsoft/monaco-editor/issues/4448
					editor.getOriginalEditor().updateOptions({ glyphMargin: false });
				}}
				options={{
					readOnly: true,
					renderSideBySide: diffView === "double-panel",
					useInlineViewWhenSpaceIsLimited: false,
					glyphMargin: false,
				}}
				original={oldContent}
			/>
		);
	};

	return (
		<>
			{resourceView()}
			<RenderDiffBottomBarInBody
				diffViewMode={diffView}
				filePath={filePath}
				hasWysiwyg={type !== "text" && type !== "unknown"}
				newRevision={null}
				oldRevision={null}
				onDiffViewPick={(mode) => {
					setDiffView(mode);
					updateDiffViewMode(mode);
				}}
				showDiffViewChanger={hasContent && !isTextTooLarge && type !== "unknown"}
				title={null}
			/>
		</>
	);
};

export default ExactResourceViewWithContent;
