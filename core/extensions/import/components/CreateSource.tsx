import { Modal, ModalContent, ModalBody, ModalTrigger } from "@ui-kit/Modal";
import { FormFooter, FormHeader } from "@ui-kit/Form";
import { Icon } from "@ui-kit/Icon";
import getStorageIconByData from "@ext/storage/logic/SourceDataProvider/logic/getStorageIconByData";
import { useCallback, useState } from "react";
import t from "@ext/localization/locale/translate";
import { FooterPortalProvider, useGetFooterButtons } from "@core-ui/hooks/useFooterPortal";
import useWatch from "@core-ui/hooks/useWatch";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import sourceComponents from "@ext/storage/logic/SourceDataProvider/logic/sourceComponents";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { getAllSourceTypes, getAllowedSourceTypes } from "@ext/import/logic/useFilteredSourceData";
import { Field } from "@ui-kit/Field";
import { SearchSelect } from "@ui-kit/SearchSelect";
import { Divider } from "@ui-kit/Divider";
import { cn } from "@core-ui/utils/cn";

interface CreateStorageContentProps {
	// Default data is used to prefill the form
	data?: Partial<SourceData>;
	// Default data fields in prop defaultData set as readonly
	isReadonly?: boolean;
	sourceType?: SourceType;
	title?: string;
	trigger?: JSX.Element;
	isOpen?: boolean;
	onSubmit: (data: SourceData) => void;
	setIsOpen?: (isOpen: boolean) => void;
	onClose?: () => void;
}

const CreateStorageContent = (props: CreateStorageContentProps) => {
	const {
		isOpen: propsIsOpen = true,
		setIsOpen: propsSetIsOpen,
		onSubmit,
		onClose,
		data,
		isReadonly,
		sourceType,
		title = t("forms.create-source.name"),
		trigger,
	} = props;
	const [isOpen, setIsOpen] = useState(propsIsOpen);
	const [selectedSourceType, setSelectedSourceType] = useState<string>(sourceType?.toString() || "");
	const { primaryButton, secondaryButton } = useGetFooterButtons();
	const { isTauri } = usePlatform();
	const allowedSourceTypes = getAllowedSourceTypes(isTauri);
	const allSourceTypes = getAllSourceTypes();

	useWatch(() => {
		setIsOpen(propsIsOpen);
	}, [propsIsOpen]);

	const updateIsOpen = useCallback(
		(isOpen: boolean) => {
			setIsOpen(isOpen);
			propsSetIsOpen?.(isOpen);
		},
		[propsSetIsOpen],
	);

	const addSourceData = useCallback(
		(data: SourceData) => {
			onSubmit(data);
			updateIsOpen(false);
		},
		[onSubmit, updateIsOpen],
	);

	const onOpenChange = (open: boolean) => {
		updateIsOpen(open);
		if (!open) onClose?.();
	};

	return (
		<Modal open={isOpen} onOpenChange={onOpenChange}>
			{trigger && <ModalTrigger>{trigger}</ModalTrigger>}
			<ModalContent data-modal-root style={{ maxWidth: "570px" }}>
				<FormHeader icon="plug" title={title} description={t("forms.create-source.description")} />
				<ModalBody>
					<Field
						title={`${t("type")} ${t("source2").toLowerCase()}`}
						description={
							Object.keys(allowedSourceTypes).length !== allSourceTypes.length
								? t("forms.create-source.props.source.description")
								: undefined
						}
						layout="vertical"
						labelClassName="w-44"
						control={() => (
							<SearchSelect
								placeholder={t("select")}
								options={allSourceTypes.map((type: string) => {
									const isDisabledByAllowed = !allowedSourceTypes[type];
									const isDisabledByReadonly = Boolean(isReadonly && type !== sourceType);
									const disabled = isDisabledByAllowed || isDisabledByReadonly;

									return {
										label: type,
										value: type,
										disabled,
									};
								})}
								value={selectedSourceType}
								onChange={(value) => setSelectedSourceType(value)}
								renderOption={(option) => {
									return (
										<div
											className={cn(
												"flex items-center gap-2 w-full",
												option.type === "trigger" && "ml-2",
											)}
										>
											<Icon
												icon={getStorageIconByData({
													sourceType: option.option.value as SourceType,
													userName: "",
													userEmail: "",
												})}
												className="text-base"
											/>
											{option.option.label}
											{option.type === "list" && selectedSourceType === option.option.value && (
												<Icon icon="check" className="ml-auto" />
											)}
										</div>
									);
								}}
								disabled={isReadonly}
							/>
						)}
					/>
					{selectedSourceType && sourceComponents[selectedSourceType] && (
						<>
							<div className="mt-4 lg:mt-5">
								<Divider className="mb-4 lg:mb-5" />
								{(() => {
									const Form = sourceComponents[selectedSourceType];
									return (
										<Form
											onSubmit={addSourceData}
											type={selectedSourceType}
											data={data}
											isReadonly={isReadonly}
										/>
									);
								})()}
							</div>
						</>
					)}
				</ModalBody>
				<FormFooter primaryButton={primaryButton} secondaryButton={secondaryButton} />
			</ModalContent>
		</Modal>
	);
};

const CreateSource = (props: CreateStorageContentProps) => {
	return (
		<FooterPortalProvider>
			<CreateStorageContent {...props} />
		</FooterPortalProvider>
	);
};

export default CreateSource;
