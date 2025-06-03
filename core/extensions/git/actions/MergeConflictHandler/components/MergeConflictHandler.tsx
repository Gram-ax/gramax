import Button from "@components/Atoms/Button/Button";
import FileInput from "@components/Atoms/FileInput/FileInput";
import getCodeLensDefaultText from "@components/Atoms/FileInput/getCodeLenseDefaultText";
import getFileInputDefaultLanguage from "@components/Atoms/FileInput/getFileInputDefaultLanguage";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import LeftNavViewContent from "@components/Layouts/LeftNavViewContent/LeftNavViewContent";
import Sidebar from "@components/Layouts/Sidebar";
import FileInputMergeConflict, {
	CodeLensText,
} from "@ext/git/actions/MergeConflictHandler/Monaco/logic/FileInputMergeConflict";

import StatusBarElement from "@components/Layouts/StatusBar/StatusBarElement";
import styled from "@emotion/styled";
import { GitMarkers } from "@ext/git/actions/MergeConflictHandler/Monaco/logic/mergeConflictParser";
import getCodeLensReversedText from "@ext/git/actions/MergeConflictHandler/error/logic/getCodeLensReversedText";
import reverseMergeStatus from "@ext/git/actions/MergeConflictHandler/logic/GitMergeStatusReverse";
import haveConflictWithFileDelete from "@ext/git/actions/MergeConflictHandler/logic/haveConflictWithFileDelete";
import GitMergeStatus from "@ext/git/actions/MergeConflictHandler/model/GitMergeStatus";
import t from "@ext/localization/locale/translate";
import { editor } from "monaco-editor";
import type * as monacoType from "monaco-editor/esm/vs/editor/editor.api";
import { useEffect, useRef, useState } from "react";
import SidebarArticleLink from "../../Publish/components/SidebarArticleLink";
import { GitMergeResultContent } from "../model/GitMergeResultContent";

interface MergeFileModel {
	mergeFile: GitMergeResultContent;
	conflictsCount: number;
	editorState: {
		textModel: editor.IModel;
		viewState: editor.ICodeEditorViewState;
	};
}

const IconWrapper = styled.div<{ haveConflict: boolean }>`
	svg,
	span {
		color: ${({ haveConflict }) => (haveConflict ? "red" : "green")};
	}

	span {
		font-size: 10px;
		display: flex;
	}
`;

const SidebarWrapper = styled.div<{ isLoading: boolean }>`
	padding: 1rem ${({ isLoading }) => (isLoading ? "1rem" : "0")} 1rem 1rem;
	overflow: hidden;
`;

const SidebarWithIcon = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	justify-content: space-between;
	padding-right: 0.5rem;
