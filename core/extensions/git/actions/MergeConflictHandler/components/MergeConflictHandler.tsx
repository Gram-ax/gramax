import FileInput from "@components/Atoms/FileInput/FileInput";
import getCodeLensDefaultText from "@components/Atoms/FileInput/getCodeLenseDefaultText";
import getFileInputDefaultLanguage from "@components/Atoms/FileInput/getFileInputDefaultLanguage";
import SidebarArticleElement from "@components/Layouts/Sidebar";
import StatusBarElement from "@components/Layouts/StatusBar/StatusBarElement";
import styled from "@emotion/styled";
import getCodeLensReversedText from "@ext/git/actions/MergeConflictHandler/error/logic/getCodeLensReversedText";
import reverseMergeStatus from "@ext/git/actions/MergeConflictHandler/logic/GitMergeStatusReverse";
import haveConflictWithFileDelete from "@ext/git/actions/MergeConflictHandler/logic/haveConflictWithFileDelete";
import FileInputMergeConflict, {
	type CodeLensText,
} from "@ext/git/actions/MergeConflictHandler/Monaco/logic/FileInputMergeConflict";
import { GitMarkers } from "@ext/git/actions/MergeConflictHandler/Monaco/logic/mergeConflictParser";
import GitMergeStatus from "@ext/git/actions/MergeConflictHandler/model/GitMergeStatus";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { Loader } from "@ui-kit/Loader";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
} from "@ui-kit/Sidebar";
import type { editor } from "monaco-editor";
import type * as monacoType from "monaco-editor/esm/vs/editor/editor.api";
import { useCallback, useEffect, useRef, useState } from "react";
import SidebarArticleLink from "../../Publish/components/SidebarArticleLink";
import type { GitMergeResultContent } from "../model/GitMergeResultContent";

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
	overflow: hidden;
`;

const SidebarWithIcon = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	justify-content: space-between;
	width: 100%;
`;

const SidebarContainer = styled(SidebarProvider)`
	height: 100%;
	min-height: unset;
	max-height: 100%;
	overflow: hidden;

	ul {
		list-style: none !important;
	}

	li {
		line-height: unset;
		margin-bottom: unset;
	}
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
	const resolvedType = reverseMerge ? reverseMergeStatus(type) : type;
	const codeLensText = reverseMerge ? getCodeLensReversedText() : getCodeLensDefaultText();
	switch (resolvedType) {
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
	const [selectedIdx, setSelectedIdx] = useState(0);
	const currentIdx = useRef(0);

	const editorRef = useRef<editor.IStandaloneCodeEditor>(null);
	const monacoRef = useRef<typeof monacoType>(null);
	const fileInputMergeConflictRef = useRef<FileInputMergeConflict>(null);

	const isAllMergesResolved = mergeFilesModel.every((m) => m.conflictsCount === 0);

	const currentOnMerge = useCallback(() => {
		onMerge(mergeFilesModel.map((m) => m.mergeFile));
	}, [mergeFilesModel, onMerge]);

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
	}, [isAllMergesResolved, currentOnMerge]);

	const handleSidebarItemClick = (idx: number) => {
		const prevIdx = currentIdx.current;
		currentIdx.current = idx;
		setSelectedIdx(idx);

		const mergeModelBefore = mergeFilesModel[prevIdx];
		if (editorRef.current && mergeModelBefore) {
			mergeModelBefore.editorState.viewState = editorRef.current.saveViewState();
		}

		const currentMergeModel = mergeFilesModel[idx];

		if (fileInputMergeConflictRef.current) {
			const isConflictWithFileDelete = haveConflictWithFileDelete(currentMergeModel.mergeFile.status);
			fileInputMergeConflictRef.current.haveConflictWithFileDelete = isConflictWithFileDelete;
			fileInputMergeConflictRef.current.codeLensText = getCodeLensText(
				currentMergeModel.mergeFile.status,
				reverseMerge,
			);
		}

		if (editorRef.current) {
			editorRef.current.setModel(currentMergeModel.editorState.textModel);
			fileInputMergeConflictRef.current?.onChange();
			editorRef.current.restoreViewState(currentMergeModel.editorState.viewState);
			editorRef.current.focus();
		}
	};

	return (
		<SidebarContainer>
			<Sidebar className="h-full" collapsible="none" data-qa={`article-git-modal`}>
				<SidebarContent className="left-sidebar">
					<SidebarGroup>
						<SidebarGroupContent>
							<SidebarMenu>
								{mergeFilesModel.map((model, idx) => {
									const isLoading = model.conflictsCount === null;
									const haveConflict = model.conflictsCount > 0;
									const conflictCounterOrCheck = (
										<IconWrapper haveConflict={haveConflict} key={model.mergeFile.path}>
											<StatusBarElement
												changeBackgroundOnHover={false}
												iconCode={haveConflict ? "circle-x" : "check"}
												iconStrokeWidth="1.6"
												tooltipText={haveConflict ? t("git.merge.conflict.conflicts") : null}
											>
												{haveConflict && <span>{model.conflictsCount}</span>}
											</StatusBarElement>
										</IconWrapper>
									);
									return (
										<SidebarMenuItem key={model.mergeFile.path}>
											<SidebarMenuButton
												className="h-auto"
												isActive={selectedIdx === idx}
												onClick={() => handleSidebarItemClick(idx)}
											>
												<SidebarWithIcon>
													<SidebarWrapper isLoading={isLoading}>
														<SidebarArticleElement title={model.mergeFile.title} />
														<SidebarArticleLink filePath={{ path: model.mergeFile.path }} />
													</SidebarWrapper>
													{isLoading ? null : conflictCounterOrCheck}
												</SidebarWithIcon>
											</SidebarMenuButton>
										</SidebarMenuItem>
									);
								})}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
				<SidebarFooter className="left-sidebar-footer">
					<div className="p-4">
						<Button
							className="w-full"
							disabled={!isAllMergesResolved}
							onClick={currentOnMerge}
							variant="primary"
						>
							{t("confirm")}
						</Button>
					</div>
				</SidebarFooter>
			</Sidebar>
			<main className="w-full max-w-full overflow-hidden">
				<div className="flex-1 h-full">
					<FileInput
						height={"100%"}
						loading={<Loader size="lg" />}
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
						style={{ padding: "unset" }}
						value={mergeFilesModel[0].mergeFile.content}
					/>
				</div>
			</main>
		</SidebarContainer>
	);
};

export default MergeConflictHandler;
