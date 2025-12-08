import { getImportModalFormSchema, ImportModalFormSchema } from "@ext/import/model/ImportModalFormSchema";
import { useFilteredSourceData } from "@ext/import/logic/useFilteredSourceData";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { Form, FormField, FormFooter, FormHeader, FormStack } from "@ui-kit/Form";
import { Modal, ModalBody, ModalContent, ModalTrigger } from "@ui-kit/Modal";
import { ReactNode, useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectOption,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "@ui-kit/Select";
import { MenuItem, MenuItemAction } from "@ui-kit/MenuItem";
import CreateSource from "@ext/import/components/CreateSource";
import getSourceDataByStorageName from "@ext/storage/logic/utils/getSourceDataByStorageName";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import { importModalFields } from "@ext/import/model/ImportModalFields";
import { getStorageDataByForm } from "@ext/git/actions/Clone/logic/getStorageDataByForm";
import useWatch from "@core-ui/hooks/useWatch";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import SourceOption from "@ext/storage/components/SourceOption";
import { UnsupportedElements } from "@ext/import/model/UnsupportedElements";
import UnsupportedElementsModal from "@ext/import/components/UnsupportedElementsModal";
import OnNetworkApiErrorService from "@ext/errorHandlers/client/OnNetworkApiErrorService";
import { useCloneRepo } from "@ext/git/actions/Clone/logic/useCloneRepo";

interface ImportModalProps {
	trigger?: ReactNode;
	onClose?: () => void;
}

const ImportModal = ({ trigger, onClose }: ImportModalProps) => {
	const [isOpen, setIsOpen] = useState(!trigger);
	const [isCreateSourceOpen, setIsCreateSourceOpen] = useState(false);
	const [invalidSourceData, setInvalidSourceData] = useState<SourceData>(null);
	const [unsupportedElements, setUnsupportedElements] = useState<UnsupportedElements[]>([]);

	const sourceDatas = useFilteredSourceData();
	const { isNext } = usePlatform();
	const { startClone: startCloneRepo } = useCloneRepo({
		onError: () => {
			refreshPage();
		},
		onStart: () => {
			refreshPage();
		},
	});

	const apiUrlCreator = ApiUrlCreator.value;
	const sourceDatasContext = SourceDataService.value;

	const onOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) onClose?.();
	};

	const form = useForm<ImportModalFormSchema>({
		resolver: zodResolver(getImportModalFormSchema(sourceDatasContext)),
		mode: "onChange",
	});

	const { watch } = form;
	const sourceKey = watch("sourceKey");
	const sourceData: SourceData = useMemo(
		() =>
			sourceKey && sourceKey !== "add-new-storage"
				? getSourceDataByStorageName(sourceKey, sourceDatasContext)
				: null,
		[sourceKey, sourceDatasContext],
	);

	const startClone = useCallback(
		(sourceData: SourceData) => {
			const data = getStorageDataByForm(sourceData, form.getValues());
			startCloneRepo({
				storageData: data,
				skipCheck: true,
				isBare: isNext,
			});

			onOpenChange(false);
		},
		[startCloneRepo, isNext, onOpenChange, form],
	);

	const loadUnsupportedElements = useCallback(
		async (sourceData: SourceData) => {
			const storageData = getStorageDataByForm(sourceData, form.getValues());
			const res = await FetchService.fetch<UnsupportedElements[]>(
				apiUrlCreator.getUnsupportedElementsUrl(storageData.name, storageData.source.sourceType),
				JSON.stringify(storageData),
			);
			if (!res.ok) return false;
			const elements = await res.json();
			if (!elements?.length) {
				startCloneRepo({
					storageData,
					skipCheck: true,
					isBare: isNext,
				});

				return true;
			}

			setUnsupportedElements(elements);
			return false;
		},
		[apiUrlCreator, startCloneRepo, isNext, onOpenChange, form],
	);

	const onSubmit = useCallback(
		async (e) => {
			const elements = await loadUnsupportedElements(sourceData);
			if (!elements) return;

			form.handleSubmit(() => {
				startClone(sourceData);
				onOpenChange(false);
			})(e);
		},
		[loadUnsupportedElements, startClone, onOpenChange, form, sourceData],
	);

	useWatch(() => {
		form.resetField("space");
	}, [sourceKey]);

	const onSourceDataCreate = useCallback(
		async (data: SourceData) => {
			const url = apiUrlCreator.setSourceData();
			const res = await FetchService.fetch(url, JSON.stringify(data), MimeTypes.json);
			if (!res.ok) return;

			const storageKey = getStorageNameByData(data);
			const newSourceDatas = [...sourceDatasContext.filter((d) => getStorageNameByData(d) !== storageKey), data];
			SourceDataService.value = newSourceDatas;

			if (!data.isInvalid) form.setValue("sourceKey", storageKey);
		},
		[sourceDatasContext, form, apiUrlCreator],
	);

	const ModalFields = importModalFields?.[sourceData?.sourceType];

	return (
		<>
			<Modal open={isOpen} onOpenChange={onOpenChange}>
				{trigger && <ModalTrigger asChild>{trigger}</ModalTrigger>}
				<ModalContent>
					<FormHeader
						icon="cloud-download"
						title={t("import.modal.title")}
						description={t("import.modal.description")}
					/>
					<OnNetworkApiErrorService.Provider callback={() => onOpenChange(false)}>
						<Form asChild {...form}>
							<form className="contents ui-kit" onSubmit={onSubmit}>
								<ModalBody>
									<FormStack>
										<FormField
											title={t("import.modal.props.source.name")}
											name="sourceKey"
											control={({ field }) => (
												<Select {...field} onValueChange={(val) => val && field.onChange(val)}>
													<SelectTrigger>
														<SelectValue
															placeholder={t("import.modal.props.source.placeholder")}
														/>
													</SelectTrigger>
													<SelectContent>
														<SelectGroup>
															{sourceDatas.map((d) => {
																const storageKey = getStorageNameByData(d);
																return (
																	<SourceOption
																		key={storageKey}
																		storageKey={storageKey}
																		source={d}
																		onDelete={() => {
																			if (sourceKey === storageKey) form.reset();
																		}}
																		onInvalid={() => {
																			setIsCreateSourceOpen(true);
																			setInvalidSourceData(d);
																		}}
																		onEdit={() => {
																			setIsCreateSourceOpen(true);
																			setInvalidSourceData(d);
																		}}
																	/>
																);
															})}
														</SelectGroup>
														{sourceDatas.length > 0 && <SelectSeparator />}
														<SelectOption
															value="add-new-source"
															asChild
															role="button"
															onPointerDown={(e) => {
																e.stopPropagation();
																e.preventDefault();
																setIsCreateSourceOpen(true);
															}}
														>
															<MenuItem>
																<MenuItemAction
																	icon="plus"
																	text={t("import.modal.add-new-source")}
																/>
															</MenuItem>
														</SelectOption>
													</SelectContent>
												</Select>
											)}
										/>
										{sourceData && ModalFields && (
											<ModalFields sourceData={sourceData} form={form} />
										)}
									</FormStack>
								</ModalBody>
								<FormFooter primaryButton={<Button>{t("catalog.import")}</Button>} />
							</form>
						</Form>
					</OnNetworkApiErrorService.Provider>
				</ModalContent>
			</Modal>
			<CreateSource
				isOpen={isCreateSourceOpen}
				setIsOpen={setIsCreateSourceOpen}
				onSubmit={onSourceDataCreate}
				onClose={() => {
					setInvalidSourceData(null);
					onOpenChange(false);
				}}
				data={invalidSourceData}
				isReadonly={!!invalidSourceData}
				sourceType={invalidSourceData?.sourceType}
			/>
			{unsupportedElements.length > 0 && (
				<UnsupportedElementsModal
					unsupportedNodes={unsupportedElements}
					startClone={() => startClone(sourceData)}
					onCancelClick={() => setUnsupportedElements([])}
					sourceType={sourceData?.sourceType}
				/>
			)}
		</>
	);
};

export default ImportModal;