`;

const makeDeleteConflictContent = (content: string): string => {
	return `${GitMarkers.startHeader} Deleted content\n\n${GitMarkers.splitter}\n${content}\n${GitMarkers.endFooter} Added content`;
};

const initMergeFilesModel = (mergeFiles: GitMergeResultContent[]): MergeFileModel[] => {
	return mergeFiles
		.filter((f) => f.status !== GitMergeStatus.BothDeleted)
		.map((f) => {
			const isConflictWithFileDelete = haveConflictWithFileDelete(f.status);
			const content = isConflictWithFileDelete ? makeDeleteConflictContent(f.content) : f.content;

			return {
				conflictsCount: null,
				mergeFile: { ...f, content },
				editorState: { textModel: null, viewState: null },
			};
		});
};

const getCodeLensText = (type: GitMergeStatus, reverseMerge: boolean): CodeLensText => {
	type = reverseMerge ? reverseMergeStatus(type) : type;
	const codeLensText = reverseMerge ? getCodeLensReversedText() : getCodeLensDefaultText();
	switch (type) {
		case GitMergeStatus.AddedByThem:
			return {
				...codeLensText,
				mergeWithDeletionHeader: t("git.merge.conflict.added-by-them"),
			};
		case GitMergeStatus.AddedByUs:
			return {
				...codeLensText,
				mergeWithDeletionHeader: t("git.merge.conflict.added-by-us"),
			};
		case GitMergeStatus.DeletedByThem:
			return {
				...codeLensText,
				mergeWithDeletionHeader: t("git.merge.conflict.deleted-by-them"),
			};
		case GitMergeStatus.DeletedByUs:
			return {
				...codeLensText,
				mergeWithDeletionHeader: t("git.merge.conflict.deleted-by-us"),
			};
		default:
			return codeLensText;
	}
};

const MergeConflictHandler = ({
	rawFiles,
	onMerge,
	reverseMerge,
}: {
	rawFiles: GitMergeResultContent[];
	onMerge: (result: GitMergeResultContent[]) => void;
	reverseMerge: boolean;
}) => {
	const [mergeFilesModel, setMergeFilesModel] = useState<MergeFileModel[]>(() => initMergeFilesModel(rawFiles));
	const currentIdx = useRef(0);

	const editorRef = useRef<editor.IStandaloneCodeEditor>(null);
	const monacoRef = useRef<typeof monacoType>(null);
	const fileInputMergeConflictRef = useRef<FileInputMergeConflict>(null);

	const isAllMergesResolved = mergeFilesModel.every((m) => m.conflictsCount === 0);

	const currentOnMerge = () => {
		onMerge(mergeFilesModel.map((m) => m.mergeFile));
	};

	const initModelsExceptFirst = () => {
		mergeFilesModel.forEach((model, idx) => {
			if (idx === 0) return;
			model.editorState.textModel = monacoRef.current.editor.createModel(
				model.mergeFile.content,
				getFileInputDefaultLanguage(),
			);
		});
	};

	const initConflictsCount = () => {
		mergeFilesModel.forEach((model) => {
			model.conflictsCount = FileInputMergeConflict.getMergeConflictDescriptor(
				monacoRef.current,
				model.editorState.textModel,
			).length;
		});
		setMergeFilesModel([...mergeFilesModel]);
	};

	useEffect(() => {
		const keydownHandler = (e: KeyboardEvent) => {
			if (e.code === "Enter" && (e.ctrlKey || e.metaKey) && isAllMergesResolved) currentOnMerge();
		};

		document.addEventListener("keydown", keydownHandler, false);
		return () => {
			document.removeEventListener("keydown", keydownHandler, false);
		};
	}, [isAllMergesResolved]);

	return (
		<LeftNavViewContent
			onLeftSidebarClick={(idx) => {
				const prevIdx = currentIdx.current;
				currentIdx.current = idx;

				const mergeModelBefore = mergeFilesModel[prevIdx];
				mergeModelBefore.editorState.viewState = editorRef.current.saveViewState();

				const currentMergeModel = mergeFilesModel[idx];

				if (fileInputMergeConflictRef.current) {
					const isConflictWithFileDelete = haveConflictWithFileDelete(currentMergeModel.mergeFile.status);
					fileInputMergeConflictRef.current.haveConflictWithFileDelete = isConflictWithFileDelete;
					fileInputMergeConflictRef.current.codeLensText = getCodeLensText(
						currentMergeModel.mergeFile.status,
						reverseMerge,
					);
				}

				editorRef.current.setModel(currentMergeModel.editorState.textModel);
				fileInputMergeConflictRef.current?.onChange();
				editorRef.current.restoreViewState(currentMergeModel.editorState.viewState);
				editorRef.current.focus();
			}}
			elements={mergeFilesModel.map((model) => {
				const isLoading = model.conflictsCount === null;
				const haveConflict = model.conflictsCount > 0;
				const conflictCounterOrCheck = (
					<IconWrapper haveConflict={haveConflict}>
						<StatusBarElement
							iconCode={haveConflict ? "circle-x" : "check"}
							iconStrokeWidth="1.6"
							tooltipText={haveConflict ? t("git.merge.conflict.conflicts") : null}
							changeBackgroundOnHover={false}
						>
							{haveConflict && <span>{model.conflictsCount}</span>}
						</StatusBarElement>
					</IconWrapper>
				);
				return {
					leftSidebar: (
						<SidebarWithIcon>
							<SidebarWrapper isLoading={isLoading}>
								<Sidebar title={model.mergeFile.title} />
								<SidebarArticleLink filePath={{ path: model.mergeFile.path }} />
							</SidebarWrapper>
							{isLoading ? null : conflictCounterOrCheck}
						</SidebarWithIcon>
					),
				};
			})}
			commonContent={
				<FileInput
					loading={<SpinnerLoader />}
					value={mergeFilesModel[0].mergeFile.content}
					height={"100%"}
					onChange={(value) => {
						mergeFilesModel[currentIdx.current].mergeFile.content = value;
						const mergeConflictDescriptor =
							fileInputMergeConflictRef.current?.mergeConfilctDescriptor ?? [];
						mergeFilesModel[currentIdx.current].conflictsCount = mergeConflictDescriptor.length;
						setMergeFilesModel([...mergeFilesModel]);
					}}
					onMount={(e, m, fileInputMergeConflict) => {
						editorRef.current = e;
						monacoRef.current = m;
						fileInputMergeConflictRef.current = fileInputMergeConflict;

						mergeFilesModel[0].editorState.textModel = e.getModel();
						mergeFilesModel[0].editorState.viewState = e.saveViewState();
						e.focus();

						initModelsExceptFirst();
						initConflictsCount();

						if (fileInputMergeConflictRef.current) {
							const isConflictWithFileDelete = haveConflictWithFileDelete(
								mergeFilesModel[0].mergeFile.status,
							);
							fileInputMergeConflictRef.current.haveConflictWithFileDelete = isConflictWithFileDelete;
							fileInputMergeConflictRef.current.codeLensText = getCodeLensText(
								mergeFilesModel[0].mergeFile.status,
								reverseMerge,
							);
						}
					}}
				/>
			}
			sideBarBottom={
				<div style={{ padding: "1rem" }}>
					<Button fullWidth disabled={!isAllMergesResolved} onClick={currentOnMerge}>
						<span>{t("confirm")}</span>
					</Button>
				</div>
			}
		/>
	);
};

export default MergeConflictHandler;
