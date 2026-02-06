import { FooterPortalProvider, useGetFooterButtons } from "@core-ui/hooks/useFooterPortal";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import useWatch from "@core-ui/hooks/useWatch";
import { cn } from "@core-ui/utils/cn";
import { getAllowedSourceTypes, getAllSourceTypes } from "@ext/import/logic/useFilteredSourceData";
import t from "@ext/localization/locale/translate";
import getStorageIconByData from "@ext/storage/logic/SourceDataProvider/logic/getStorageIconByData";
import sourceComponents from "@ext/storage/logic/SourceDataProvider/logic/sourceComponents";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import { Divider } from "@ui-kit/Divider";
import { Field } from "@ui-kit/Field";
import { FormFooter, FormHeader } from "@ui-kit/Form";
import { Icon } from "@ui-kit/Icon";
import { Modal, ModalBody, ModalContent, ModalTrigger } from "@ui-kit/Modal";
import { SearchSelect } from "@ui-kit/SearchSelect";
import { useCallback, useState } from "react";

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
		<Modal onOpenChange={onOpenChange} open={isOpen}>
			{trigger && <ModalTrigger>{trigger}</ModalTrigger>}
			<ModalContent data-modal-root style={{ maxWidth: "570px" }}>
				<FormHeader description={t("forms.create-source.description")} icon="plug" title={title} />
				<ModalBody>
					<Field
						control={() => (
							<SearchSelect
								disabled={isReadonly}
								onChange={(value) => setSelectedSourceType(value)}
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
								placeholder={t("select")}
								renderOption={(option) => {
									return (
										<div
											className={cn(
												"flex items-center gap-2 w-full",
												option.type === "trigger" && "ml-2",
											)}
										>
											<Icon
												className="text-base"
												icon={getStorageIconByData({
													sourceType: option.option.value as SourceType,
													userName: "",
													userEmail: "",
												})}
											/>
											{option.option.label}
											{option.type === "list" && selectedSourceType === option.option.value && (
												<Icon className="ml-auto" icon="check" />
											)}
										</div>
									);
								}}
								value={selectedSourceType}
							/>
						)}
						description={
							Object.keys(allowedSourceTypes).length !== allSourceTypes.length
								? t("forms.create-source.props.source.description")
								: undefined
						}
						labelClassName="w-44"
						layout="vertical"
						title={`${t("type")} ${t("source2").toLowerCase()}`}
					/>
					{selectedSourceType && sourceComponents[selectedSourceType] && (
						<>
							<div className="mt-4 lg:mt-5">
								<Divider className="mb-4 lg:mb-5" />
								{(() => {
									const Form = sourceComponents[selectedSourceType];
									return (
										<Form
											data={data}
											isReadonly={isReadonly}
											onSubmit={addSourceData}
											type={selectedSourceType}
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
