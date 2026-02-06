import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import useWatch from "@core-ui/hooks/useWatch";
import OnNetworkApiErrorService from "@ext/errorHandlers/client/OnNetworkApiErrorService";
import { getStorageDataByForm } from "@ext/git/actions/Clone/logic/getStorageDataByForm";
import { useCloneRepo } from "@ext/git/actions/Clone/logic/useCloneRepo";
import CreateSource from "@ext/import/components/CreateSource";
import UnsupportedElementsModal from "@ext/import/components/UnsupportedElementsModal";
import { useFilteredSourceData } from "@ext/import/logic/useFilteredSourceData";
import { importModalFields } from "@ext/import/model/ImportModalFields";
import { getImportModalFormSchema, ImportModalFormSchema } from "@ext/import/model/ImportModalFormSchema";
import { UnsupportedElements } from "@ext/import/model/UnsupportedElements";
import t from "@ext/localization/locale/translate";
import SourceOption from "@ext/storage/components/SourceOption";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import getSourceDataByStorageName from "@ext/storage/logic/utils/getSourceDataByStorageName";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui-kit/Button";
import { Form, FormField, FormFooter, FormHeader, FormStack } from "@ui-kit/Form";
import { Loader } from "@ui-kit/Loader";
import { MenuItem, MenuItemAction } from "@ui-kit/MenuItem";
import { Modal, ModalBody, ModalContent, ModalTrigger } from "@ui-kit/Modal";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectOption,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "@ui-kit/Select";
import { ReactNode, useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

interface ImportModalProps {
	trigger?: ReactNode;
	onClose?: () => void;
}

const ImportModal = ({ trigger, onClose }: ImportModalProps) => {
	const [isOpen, setIsOpen] = useState(!trigger);
	const [isCreateSourceOpen, setIsCreateSourceOpen] = useState(false);
	const [invalidSourceData, setInvalidSourceData] = useState<SourceData>(null);
	const [unsupportedElements, setUnsupportedElements] = useState<UnsupportedElements[]>([]);
	const [isLoading, setIsLoading] = useState(false);

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
			setIsLoading(true);

			const storageData = getStorageDataByForm(sourceData, form.getValues());
			const res = await FetchService.fetch<UnsupportedElements[]>(
				apiUrlCreator.getUnsupportedElementsUrl(storageData.name, storageData.source.sourceType),
				JSON.stringify(storageData),
			);

			if (!res.ok) {
				setIsLoading(false);
				return false;
			}

			const elements = await res.json();
			setIsLoading(false);

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
		(e) => {
			form.handleSubmit(async () => {
				const elements = await loadUnsupportedElements(sourceData);
				if (!elements) return;

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
			<Modal onOpenChange={onOpenChange} open={isOpen}>
				{trigger && <ModalTrigger asChild>{trigger}</ModalTrigger>}
				<ModalContent>
					<FormHeader
						description={t("import.modal.description")}
						icon="cloud-download"
						title={t("import.modal.title")}
					/>
					<OnNetworkApiErrorService.Provider callback={() => onOpenChange(false)}>
						<Form asChild {...form}>
							<form className="contents ui-kit" onSubmit={onSubmit}>
								<ModalBody>
									<FormStack>
										<FormField
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
																		onDelete={() => {
																			if (sourceKey === storageKey) form.reset();
																		}}
																		onEdit={() => {
																			setIsCreateSourceOpen(true);
																			setInvalidSourceData(d);
																		}}
																		onInvalid={() => {
																			setIsCreateSourceOpen(true);
																			setInvalidSourceData(d);
																		}}
																		source={d}
																		storageKey={storageKey}
																	/>
																);
															})}
														</SelectGroup>
														{sourceDatas.length > 0 && <SelectSeparator />}
														<SelectOption
															asChild
															onPointerDown={(e) => {
																e.stopPropagation();
																e.preventDefault();
																setIsCreateSourceOpen(true);
															}}
															role="button"
															value="add-new-source"
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
											name="sourceKey"
											title={t("import.modal.props.source.name")}
										/>
										{sourceData && ModalFields && (
											<ModalFields form={form} sourceData={sourceData} />
										)}
									</FormStack>
								</ModalBody>
								<FormFooter
									primaryButton={
										<Button disabled={isLoading}>
											{isLoading ? (
												<>
													<Loader className="p-0 text-inverse-primary-fg" size="sm" />
													{t("loading")}
												</>
											) : (
												t("catalog.import")
											)}
										</Button>
									}
								/>
							</form>
						</Form>
					</OnNetworkApiErrorService.Provider>
				</ModalContent>
			</Modal>
			{isCreateSourceOpen && (
				<CreateSource
					data={invalidSourceData}
					isOpen={isCreateSourceOpen}
					isReadonly={!!invalidSourceData}
					onClose={() => {
						setInvalidSourceData(null);
						onOpenChange(false);
					}}
					onSubmit={onSourceDataCreate}
					setIsOpen={setIsCreateSourceOpen}
					sourceType={invalidSourceData?.sourceType}
				/>
			)}
			{unsupportedElements.length > 0 && (
				<UnsupportedElementsModal
					onCancelClick={() => setUnsupportedElements([])}
					sourceType={sourceData?.sourceType}
					startClone={() => startClone(sourceData)}
					unsupportedNodes={unsupportedElements}
				/>
			)}
		</>
	);
};

export default ImportModal;
