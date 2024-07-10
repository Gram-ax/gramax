import Button from "@components/Atoms/Button/Button";
import FileInput from "@components/Atoms/FileInput/FileInput";
import getFileInputDefaultLanguage from "@components/Atoms/FileInput/getFileInputDefaultLanguage";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import LeftNavViewContent from "@components/Layouts/LeftNavViewContent/LeftNavViewContent";
import Sidebar from "@components/Layouts/Sidebar";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import FileInputMergeConflict, {
	CodeLensText,
} from "@ext/git/actions/MergeConflictHandler/Monaco/logic/FileInputMergeConflict";
import { GitMarkers } from "@ext/git/actions/MergeConflictHandler/Monaco/logic/mergeConflictParser";
import reverseMergeConflict from "@ext/git/actions/MergeConflictHandler/error/logic/reverseMergeConflict";
import reverseMergeStatus from "@ext/git/actions/MergeConflictHandler/logic/GitMergeStatusReverse";
import GitMergeStatus from "@ext/git/actions/MergeConflictHandler/model/GitMergeStatus";
import Language from "@ext/localization/core/model/Language";
import useBareLocalize from "@ext/localization/useLocalize/useBareLocalize";
import { editor } from "monaco-editor";
import type * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { useEffect, useRef, useState } from "react";
import useLocalize from "../../../../localization/useLocalize";
import SidebarArticleLink from "../../Publish/components/SidebarArticleLink";
import { GitMergeResultContent } from "../model/GitMergeResultContent";

interface MergeFileModel {
	mergeFile: GitMergeResultContent;
	haveMerges: boolean;
	reverseMerge: boolean;
	editorState: {
		textModel: editor.IModel;
		viewState: editor.ICodeEditorViewState;
	};
}

const haveConflictWithFileDelete = (gitMergeStatus: GitMergeStatus): boolean =>
	[
		GitMergeStatus.AddedByUs,
		GitMergeStatus.AddedByThem,
		GitMergeStatus.DeletedByUs,
		GitMergeStatus.DeletedByThem,
	].includes(gitMergeStatus);

const makeDeleteConflictContent = (content: string): string => {
	return `${GitMarkers.startHeader} Deleted content\n\n${GitMarkers.splitter}\n${content}\n${GitMarkers.endFooter} Added content`;
};

const initMergeFilesModel = (mergeFiles: GitMergeResultContent[], reverseMerge: boolean): MergeFileModel[] => {
	return mergeFiles
		.filter((f) => f.status !== GitMergeStatus.BothDeleted)
		.map((f) => {
			const isConflictWithFileDelete = haveConflictWithFileDelete(f.status);
			const content = isConflictWithFileDelete ? makeDeleteConflictContent(f.content) : f.content;
			return {
				mergeFile: { ...f, content },
				haveMerges: true,
				reverseMerge,
				editorState: { textModel: null, viewState: null },
			};
		});
};

