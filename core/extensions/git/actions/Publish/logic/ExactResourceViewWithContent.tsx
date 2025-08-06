import Divider from "@components/Atoms/Divider";
import DiffFileInput from "@components/Atoms/FileInput/DiffFileInput/DiffFileInput";
import ArticleContextWrapper from "@core-ui/ArticleContextWrapper/ArticleContextWrapper";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import DiffViewModeService from "@core-ui/ContextServices/DiffViewModeService";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import useRestoreRightSidebar from "@core-ui/hooks/diff/useRestoreRightSidebar";
import useSetupRightNavCloseHandler from "@core-ui/hooks/diff/useSetupRightNavCloseHandler";
import Path from "@core/FileProvider/Path/Path";
import DiagramType from "@core/components/Diagram/DiagramType";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { DiffFilePaths } from "@ext/VersionControl/model/Diff";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import DiagramData from "@ext/markdown/elements/diagrams/component/DiagramData";
import RenderDiffBottomBarInBody from "@ext/markdown/elements/diff/components/RenderDiffBottomBarInBody";
import Image from "@ext/markdown/elements/image/render/components/Image";
import NavigationEvents from "@ext/navigation/NavigationEvents";
import { useEffect, useLayoutEffect, useState } from "react";

export const IMG_FILE_TYPES = ["png", "jpg", "jpeg", "bmp", "svg", "gif", "webp", "avif", "tiff", "heif", "ico", "pdf"];
export const DIAGRAM_FILE_TYPES = {
	mermaid: DiagramType.mermaid,
	puml: DiagramType["plant-uml"],
	ts: DiagramType["ts-diagram"],
	dsl: DiagramType["c4-diagram"],
};

interface DiffResourceScopesWrapperProps {
	parentPath: DiffFilePaths;
	children: JSX.Element;
	oldScope: TreeReadScope;
	status: FileStatus;
	type: "image" | "diagram" | "text";
	newScope: TreeReadScope;
	oldChildren?: JSX.Element;
}

const DiffResourceScopesWrapper = (props: DiffResourceScopesWrapperProps) => {
	const { children, oldScope, newScope, status, oldChildren, parentPath, type } = props;

	const currentArticlePath = ArticlePropsService.value?.ref.path;
	const catalogName = CatalogPropsService.value?.name;

	const newArticlePath = parentPath?.path ? Path.join(catalogName, parentPath.path) : currentArticlePath;
	const oldArticlePath = parentPath?.oldPath ? Path.join(catalogName, parentPath.oldPath) : currentArticlePath;

	const isImg = type === "image";

	if (!oldChildren) {
		const isDeleted = status === FileStatus.delete;

		return (
			<StatusWrapper status={status} isImg={isImg}>
				<ArticleContextWrapper
					articlePath={isDeleted ? oldArticlePath : newArticlePath}
					scope={isDeleted ? oldScope : newScope}
				>
					{children}
				</ArticleContextWrapper>
			</StatusWrapper>
		);
	}

	return (
		<div>
			<StatusWrapper status={FileStatus.delete} isImg={isImg}>
				<ArticleContextWrapper articlePath={oldArticlePath} scope={oldScope}>
					{oldChildren}
				</ArticleContextWrapper>
			</StatusWrapper>
			<Divider style={{ marginBottom: "0.5rem", marginTop: "0.5rem" }} />
			<StatusWrapper status={FileStatus.new} isImg={isImg}>
				<ArticleContextWrapper articlePath={newArticlePath} scope={newScope}>
					{children}
				</ArticleContextWrapper>
			</StatusWrapper>
		</div>
	);
};

export interface UseResourceArticleViewType {
	parentPath: DiffFilePaths;
	id: number;
	resourcePath: Path;
	type: "image" | "diagram" | "text";
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
	const src = relativeTo ? relativeTo.getRelativePath(resourcePath).value : resourcePath.nameWithExtension;
	const oldSrc = oldRelativeTo
		? oldRelativeTo.getRelativePath(oldResourcePath).value
		: oldResourcePath.nameWithExtension;
	const maybeDiagramType = DIAGRAM_FILE_TYPES[ext];
	const isDeleteOrAdded = status === FileStatus.delete || status === FileStatus.new;

	let element: JSX.Element = null;
	let oldElement: JSX.Element = null;

	if (type === "image") {
		element = <Image src={src} marginBottom={"0px"} />;
		oldElement = isDeleteOrAdded ? null : <Image src={oldSrc} marginBottom={"0px"} />;
	} else if (type === "diagram") {
		element = <DiagramData src={src} diagramName={maybeDiagramType} />;
		oldElement = isDeleteOrAdded ? null : <DiagramData src={oldSrc} diagramName={maybeDiagramType} />;
	}

	return (
		<ResourceDiffView
			type={type}
			newContent={newContent}
			oldContent={oldContent}
			filePath={filePath}
			key={filePath.path}
		>
			{element && (
				<Center className="article" key={id}>
					<DiffResourceScopesWrapper
						type={type}
						parentPath={parentPath}
						oldScope={oldScope}
						newScope={newScope}
						status={status}
						oldChildren={oldElement}
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

const ResourceDiffView = ({
	children,
	type,
	newContent,
	oldContent,
	filePath,
}: {
	children: React.ReactNode;
	type: "image" | "diagram" | "text";
	newContent: string;
	oldContent: string;
	filePath: DiffFilePaths;
}) => {
	const diffViewService = DiffViewModeService.value;
	const [diffView, setDiffView] = useState(diffViewService);
	const hasContent = !!oldContent || !!newContent;

	const isWysiwyg = diffView === "wysiwyg-single" || diffView === "wysiwyg-double";

	useLayoutEffect(() => {
		if (type === "text" && isWysiwyg) setDiffView("single-panel");
		if (type === "image" && !hasContent) setDiffView("wysiwyg-single");
	}, []);

	const setupRightNavCloseHandler = useSetupRightNavCloseHandler();

	useEffect(() => {
		setupRightNavCloseHandler();
	}, []);

	const restoreRightSidebar = useRestoreRightSidebar();

	useEffect(() => {
		const listener = () => {
			restoreRightSidebar();
			ArticleViewService.setDefaultView();
		};

		const token = NavigationEvents.on("item-click", listener);

		return () => {
			NavigationEvents.off(token);
		};
	}, [restoreRightSidebar]);

	const resourceView = () => {
		if (isWysiwyg) return children;
		return (
			<DiffFileInput
				modified={newContent}
				original={oldContent}
				height={"100vh"}
				containerStyles={{ padding: "0" }}
				options={{
					readOnly: true,
					renderSideBySide: diffView === "double-panel",
					useInlineViewWhenSpaceIsLimited: false,
					glyphMargin: false,
				}}
				onMount={(editor) => {
					// https://github.com/microsoft/monaco-editor/issues/4448
					editor.getOriginalEditor().updateOptions({ glyphMargin: false });
				}}
			/>
		);
	};

	return (
		<>
			{resourceView()}
			<RenderDiffBottomBarInBody
				showDiffViewChanger={hasContent}
				filePath={filePath}
				title={null}
				oldRevision={null}
				newRevision={null}
				diffViewMode={diffView}
				onDiffViewPick={(mode) => {
					setDiffView(mode);
					DiffViewModeService.value = mode;
				}}
				hasWysiwyg={type !== "text"}
			/>
		</>
	);
};

export default ExactResourceViewWithContent;
