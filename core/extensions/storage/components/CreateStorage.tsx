import { FooterPortalProvider, useGetFooterButtons } from "@core-ui/hooks/useFooterPortal";
import useWatch from "@core-ui/hooks/useWatch";
import { cn } from "@core-ui/utils/cn";
import t from "@ext/localization/locale/translate";
import getStorageIconByData from "@ext/storage/logic/SourceDataProvider/logic/getStorageIconByData";
import sourceComponents from "@ext/storage/logic/SourceDataProvider/logic/sourceComponents";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import { Field } from "@ui-kit/Field";
import { FormFooter, FormHeader } from "@ui-kit/Form";
import { Icon } from "@ui-kit/Icon";
import { Modal, ModalBody, ModalContent, ModalTrigger } from "@ui-kit/Modal";
import { SearchSelect } from "@ui-kit/SearchSelect";
import { useCallback, useState } from "react";
import { Divider } from "@ui-kit/Divider";

const ALLOWED_SOURCE_TYPES = [
	SourceType.gitLab,
	SourceType.gitHub,
	SourceType.gitVerse,
	SourceType.gitea,
	SourceType.git,
] as const;

interface CreateStorageContentProps {
	// Default data is used to prefill the form
	data?: Partial<SourceData & { domain?: string }>;
	// Default data fields in prop defaultData set as readonly
	isReadonly?: boolean;
	sourceType?: SourceType;
	title?: string;
	trigger?: JSX.Element;
	onSubmit: (data: SourceData) => void;
	isOpen?: boolean;
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
		title = t("forms.add-storage.name"),
		trigger,
	} = props;
	const [isOpen, setIsOpen] = useState(propsIsOpen);
	const [selectedSourceType, setSelectedSourceType] = useState<string>(sourceType?.toString() || "");
	const { primaryButton, secondaryButton } = useGetFooterButtons();

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

	const Form = selectedSourceType ? sourceComponents[selectedSourceType] : null;
	return (
		<Modal open={isOpen} onOpenChange={onOpenChange}>
			{trigger && <ModalTrigger>{trigger}</ModalTrigger>}
			<ModalContent data-modal-root>
				<FormHeader icon="plug" title={title} description={t("forms.add-storage.description")} />
				<ModalBody>
					<Field
						title={`${t("type")} ${t("storage2")}`}
						layout="vertical"
						labelClassName="w-44"
						control={() => (
							<SearchSelect
								placeholder={t("select")}
								options={ALLOWED_SOURCE_TYPES.map((type: string) => ({
									label: type,
									value: type,
								}))}
								value={selectedSourceType}
								onChange={(value) => setSelectedSourceType(value)}
								renderOption={(option) => (
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
								)}
								disabled={isReadonly}
							/>
						)}
					/>
					{Form && (
						<>
							<div className="mt-4 lg:mt-5">
								<Divider className="mb-4 lg:mb-5" />
								<Form
									onSubmit={addSourceData}
									type={selectedSourceType}
									data={data}
									isReadonly={isReadonly}
								/>
							</div>
						</>
					)}
				</ModalBody>
				<FormFooter primaryButton={primaryButton} secondaryButton={secondaryButton} />
			</ModalContent>
		</Modal>
	);
};

const CreateStorage = (props: CreateStorageContentProps) => {
	return (
		<FooterPortalProvider>
			<CreateStorageContent {...props} />
		</FooterPortalProvider>
	);
};

export default CreateStorage;
