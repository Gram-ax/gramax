import { AdminNavigationProvider } from "@ext/enterprise/components/admin/contexts/AdminNavigationContext";
import { SettingsProvider } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { GuardProvider } from "@ext/enterprise/components/admin/hooks/useGuard";
import { MainContent } from "@ext/enterprise/components/admin/modal/MainContent";
import { ModalCloseGuard } from "@ext/enterprise/components/admin/modal/ModalCloseGuard";
import ForbiddenPage from "@ext/enterprise/components/admin/pages/ForbiddenPage";
import { TabInitialLoader } from "@ext/enterprise/components/admin/ui-kit/TabInitialLoader";
import type EnterpriseService from "@ext/enterprise/EnterpriseService";
import { useAdminGate } from "@ext/enterprise/utils/useAdminGate";
import { DialogContent } from "@ui-kit/Dialog";

interface AdminModalContentProps {
	token: string;
	enterpriseService: EnterpriseService;
	onRequestClose: () => void;
	guardedCloseRef: React.MutableRefObject<(() => void) | null>;
}

export const AdminModalContent = ({
	enterpriseService,
	token,
	onRequestClose,
	guardedCloseRef,
}: AdminModalContentProps) => {
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
			className="focus-visible:outline-none"
			showCloseButton={false}
			size="FS"
		>
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
