import Anchor from "@components/controls/Anchor";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticleTooltipService from "@core-ui/ContextServices/ArticleTooltip";
import useWatch from "@core-ui/hooks/useWatch";
import { Modal, ModalBody, ModalContent, ModalTrigger } from "@ui-kit/Modal";
import { FormFooter, FormHeader } from "@ui-kit/Form";
import { Button } from "@ui-kit/Button";
import { Label } from "@ui-kit/Label";
import t from "@ext/localization/locale/translate";
import { Property, PropertyUsage } from "@ext/properties/models";
import { useState } from "react";

export type ActionWarningProps = {
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
};

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
	if (!shouldShowWarning) return children;

	const apiUrlCreator = ApiUrlCreatorService.value;

	const [isOpen, setIsOpen] = useState(initialIsOpen);
	const [usages, setUsages] = useState<PropertyUsage[]>([]);

	useWatch(() => {
		if (!data || !editData || !data?.values?.length) return;
		const deletedValues = isCatalog
			? data?.values?.toString()
			: data?.values?.filter((value) => !editData.values.includes(value))?.toString();

		FetchService.fetch(apiUrlCreator.getPropertyUsages(data.name, deletedValues)).then(async (res) => {
			if (res.ok) setUsages(await res.json());
		});
	}, [data, editData]);

	const onClick = () => {
		setIsOpen(false);
		onClose?.();
		action();
	};

	const onArchiveClick = () => {
		setIsOpen(false);
		onClose?.();
		action(true);
	};

	return (
		<Modal open={isOpen} onOpenChange={setIsOpen}>
			<ModalTrigger asChild>{children}</ModalTrigger>
			<ModalContent>
				<form>
					<FormHeader
						icon="alert-circle"
						title={t("delete")}
						description={
							isCatalog
								? t("properties.warning.delete-tag-from-catalog.title")
								: t("properties.warning.delete-value-from-catalog.title")
						}
					/>
					<ModalBody>
						<div>
							<Label>
								{isCatalog
									? t("properties.warning.delete-tag-from-catalog.body")
									: t("properties.warning.delete-value-from-catalog.body")}
							</Label>
						</div>
						{usages?.length > 0 && (
							<ArticleTooltipService.Provider>
								<>
									<Label>
										{usages.length} {t("properties.update-affected-articles")}:
									</Label>
									<div style={{ paddingLeft: "1.25em", maxHeight: "25vh", overflowY: "auto" }}>
										<ul>
											{usages.map((usage, index) => (
												<li key={usage.title + index}>
													<Label>
														<Anchor
															href={usage.linkPath}
															resourcePath={usage.resourcePath}
															onClick={() => {
																setIsOpen(false);
																onLinkClick?.();
															}}
														>
															<span style={{ color: "var(--color-link)" }}>
																{usage.title || t("article.no-name")}
															</span>
														</Anchor>
													</Label>
												</li>
											))}
										</ul>
									</div>
								</>
							</ArticleTooltipService.Provider>
						)}
					</ModalBody>
					<FormFooter
						primaryButton={
							<Button type="button" onClick={onClick}>
								{t("continue")}
							</Button>
						}
						secondaryButton={
							<Button type="button" variant="outline" onClick={onArchiveClick}>
								{t("properties.archive")}
							</Button>
						}
					/>
				</form>
			</ModalContent>
		</Modal>
	);
};

export default ActionWarning;
