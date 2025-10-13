import { Modal, ModalContent, ModalBody } from "@ui-kit/Modal";
import { FormFooter, FormHeader } from "@ui-kit/Form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui-kit/Tabs";
import Icon from "@components/Atoms/Icon";
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

interface CreateStorageContentProps {
	// Default data is used to prefill the form
	data?: Partial<SourceData>;
	// Default data fields in prop defaultData set as readonly
	isReadonly?: boolean;
	sourceType?: SourceType;
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
	} = props;
	const [isOpen, setIsOpen] = useState(propsIsOpen);
	const { primaryButton, secondaryButton } = useGetFooterButtons();
	const { isTauri } = usePlatform();
	const allowedSourceTypes = getAllowedSourceTypes(isTauri);
	const allSourceTypes = getAllSourceTypes();
	const firstSourceType = Object.keys(allowedSourceTypes)?.[0] as SourceType;

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
			<ModalContent data-modal-root style={{ maxWidth: "570px" }}>
				<FormHeader
					icon="plug"
					title={t("forms.create-source.name")}
					description={t("forms.create-source.description")}
				/>
				<ModalBody>
					<Tabs defaultValue={sourceType || firstSourceType}>
						<TabsList className="w-full">
							{allSourceTypes.map((type) => (
								<TabsTrigger
									key={type}
									value={type}
									className="flex-1"
									disabled={!allowedSourceTypes[type] || Boolean(isReadonly && type !== sourceType)}
								>
									<Icon
										code={getStorageIconByData({
											sourceType: type as SourceType,
											userName: "",
											userEmail: "",
										})}
										className="text-base"
									/>
									{type}
								</TabsTrigger>
							))}
						</TabsList>
						{allSourceTypes.map((type) => {
							const Form = sourceComponents[type];
							return (
								<TabsContent tabIndex={-1} key={type} value={type} className="mt-4 lg:mt-5">
									<Form onSubmit={addSourceData} type={type} data={data} isReadonly={isReadonly} />
								</TabsContent>
							);
						})}
					</Tabs>
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
