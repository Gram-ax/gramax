import GoToArticle from "@components/Actions/GoToArticle";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import type { SnippetUsagesItemProps } from "@ext/markdown/elements/snippet/edit/components/Tab/SnippetUsages";
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
import { Label } from "@ui-kit/Label";
import { ScrollShadowContainer } from "@ui-kit/ScrollShadowContainer";
import { Table, TableBody, TableCell, TableRow } from "@ui-kit/Table";
import { useEffect, useState } from "react";

export interface SnippetAlreadyUseWarnProps {
	snippetId: string;
	onSubmit: () => void;
	onClose?: () => void;
}

const ScrollShadowContainerStyled = styled(ScrollShadowContainer)`
	max-height: 25vh;
`;

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

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		void fetchSnippetUsages();
	}, []);

	const onOpenChange = (value: boolean) => {
		setIsOpen(value);
		if (!value) onClose?.();
	};

	return (
		<AlertDialog onOpenChange={onOpenChange} open={isOpen}>
			<AlertDialogContent status="warning">
				<AlertDialogHeader>
					<AlertDialogIcon icon="alert-circle" />
					<AlertDialogTitle>{t("deleting-snippet-in-use")}</AlertDialogTitle>
					<AlertDialogDescription>
						{t("delete-snippet-desc")}
						<br />
						{list.length > 0 && (
							<ScrollShadowContainerStyled className="py-2">
								<div className="rounded-lg border">
									<Table>
										<TableBody className="[&_tr:last-child]:border-0">
											{list.map((usage) => (
												<TableRow key={`${usage.pathname}`}>
													<TableCell>
														<Label>
															<GoToArticle
																href={usage.pathname}
																style={{ color: "var(--color-link)" }}
																trigger={usage.title}
															/>
														</Label>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</ScrollShadowContainerStyled>
						)}
						{t("delete-snippet-warn")}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel variant="outline">{t("cancel")}</AlertDialogCancel>
					<AlertDialogAction onClick={onSubmit} variant="primary">
						{t("continue")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default SnippetAlreadyUseWarn;
