import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import EditMarkdownTrigger from "@ext/article/actions/EditMarkdownTrigger";
import { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import DeleteItem from "@ext/item/actions/DeleteItem";
import t from "@ext/localization/locale/translate";
import { IconButton } from "@ui-kit/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@ui-kit/Dropdown";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { ReactNode, useCallback } from "react";

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

	return <DeleteItem onConfirm={onConfirm} />;
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

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<div style={{ marginLeft: "-3px" }}>
					<Tooltip>
						<TooltipTrigger asChild>
							<IconButton
								icon="ellipsis-vertical"
								variant="text"
								size="xs"
								style={{ overflow: "visible" }}
							/>
						</TooltipTrigger>
						<TooltipContent>{t("actions")}</TooltipContent>
					</Tooltip>
				</div>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				<EditMarkdownTrigger loadContent={loadContent} saveContent={saveContent} />
				{items?.(id)}
				<Delete
					id={id}
					onDelete={onDelete}
					providerType={providerType}
					preDelete={preDelete}
					confirmDeleteText={confirmDeleteText}
				/>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default BaseRightExtensions;
