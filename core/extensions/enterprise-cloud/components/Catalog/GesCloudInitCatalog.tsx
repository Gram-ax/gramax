import { useRouter } from "@core/Api/useRouter";
import type { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { GesCloudApi } from "@ext/enterprise-cloud/GesCloudApi";
import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import type GitStorageData from "@ext/git/core/model/GitStorageData";
import t from "@ext/localization/locale/translate";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, LoadingButtonTemplate } from "@ui-kit/Button";
import { Dialog, DialogBody, DialogContent } from "@ui-kit/Dialog";
import { Form, FormField, FormFooter, FormHeader, FormStack } from "@ui-kit/Form";
import { Input } from "@ui-kit/Input";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import ApiUrlCreatorService from "../../../../ui-logic/ContextServices/ApiUrlCreator";

const formSchema = z.object({
	catalogName: z.string({ message: t("must-be-not-empty") }),
});

export const GesCloudInitCatalog = ({ onClose }: { onClose: () => void }) => {
	const [isOpen, setIsOpen] = useState(true);
	const catalogPropsStore = useCatalogPropsStore((state) => state, "shallow");

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		mode: "onChange",
		defaultValues: {
			catalogName: catalogPropsStore.data.repositoryName,
		},
	});

	const apiUrlCreator = ApiUrlCreatorService.value;
	const { url: gesCloudUrl } = PageDataContextService.value.conf.enterpriseCloud;
	const sourceDatas = SourceDataService.value;
	const router = useRouter();

	const [isLoading, setIsLoading] = useState(false);

	const onOpenChange = useCallback(
		(open: boolean) => {
			setIsOpen(open);
			if (!open) onClose();
		},
		[onClose],
	);

	const handleSubmit = useCallback(
		async (formData: z.infer<typeof formSchema>) => {
			setIsLoading(true);
			try {
				const oldCatalogName = catalogPropsStore.data.repositoryName;
				const newCatalogName = formData.catalogName;

				const gitlabSourceData = sourceDatas.find((sourceData) => sourceData.sourceType === SourceType.gitLab);
				const gesCloudApi = new GesCloudApi(gesCloudUrl);
				const initData = await gesCloudApi.getCatalogInitData();

				const data: GitStorageData = {
					source: gitlabSourceData as GitSourceData,
					name: newCatalogName,
					group: initData.git.group,
				};
				const res = await FetchService.fetch<ClientCatalogProps>(
					apiUrlCreator.getInitEnterpriseCloudCatalogUrl(oldCatalogName, newCatalogName),
					JSON.stringify(data),
					MimeTypes.json,
				);
				if (res.ok) {
					const newCatalogProps = await res.json();
					catalogPropsStore.update(newCatalogProps);
					router.pushPath(newCatalogProps.link.pathname);
				}
				onOpenChange(false);
				return res.ok;
			} finally {
				setIsLoading(false);
			}
		},
		[catalogPropsStore, apiUrlCreator, gesCloudUrl, sourceDatas, router, onOpenChange],
	);

	return (
		<Dialog onOpenChange={onOpenChange} open={isOpen}>
			<DialogContent>
				<Form asChild {...form}>
					<form onSubmit={form.handleSubmit(handleSubmit)}>
						<FormHeader
							description={t("forms.enterprise-cloud-publish-new-catalog.description")}
							icon="plug"
							title={t("forms.enterprise-cloud-publish-new-catalog.name")}
						/>
						<DialogBody>
							<FormStack>
								<FormField
									control={({ field }) => <Input {...field} />}
									name="catalogName"
									required
									title={t("forms.catalog-edit-props.props.url.name")}
								/>
							</FormStack>
						</DialogBody>
						<FormFooter
							primaryButton={
								isLoading ? (
									<LoadingButtonTemplate
										text={t("enterprise-cloud.buttons.publish")}
										variant="outline"
									/>
								) : (
									<Button
										disabled={!form.getValues("catalogName")}
										startIcon="cloud-upload"
										type="submit"
										variant="outline"
									>
										{t("enterprise-cloud.buttons.publish")}
									</Button>
								)
							}
						/>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
