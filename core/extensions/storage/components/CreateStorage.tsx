import Icon from "@components/Atoms/Icon";
import { classNames } from "@components/libs/classNames";
import { FooterPortalProvider, useGetFooterButtons } from "@core-ui/hooks/useFooterPortal";
import useWatch from "@core-ui/hooks/useWatch";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import getStorageIconByData from "@ext/storage/logic/SourceDataProvider/logic/getStorageIconByData";
import sourceComponents from "@ext/storage/logic/SourceDataProvider/logic/sourceComponents";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import { FormFooter, FormHeader } from "@ui-kit/Form";
import { Modal, ModalBody, ModalContent, ModalTrigger } from "@ui-kit/Modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui-kit/Tabs";
import { useCallback, useState } from "react";

const ALLOWED_SOURCE_TYPES = [
	SourceType.gitLab,
	SourceType.gitHub,
	SourceType.gitVerse,
	SourceType.gitea,
	SourceType.git,
] as const;

const BoldIcon = styled(Icon)`
	svg {
		stroke-width: 2;
	}
`;

const TabsListStyled = styled(TabsList)`
	.${SourceType.gitea}, .${SourceType.gitVerse} {
		fill: hsl(var(--muted));
		:hover {
			fill: hsl(var(--secondary-fg));
		}
	}

	.${SourceType.gitea}[data-state="active"],
	.${SourceType.gitVerse}[data-state="active"] {
		fill: hsl(var(--primary-fg));
	}
`;

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
		sourceType = SourceType.gitLab,
		title = t("forms.add-storage.name"),
		trigger,
	} = props;
	const [isOpen, setIsOpen] = useState(propsIsOpen);
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

	return (
		<Modal open={isOpen} onOpenChange={onOpenChange}>
			{trigger && <ModalTrigger>{trigger}</ModalTrigger>}
			<ModalContent data-modal-root>
				<FormHeader icon="plug" title={title} description={t("forms.add-storage.description")} />
				<ModalBody>
					<Tabs defaultValue={sourceType}>
						<TabsListStyled className="w-full">
							{ALLOWED_SOURCE_TYPES.map((type) => (
								<TabsTrigger
									key={type}
									value={type}
									className={classNames("flex-1", {}, [type.toString()])}
									disabled={isReadonly && type !== sourceType}
								>
									<BoldIcon
										code={getStorageIconByData({ sourceType: type, userName: "", userEmail: "" })}
										className="text-base"
									/>
									{type}
								</TabsTrigger>
							))}
						</TabsListStyled>
						{ALLOWED_SOURCE_TYPES.map((type) => {
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

const CreateStorage = (props: CreateStorageContentProps) => {
	return (
		<FooterPortalProvider>
			<CreateStorageContent {...props} />
		</FooterPortalProvider>
	);
};

export default CreateStorage;
