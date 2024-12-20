import Anchor from "@components/controls/Anchor";
import Modal from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticleTooltipService from "@core-ui/ContextServices/ArticleTooltip";
import useWatch from "@core-ui/hooks/useWatch";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import t from "@ext/localization/locale/translate";
import { Property, PropertyUsage } from "@ext/properties/models";
import { useState } from "react";

export type ActionWarningProps = {
	action: (...args: any[]) => void;
	children?: JSX.Element;
	isCatalog?: boolean;
	onClose?: () => void;
	isOpen?: boolean;
	className?: string;
	data: Property;
	editData: { name: string; values?: string[] };
};

const ActionWarning = (props: ActionWarningProps) => {
	const { data, editData, isCatalog, isOpen: initialIsOpen, children, action, onClose } = props;
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

	console.log(usages);
	return (
		<Modal
			closeOnEscape
			contentWidth="S"
			isOpen={isOpen}
			onOpen={() => setIsOpen(true)}
			onClose={() => {
				setIsOpen(false);
				onClose?.();
			}}
			trigger={children}
		>
			<ModalLayoutLight>
				<InfoModalForm
					isWarning
					onCancelClick={() => setIsOpen(false)}
					title={
						isCatalog
							? t("properties.warning.delete-tag-from-catalog.title")
							: t("properties.warning.delete-value-from-catalog.title")
					}
					actionButton={{
						text: t("continue"),
						onClick: () => {
							setIsOpen(false);
							action();
						},
					}}
					secondButton={!isCatalog && { text: t("properties.archive"), onClick: () => action(true) }}
					closeButton={{ text: t("cancel") }}
					icon={{ code: "alert-circle", color: "var(--color-warning)" }}
				>
					<p>
						{isCatalog
							? t("properties.warning.delete-tag-from-catalog.body")
							: t("properties.warning.delete-value-from-catalog.body")}
					</p>
					{usages?.length > 0 && (
						<ArticleTooltipService.Provider>
							<>
								<p>
									{usages.length} {t("properties.update-affected-articles")}:
								</p>
								<div style={{ paddingLeft: "1.25em", maxHeight: "25vh", overflowY: "auto" }}>
									<ul>
										{usages.map((usage, index) => (
											<li key={usage.title + index}>
												<Anchor href={usage.linkPath} resourcePath={usage.resourcePath}>
													{usage.title || t("article.no-name")}
												</Anchor>
											</li>
										))}
									</ul>
								</div>
							</>
						</ArticleTooltipService.Provider>
					)}
				</InfoModalForm>
			</ModalLayoutLight>
		</Modal>
	);
};

export default ActionWarning;
