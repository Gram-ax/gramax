import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import InputFile from "@components/Atoms/InputFile";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";
import createFile from "../logic/createFile";

const FileMenuButton = ({ editor, onSave }: { editor: Editor; onSave?: () => void }) => {
	const lang = PageDataContextService.value.lang;
	const articleProps = ArticlePropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	return (
		<InputFile
			onChange={(event) => {
				const filesArray = Array.from(event.currentTarget.files);
				createFile(filesArray, editor.view, articleProps, apiUrlCreator, lang);
				onSave?.();
			}}
		>
			<Button
				icon="file"
				nodeValues={{ mark: "file" }}
				tooltipText="Файл"
				onClick={() => ArticleUpdaterService.stopLoadingAfterFocus()}
			/>
		</InputFile>
	);
};

export default FileMenuButton;
