import { AdminNavigationProvider } from "@ext/enterprise/components/admin/contexts/AdminNavigationContext";
import { GuardProvider } from "@ext/enterprise/components/admin/contexts/GuardProvider";
import { SettingsProvider } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useAdminGate } from "@ext/enterprise/components/admin/hooks/useAdminGate";
import { MainContent } from "@ext/enterprise/components/admin/modal/MainContent";
import { ModalCloseGuard } from "@ext/enterprise/components/admin/modal/ModalCloseGuard";
import ForbiddenPage from "@ext/enterprise/components/admin/pages/ForbiddenPage";
import { TabInitialLoader } from "@ext/enterprise/components/admin/ui-kit/TabInitialLoader";
import type EnterpriseService from "@ext/enterprise/EnterpriseService";
import t from "@ext/localization/locale/translate";
import { DialogContent, DialogDescription, DialogHeader } from "@ui-kit/Dialog";

interface AdminModalContentProps {
	token: string;
	enterpriseService: EnterpriseService;
	onRequestClose: () => void;
	guardedCloseRef: React.MutableRefObject<(() => void) | null>;
}

export const AdminModalContent = (props: AdminModalContentProps) => {
	const { enterpriseService, token, onRequestClose, guardedCloseRef } = props;
	const { loading, forbidden } = useAdminGate({
		token,
		enterpriseService,
		onErrorPolicy: "forbid",
	});

	if (loading) return <TabInitialLoader />;
	if (forbidden) return <ForbiddenPage />;

	return (
		<DialogContent
			// focus-visible:outline-none removes whole dialog outline when focused
			// Dialog can focus on invalid focusable element or some other cases i dont understand
			className="focus-visible:outline-none font-sans font-normal"
			overlayType="dimmed"
			showCloseButton={false}
			size="FS"
		>
			<DialogHeader className="sr-only absolute !p-0">
				<DialogDescription>{t("enterprise.admin.settings-title")}</DialogDescription>
			</DialogHeader>
			<AdminNavigationProvider>
				<GuardProvider>
					<SettingsProvider enterpriseService={enterpriseService} token={token}>
						<ModalCloseGuard guardedCloseRef={guardedCloseRef} onRequestClose={onRequestClose}>
							<MainContent />
						</ModalCloseGuard>
					</SettingsProvider>
				</GuardProvider>
			</AdminNavigationProvider>
		</DialogContent>
	);
};
