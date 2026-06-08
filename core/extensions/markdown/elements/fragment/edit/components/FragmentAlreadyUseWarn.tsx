import GoToArticle from "@components/Actions/GoToArticle";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import type { FragmentUsagesItemProps } from "@ext/markdown/elements/fragment/edit/components/Tab/FragmentUsages";
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

export interface FragmentAlreadyUseWarnProps {
	fragmentId: string;
	onSubmit: () => void;
	onClose?: () => void;
}

const ScrollShadowContainerStyled = styled(ScrollShadowContainer)`
	max-height: 25vh;
`;

const FragmentAlreadyUseWarn = ({ fragmentId, onSubmit, onClose }: FragmentAlreadyUseWarnProps) => {
	const [list, setList] = useState<FragmentUsagesItemProps[]>([]);
	const [isOpen, setIsOpen] = useState(true);
	const apiUrlCreator = ApiUrlCreatorService.value;

	const fetchFragmentUsages = async () => {
		const url = apiUrlCreator.getArticlesWithFragment(fragmentId);
		const res = await FetchService.fetch(url);

		if (res.ok) {
			const snippets = await res.json();
			setList(snippets);
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		void fetchFragmentUsages();
	}, []);

	const onOpenChange = (value: boolean) => {
		setIsOpen(value);
		if (!value) onClose?.();
	};

	const inUse = list.length > 0;

	return (
		<AlertDialog onOpenChange={onOpenChange} open={isOpen}>
			<AlertDialogContent status="warning">
				<AlertDialogHeader>
					<AlertDialogIcon icon="alert-circle" />
					<AlertDialogTitle>
						{inUse ? t("deleting-fragment-in-use") : t("delete-fragment-confirm")}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{inUse ? (
							<>
								{t("delete-fragment-desc")}
								<br />
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
								{t("delete-fragment-warn")}
							</>
						) : (
							t("delete-fragment-confirm-not-use")
						)}
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

export default FragmentAlreadyUseWarn;
