import Divider from "@components/Atoms/Divider";
import DiffFileInput from "@components/Atoms/FileInput/DiffFileInput/DiffFileInput";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import DiffViewModeService from "@core-ui/ContextServices/DiffViewModeService";
import useSetupRightNavCloseHandler from "@core-ui/hooks/diff/useSetupRightNavCloseHandler";
import Path from "@core/FileProvider/Path/Path";
import DiagramType from "@core/components/Diagram/DiagramType";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { DiffFilePaths } from "@ext/VersionControl/model/Diff";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import DiagramData from "@ext/markdown/elements/diagrams/component/DiagramData";
import RenderDiffBottomBarInArticle from "@ext/markdown/elements/diff/components/RenderDiffBottomBarInArticle";
import ScopeWrapper from "@ext/markdown/elements/diff/components/ScopeWrapper";
import Image from "@ext/markdown/elements/image/render/components/Image";
import { useLayoutEffect, useState } from "react";

const IMG_FILE_TYPES = ["png", "jpg", "jpeg", "bmp", "svg", "gif", "webp", "avif", "tiff", "heif", "ico", "pdf"];
const DIAGRAM_FILE_TYPES = {
	mermaid: DiagramType.mermaid,
	puml: DiagramType["plant-uml"],
	ts: DiagramType["ts-diagram"],
	dsl: DiagramType["c4-diagram"],
};

interface DiffResourceScopesWrapperProps {
	children: JSX.Element;
	oldScope: TreeReadScope;
	status: FileStatus;
	newScope: TreeReadScope;
	apiUrlCreator: ApiUrlCreator;
	oldChildren?: JSX.Element;
	oldApiUrlCreator?: ApiUrlCreator;
}

const DiffResourceScopesWrapper = (props: DiffResourceScopesWrapperProps) => {
	const { children, oldScope, newScope, status, oldChildren, apiUrlCreator, oldApiUrlCreator } = props;
	if (!oldChildren)
		return (
			<ApiUrlCreatorService.Provider value={apiUrlCreator}>
				<ScopeWrapper scope={status === FileStatus.delete ? oldScope : newScope}>{children}</ScopeWrapper>
			</ApiUrlCreatorService.Provider>
		);

	return (
		<div>
			<ApiUrlCreatorService.Provider value={oldApiUrlCreator}>
				<ScopeWrapper scope={oldScope}>{oldChildren}</ScopeWrapper>
			</ApiUrlCreatorService.Provider>
			<Divider style={{ marginBottom: "0.5rem", marginTop: "0.5rem" }} />
			<ApiUrlCreatorService.Provider value={apiUrlCreator}>
				<ScopeWrapper scope={newScope}>{children}</ScopeWrapper>
			</ApiUrlCreatorService.Provider>
		</div>
	);
};

export interface UseResourceArticleViewType {
	id: number;
	apiUrlCreator: ApiUrlCreator;
	resourcePath: Path;
	oldApiUrlCreator?: ApiUrlCreator;
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

const useExactArticleView = (props: UseResourceArticleViewType) => {
	const {
		id,
		apiUrlCreator,
		resourcePath,
		oldResourcePath,
		oldApiUrlCreator,
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

	let type: "image" | "diagram" | "text" = "text";
	let element: JSX.Element = null;
	let oldElement: JSX.Element = null;

	if (IMG_FILE_TYPES.includes(ext)) {
		element = <Image src={src} marginBottom={"0px"} />;
		oldElement = isDeleteOrAdded ? null : <Image src={oldSrc} marginBottom={"0px"} />;
		type = "image";
	} else if (maybeDiagramType) {
		element = <DiagramData src={src} diagramName={maybeDiagramType} />;
		oldElement = isDeleteOrAdded ? null : <DiagramData src={oldSrc} diagramName={maybeDiagramType} />;
		type = "diagram";
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
					<StatusWrapper status={status}>
						<DiffResourceScopesWrapper
							oldScope={oldScope}
							newScope={newScope}
							status={status}
							oldChildren={oldElement}
							apiUrlCreator={apiUrlCreator}
							oldApiUrlCreator={oldApiUrlCreator}
						>
							{element}
						</DiffResourceScopesWrapper>
					</StatusWrapper>
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

const StatusWrapper = styled.div<{ status: FileStatus }>`
	${({ status }) => {
		if (status !== FileStatus.new && status !== FileStatus.delete) return "";
		return css`
			border: 2px solid var(--color-status-${status === FileStatus.new ? "new" : "deleted"});
			border-radius: 2px;

			img {
				box-shadow: none;
			}
		`;
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

	useLayoutEffect(() => {
		if (type === "text" && diffViewService === "wysiwyg") setDiffView("single-panel");
		if (type === "image" && !hasContent) setDiffView("wysiwyg");
	}, []);

	useSetupRightNavCloseHandler();

	const resourceView = () => {
		if (diffView === "wysiwyg") return children;
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
			<RenderDiffBottomBarInArticle
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

export default useExactArticleView;
