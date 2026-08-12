import { transliterate } from "@core-ui/languageConverter/transliterate";
import t from "@ext/localization/locale/translate";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, LoadingButtonTemplate } from "@ui-kit/Button";
import { Dialog, DialogBody, DialogContent } from "@ui-kit/Dialog";
import { Form, FormField, FormFooter, FormHeader, FormStack } from "@ui-kit/Form";
import { Input } from "@ui-kit/Input";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
	repositoryName: z
		.string({ message: t("must-be-not-empty") })
		.trim()
		.min(1, { message: t("must-be-not-empty") }),
	catalogTitle: z.string(),
});

const getRepositoryNameByTitle = (title: string) => transliterate(title, { kebab: true });

type ConnectStorageResult = { success: true } | { success: false; errorCode: "REPOSITORY_ALREADY_EXISTS" } | undefined;

export const GesCloudInitCatalog = ({
	onClose,
	connectStorage,
	initialCatalogTitle,
	initialRepositoryName,
}: {
	onClose: () => void;
	connectStorage: (newCatalogTitle: string, newRepositoryName: string) => Promise<ConnectStorageResult>;
	initialCatalogTitle: string;
	initialRepositoryName: string;
}) => {
	const [isOpen, setIsOpen] = useState(true);
	const [isRepositoryNameTouched, setIsRepositoryNameTouched] = useState(false);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		mode: "onChange",
		defaultValues: {
			repositoryName: initialRepositoryName,
			catalogTitle: initialCatalogTitle,
		},
	});

	const [isLoading, setIsLoading] = useState(false);
	const repositoryNameFieldValue = form.watch("repositoryName");

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
				const result = await connectStorage(formData.catalogTitle, formData.repositoryName);
				if (result?.success === false && result.errorCode === "REPOSITORY_ALREADY_EXISTS") {
					form.setError("repositoryName", {
						message: t("enterprise.init-repo.already-exists"),
					});
					return;
				}
				if (result?.success) onOpenChange(false);
			} finally {
				setIsLoading(false);
			}
		},
		[connectStorage, form, onOpenChange],
	);

	const handleCatalogTitleChange = useCallback(
		(value: string, onChange: (value: string) => void) => {
			onChange(value);
			if (!isRepositoryNameTouched) {
				form.setValue("repositoryName", getRepositoryNameByTitle(value), {
					shouldDirty: true,
					shouldValidate: true,
				});
			}
		},
		[form, isRepositoryNameTouched],
	);

	const handleRepositoryNameChange = useCallback((value: string, onChange: (value: string) => void) => {
		setIsRepositoryNameTouched(true);
		onChange(value);
	}, []);

	return (
		<Dialog onOpenChange={onOpenChange} open={isOpen}>
			<DialogContent>
				<Form asChild {...form}>
					<form onSubmit={form.handleSubmit(handleSubmit)}>
						<FormHeader
							description={t("enterprise-cloud.forms.publish-new-catalog.description")}
							icon="folder-plus"
							title={t("enterprise-cloud.forms.publish-new-catalog.name")}
						/>
						<DialogBody>
							<FormStack>
								<p
									className="article !bg-transparent"
									dangerouslySetInnerHTML={{
										// biome-ignore lint/style/useNamingConvention: expected
										__html: t("enterprise-cloud.forms.publish-new-catalog.message").replace(
											"{{repositoryName}}",
											initialRepositoryName,
										),
									}}
								></p>
								<FormField
									control={({ field }) => (
										<Input
											{...field}
											onChange={(event) =>
												handleCatalogTitleChange(event.target.value, field.onChange)
											}
										/>
									)}
									name="catalogTitle"
									title={t("forms.catalog-edit-props.props.title.name")}
								/>
								<FormField
									control={({ field }) => (
										<Input
											{...field}
											onChange={(event) =>
												handleRepositoryNameChange(event.target.value, field.onChange)
											}
										/>
									)}
									name="repositoryName"
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
										disabled={!repositoryNameFieldValue?.trim()}
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
