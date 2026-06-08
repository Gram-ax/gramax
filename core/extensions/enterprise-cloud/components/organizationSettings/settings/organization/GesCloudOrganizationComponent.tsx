import UnsavedChangesModal from "@components/UnsavedChangesModal";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { FloatingAlert } from "@ext/enterprise/components/admin/ui-kit/FloatingAlert";
import { TabInitialLoader } from "@ext/enterprise/components/admin/ui-kit/TabInitialLoader";
import { useOrganizationSettingsNavigation } from "@ext/enterprise-cloud/components/organizationSettings/OrganizationSettingsNavigationContext";
import { StickyHeader } from "@ext/enterprise-cloud/components/ui-kit/StickyHeader";
import { GesCloudApi, type Organization } from "@ext/enterprise-cloud/GesCloudApi";
import { useGesCloudOrganizationStore } from "@ext/enterprise-cloud/ui-logic/stores/GesCloudOrganizationStore/GesCloudOrganizationStore.provider";
import t from "@ext/localization/locale/translate";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, LoadingButtonTemplate } from "@ui-kit/Button";
import { Form, FormBody, FormField, FormStack } from "@ui-kit/Form";
import { Icon } from "@ui-kit/Icon";
import { Input } from "@ui-kit/Input";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
	name: z.string().min(1, { message: t("must-be-not-empty") }),
});

const GesCloudOrganizationComponent = () => {
	const { url: gesCloudUrl } = PageDataContextService.value.conf.enterpriseCloud;
	const gesCloudApi = useMemo(() => new GesCloudApi(gesCloudUrl), [gesCloudUrl]);

	const [organization, setOrganization] = useState<Organization | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	const fetchOrganizationsFromApi = useGesCloudOrganizationStore((state) => state.fetchOrganizationsFromApi);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		mode: "onChange",
		defaultValues: {
			name: "",
		},
	});

	useEffect(() => {
		const loadOrganization = async () => {
			try {
				const orgData = await gesCloudApi.getOrganization();
				setOrganization(orgData);
				form.setValue("name", orgData.name);
			} catch (error) {
				setSaveError(error instanceof Error ? error.message : "Failed to load organization");
			} finally {
				setIsLoading(false);
			}
		};

		loadOrganization();
	}, [gesCloudApi, form]);

	const [pendingAction, setPendingAction] = useState<(() => void) | undefined>(undefined);

	const handleSave = useCallback(
		async (values: z.infer<typeof formSchema>) => {
			if (!organization) return;

			setIsSaving(true);
			setSaveError(null);

			try {
				await gesCloudApi.updateOrganization(values.name);
				setOrganization({ ...organization, name: values.name });
				form.reset(undefined, { keepValues: true });
				fetchOrganizationsFromApi(gesCloudApi);
			} catch (error) {
				setSaveError(error instanceof Error ? error.message : "Failed to update organization");
			} finally {
				setIsSaving(false);
				pendingAction?.();
				setPendingAction(undefined);
			}
		},
		[organization, gesCloudApi, pendingAction, form.reset, fetchOrganizationsFromApi],
	);

	const isFormDirty = form.formState.isDirty;
	const isFormValid = form.formState.isValid;
	const canSubmit = isFormDirty && isFormValid && !isSaving;

	const [showUnsavedModal, setShowUnsavedModal] = useState(false);

	const { subscribeToNavigation, subscribeToModalClose } = useOrganizationSettingsNavigation();

	useEffect(() => {
		const unsubscribeOnNavigation = subscribeToNavigation((event) => {
			if (isFormDirty) {
				setShowUnsavedModal(true);
				setPendingAction(() => event.execute);
			} else event.execute();
		});
		const unsubscribeOnModalClose = subscribeToModalClose((event) => {
			if (isFormDirty) {
				setShowUnsavedModal(true);
				setPendingAction(() => event.execute);
			} else event.execute();
		});
		return () => {
			unsubscribeOnNavigation();
			unsubscribeOnModalClose();
		};
	}, [subscribeToNavigation, subscribeToModalClose, isFormDirty]);

	const handleSaveAndProceed = useCallback(() => {
		form.handleSubmit(handleSave)();
		setShowUnsavedModal(false);
		setPendingAction(undefined);
	}, [form.handleSubmit, handleSave]);

	const handleDontSaveAndProceed = useCallback(() => {
		setShowUnsavedModal(false);
		pendingAction?.();
		setPendingAction(undefined);
	}, [pendingAction]);

	const handleCancelAction = useCallback(() => {
		setShowUnsavedModal(false);
		setPendingAction(undefined);
	}, []);

	if (isLoading) {
		return <TabInitialLoader />;
	}

	return (
		<div>
			<StickyHeader
				actions={
					<>
						{isSaving ? (
							<LoadingButtonTemplate
								text={t("enterprise-cloud.org-settings.organization.save")}
								variant="primary"
							/>
						) : (
							<Button disabled={!canSubmit} onClick={form.handleSubmit(handleSave)} variant="primary">
								<Icon icon="save" />
								{t("enterprise-cloud.org-settings.organization.save")}
							</Button>
						)}
					</>
				}
				title={t("enterprise-cloud.org-settings.pages.organization")}
			/>
			<FloatingAlert message={saveError} show={Boolean(saveError)} />
			<div className="space-y-6">
				<Form {...form} className="border-0">
					<form onSubmit={form.handleSubmit(handleSave)}>
						<FormBody>
							<FormStack>
								<FormField
									control={({ field }) => (
										<Input
											placeholder={t(
												"enterprise-cloud.org-settings.organization.name.placeholder",
											)}
											{...field}
										/>
									)}
									layout="horizontal"
									name="name"
									required
									title={t("enterprise-cloud.org-settings.organization.name.label")}
								/>
							</FormStack>
						</FormBody>
					</form>
				</Form>
			</div>
			<UnsavedChangesModal
				isOpen={showUnsavedModal}
				onDontSave={handleDontSaveAndProceed}
				onOpenChange={handleCancelAction}
				onSave={handleSaveAndProceed}
			/>
		</div>
	);
};

export default GesCloudOrganizationComponent;
