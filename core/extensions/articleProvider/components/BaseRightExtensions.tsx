import { TextSize } from "@components/Atoms/Button/Button";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import EditMarkdown from "@ext/artilce/actions/EditMarkdown";
import DeleteItem from "@ext/item/actions/DeleteItem";
import t from "@ext/localization/locale/translate";
import { MouseEvent, ReactNode, useCallback } from "react";

interface DeleteItemProps {
	id: string;
	providerType: ArticleProviderType;
	confirmDeleteText?: string;
	onDelete: (id: string) => void;
	preDelete?: (id: string) => Promise<boolean>;
}

interface BaseRightExtensionsProps extends DeleteItemProps {
	items?: (id: string) => ReactNode;
	onMarkdownChange: (id: string, markdown: string) => void;
}

const Delete = ({ id, onDelete, providerType, preDelete, confirmDeleteText }: DeleteItemProps) => {
	const apiUrlCreator = ApiUrlCreatorService.value;

	const onConfirm = async () => {
		if (preDelete && !(await preDelete(id))) return;
		if (!preDelete && !(await confirm(confirmDeleteText || t("confirm-article-delete")))) return;

		await FetchService.fetch(apiUrlCreator.removeFileInGramaxDir(id, providerType));
		onDelete(id);
	};

	const onClick = (event: MouseEvent<HTMLDivElement>) => {
		event.stopPropagation();
		event.preventDefault();
	};

	return <DeleteItem onConfirm={onConfirm} onClick={onClick} />;
};

const BaseRightExtensions = (props: BaseRightExtensionsProps) => {
	const { id, onDelete, onMarkdownChange, items, providerType, preDelete, confirmDeleteText } = props;
	const apiUrlCreator = ApiUrlCreatorService.value;

	const loadContent = useCallback(async () => {
		const res = await FetchService.fetch(apiUrlCreator.getFileContentInGramaxDir(id, providerType));
		if (res.ok) return await res.json();
	}, [apiUrlCreator, id, providerType]);

	const saveContent = useCallback(
		async (content: string) => {
			const body = JSON.stringify({ content });
			await FetchService.fetch(apiUrlCreator.updateFileInGramaxDir(id, providerType), body);

			onMarkdownChange(id, content);
		},
		[apiUrlCreator, id, onMarkdownChange],
	);

	const onClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
		e.stopPropagation();
		e.preventDefault();
	}, []);

	return (
		<PopupMenuLayout
			isInline
			trigger={<ButtonLink textSize={TextSize.M} onClick={onClick} iconCode="ellipsis-vertical" />}
			offset={[0, 10]}
			tooltipText={t("actions")}
			appendTo={() => document.body}
		>
			<>
				<EditMarkdown
					trigger={<ButtonLink iconCode="pencil" text={t("article.edit-markdown")} />}
					loadContent={loadContent}
					saveContent={saveContent}
				/>
				{items?.(id)}
				<Delete
					id={id}
					onDelete={onDelete}
					providerType={providerType}
					preDelete={preDelete}
					confirmDeleteText={confirmDeleteText}
				/>
			</>
		</PopupMenuLayout>
	);
};

export default BaseRightExtensions;
