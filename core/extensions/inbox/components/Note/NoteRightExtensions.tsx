import Tooltip from "@components/Atoms/Tooltip";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import InboxService from "@ext/inbox/components/InboxService";
import { InboxArticle } from "@ext/inbox/models/types";
import DeleteItem from "@ext/item/actions/DeleteItem";
import ActionWarning, { shouldShowActionWarning } from "@ext/localization/actions/ActionWarning";
import t from "@ext/localization/locale/translate";
import { MouseEvent } from "react";
import Path from "@core/FileProvider/Path/Path";
import InboxUtility from "@ext/inbox/logic/InboxUtility";

const EllipsisMenu = ({ article }: { article: InboxArticle }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const catalogProps = CatalogPropsService.value;
	const { selectedPath, notes } = InboxService.value;

	const onClickTrigger = (e: MouseEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const onClick = async () => {
		if (!shouldShowActionWarning(catalogProps) && !(await confirm(t("confirm-article-delete")))) return;

		ErrorConfirmService.stop();
		await FetchService.fetch(apiUrlCreator.removeFileInGramaxDir(new Path(article.ref.path).name, "inbox"));
		ErrorConfirmService.start();

		if (selectedPath.includes(article.logicPath)) {
			InboxService.closeNote(article.logicPath);

			const newPaths = InboxUtility.removeSelectedPath(selectedPath, article.logicPath);
			InboxService.setSelectedPath(newPaths);
		}

		const tooltipManager = InboxService.getTooltipManager();
		const localStorageManager = tooltipManager.getLocalStorageManager();

		localStorageManager.delete(InboxUtility.getArticleID(article.fileName, article.props.date ?? ""));
		InboxService.setNotes(notes.filter((note) => note.logicPath !== article.logicPath));
	};

	return (
		<Tooltip content={t("delete")}>
			<div onClick={onClickTrigger} style={{ paddingLeft: "0.5rem" }}>
				<ActionWarning isDelete catalogProps={catalogProps} action={onClick}>
					<div>
						<DeleteItem text={null} />
					</div>
				</ActionWarning>
			</div>
		</Tooltip>
	);
};

const NoteRightExtensions = ({ article }: { article: InboxArticle }) => {
	return (
		<div className="note-actions">
			<EllipsisMenu article={article} />
		</div>
	);
};

export default NoteRightExtensions;