const getCodeLensText = (
	defaultCodeLensText: CodeLensText,
	lang: Language,
	type: GitMergeStatus,
	reverseMerge: boolean,
): CodeLensText => {
	type = reverseMerge ? reverseMergeStatus(type) : type;
	switch (type) {
		case GitMergeStatus.AddedByThem:
			return {
				...defaultCodeLensText,
				mergeWithDeletionHeader: useBareLocalize("mergeConflictAddedByThem", lang),
			};
		case GitMergeStatus.AddedByUs:
			return {
				...defaultCodeLensText,
				mergeWithDeletionHeader: useBareLocalize("mergeConflictAddedByUs", lang),
			};
		case GitMergeStatus.DeletedByThem:
			return {
				...defaultCodeLensText,
				mergeWithDeletionHeader: useBareLocalize("mergeConflictDeletedByThem", lang),
			};
		case GitMergeStatus.DeletedByUs:
			return {
				...defaultCodeLensText,
				mergeWithDeletionHeader: useBareLocalize("mergeConflictDeletedByUs", lang),
			};
		default:
			return defaultCodeLensText;
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
	const confirmText = useLocalize("confirm");
	const [mergeFilesModel] = useState<MergeFileModel[]>(() => initMergeFilesModel(rawFiles, reverseMerge));
	const currentIdx = useRef(0);

	const lang = PageDataContextService.value.lang;
	const editorRef = useRef<editor.IStandaloneCodeEditor>(null);
	const monacoRef = useRef<typeof monaco>(null);
	const fileInputMergeConflictRef = useRef<FileInputMergeConflict>(null);

	const [isAllMergesResolved, setIsAllMergesResolved] = useState(false);

	const currentOnMerge = () => {
		onMerge(mergeFilesModel.map((m) => m.mergeFile));
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

	const reverseMergeInModel = (mergeFileModel: MergeFileModel) => {
		const mergeConflictDescriptor = fileInputMergeConflictRef.current?.mergeConfilctDescriptor ?? [];
		const modelToReverse = monacoRef.current.editor.createModel(mergeFileModel.mergeFile.content);
		reverseMergeConflict(modelToReverse, mergeConflictDescriptor);

		const reversedConflictText = modelToReverse.getValue();
		editorRef.current.setValue(reversedConflictText);
		fileInputMergeConflictRef.current?.onChange();

		mergeFileModel.reverseMerge = false;
		mergeFileModel.mergeFile.content = reversedConflictText;
	};

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
					if (isConflictWithFileDelete) {
						fileInputMergeConflictRef.current.codeLensText = getCodeLensText(
							fileInputMergeConflictRef.current.codeLensText,
							lang,
							currentMergeModel.mergeFile.status,
							currentMergeModel.reverseMerge,
						);
					}
				}

				if (currentMergeModel.editorState.textModel) {
					editorRef.current.setModel(currentMergeModel.editorState.textModel);
					fileInputMergeConflictRef.current?.onChange();
					editorRef.current.restoreViewState(currentMergeModel.editorState.viewState);
					editorRef.current.focus();
					return;
				}

				currentMergeModel.editorState.textModel = monacoRef.current.editor.createModel(
					currentMergeModel.mergeFile.content,
					getFileInputDefaultLanguage(),
				);
				editorRef.current.setModel(currentMergeModel.editorState.textModel);
				editorRef.current.focus();
				fileInputMergeConflictRef.current?.onChange();

				if (currentMergeModel.reverseMerge) {
					reverseMergeInModel(currentMergeModel);
					return;
				}
			}}
			elements={mergeFilesModel.map((model) => {
				return {
					leftSidebar: (
						<div style={{ padding: "1rem" }}>
							<Sidebar title={model.mergeFile.title} />
							<SidebarArticleLink filePath={{ path: model.mergeFile.path }} />
						</div>
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
						mergeFilesModel[currentIdx.current].haveMerges = !!mergeConflictDescriptor.length;
						setIsAllMergesResolved(mergeFilesModel.map((x) => x.haveMerges).every((x) => !x));
					}}
					onMount={(e, m, fileInputMergeConflict) => {
						editorRef.current = e;
						monacoRef.current = m;
						fileInputMergeConflictRef.current = fileInputMergeConflict;

						mergeFilesModel[0].editorState.textModel = e.getModel();
						mergeFilesModel[0].editorState.viewState = e.saveViewState();
						e.focus();

						if (fileInputMergeConflictRef.current) {
							const isConflictWithFileDelete = haveConflictWithFileDelete(
								mergeFilesModel[0].mergeFile.status,
							);
							fileInputMergeConflictRef.current.haveConflictWithFileDelete = isConflictWithFileDelete;
							if (isConflictWithFileDelete) {
								fileInputMergeConflictRef.current.codeLensText = getCodeLensText(
									fileInputMergeConflictRef.current.codeLensText,
									lang,
									mergeFilesModel[0].mergeFile.status,
									mergeFilesModel[0].reverseMerge,
								);
							}
						}
						if (mergeFilesModel[0].reverseMerge) reverseMergeInModel(mergeFilesModel[0]);
					}}
				/>
			}
			sideBarBottom={
				<div style={{ padding: "1rem" }}>
					<Button fullWidth disabled={!isAllMergesResolved} onClick={currentOnMerge}>
						<span>{confirmText}</span>
					</Button>
				</div>
			}
		/>
	);
};

export default MergeConflictHandler;
