import Anchor from "@components/controls/Anchor";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticleTooltipService from "@core-ui/ContextServices/ArticleTooltip";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import type { Property, PropertyUsage } from "@ext/properties/models";
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
	AlertDialogTrigger,
} from "@ui-kit/AlertDialog";
import { Label } from "@ui-kit/Label";
import { ScrollShadowContainer } from "@ui-kit/ScrollShadowContainer";
import { Table, TableBody, TableCell, TableRow } from "@ui-kit/Table";
import { useEffect, useState } from "react";

export interface ActionWarningProps {
	// biome-ignore lint/suspicious/noExplicitAny: expected
	action: (...args: any[]) => void;
	children?: JSX.Element;
	isCatalog?: boolean;
	onClose?: () => void;
	onLinkClick?: () => void;
	isOpen?: boolean;
	className?: string;
	data: Property;
	editData: { name: string; values?: string[] };
	shouldShowWarning?: boolean;
}

const ScrollShadowContainerStyled = styled(ScrollShadowContainer)`
	max-height: 25vh;
`;

const ActionWarning = (props: ActionWarningProps) => {
	const {
		data,
		editData,
		isCatalog,
		isOpen: initialIsOpen,
		children,
		action,
		onClose,
		onLinkClick,
		shouldShowWarning,
	} = props;
	const [isOpen, setIsOpen] = useState(initialIsOpen);
	const [usages, setUsages] = useState<PropertyUsage[]>([]);
	const apiUrlCreator = ApiUrlCreatorService.value;

	const fetchPropertyUsages = async () => {
		if (!data || !editData || !data?.values?.length) return;
		const deletedValues = isCatalog
			? data?.values?.toString()
			: data?.values?.filter((value) => !editData.values.includes(value))?.toString();

		const res = await FetchService.fetch(apiUrlCreator.getPropertyUsages(data.name, deletedValues));
		if (!res.ok) return;
		setUsages(await res.json());
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		void fetchPropertyUsages();
	}, [data, editData]);

	const onOpenChange = (value: boolean) => {
		setIsOpen(value);
		if (!value) onClose?.();
	};

	const onActionClick = () => {
		setIsOpen(false);
		onClose?.();
		action();
	};

	if (!shouldShowWarning) return children;

	return (
		<AlertDialog onOpenChange={onOpenChange} open={isOpen}>
			<AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
			<AlertDialogContent status="warning">
				<AlertDialogHeader>
					<AlertDialogIcon icon="alert-circle" />
					<AlertDialogTitle>{t("confirmation.delete.title")}</AlertDialogTitle>
					<AlertDialogDescription>
						{isCatalog
							? t("properties.warning.delete-tag-from-catalog.body")
							: t("properties.warning.delete-value-from-catalog.body")}
						<br />
						{usages?.length > 0 && (
							<ArticleTooltipService.Provider>
								<>
									{usages.length} {t("properties.update-affected-articles")}:
									<ScrollShadowContainerStyled className="py-2">
										<div className="rounded-lg border">
											<Table>
												<TableBody className="[&_tr:last-child]:border-0">
													{usages.map((usage, index) => (
														<TableRow key={`${usage.title}-${index}`}>
															<TableCell>
																<Label>
																	<Anchor
																		href={usage.linkPath}
																		onClick={() => {
																			setIsOpen(false);
																			onLinkClick?.();
																		}}
																		resourcePath={usage.resourcePath}
																	>
																		<span style={{ color: "var(--color-link)" }}>
																			{usage.title || t("article.no-name")}
																		</span>
																	</Anchor>
																</Label>
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</div>
									</ScrollShadowContainerStyled>
								</>
							</ArticleTooltipService.Provider>
						)}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel variant="outline">{t("cancel")}</AlertDialogCancel>
					<AlertDialogAction onClick={onActionClick} variant="primary">
						{t("continue")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default ActionWarning;
