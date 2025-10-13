import GoToArticle from "@components/Actions/GoToArticle";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import t from "@ext/localization/locale/translate";
import { SnippetUsagesItemProps } from "@ext/markdown/elements/snippet/edit/components/Tab/SnippetUsages";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogIcon,
	AlertDialogTitle,
} from "@ui-kit/AlertDialog";
import { useEffect, useState } from "react";

export interface SnippetAlreadyUseWarnProps {
	snippetId: string;
	onSubmit: () => void;
	onClose?: () => void;
}

const SnippetAlreadyUseWarn = ({ snippetId, onSubmit, onClose }: SnippetAlreadyUseWarnProps) => {
	const [list, setList] = useState<SnippetUsagesItemProps[]>([]);
	const [isOpen, setIsOpen] = useState(true);
	const apiUrlCreator = ApiUrlCreatorService.value;

	const fetchSnippetUsages = async () => {
		const url = apiUrlCreator.getArticlesWithSnippet(snippetId);
		const res = await FetchService.fetch(url);

		if (!res.ok) return;
		const snippets = await res.json();

		setList(snippets);
	};

	useEffect(() => {
		void fetchSnippetUsages();
	}, []);

	const onOpenChange = (value: boolean) => {
		setIsOpen(value);
		if (!value) onClose?.();
	};

	return (
		<AlertDialog open={isOpen} onOpenChange={onOpenChange}>
			<AlertDialogContent status="warning">
				<AlertDialogHeader>
					<AlertDialogIcon icon="alert-circle" />
					<AlertDialogTitle>{t("deleting-snippet-in-use")}</AlertDialogTitle>
					<AlertDialogDescription>
						{t("delete-snippet-desc")}.<br />
						{list.length > 0 && (
							<>
								{t("delete-snippet-list-desc")}
								<div className="article" style={{ background: "transparent" }}>
									<ul>
										{list.map((item) => (
											<li key={item.pathname}>
												<GoToArticle
													href={item.pathname}
													trigger={item.title}
													style={{ color: "var(--color-link)" }}
												/>
											</li>
										))}
									</ul>
								</div>
							</>
						)}
						{t("delete-snippet-warn")}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
					<AlertDialogAction onClick={onSubmit}>{t("continue")}</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default SnippetAlreadyUseWarn;
