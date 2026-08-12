import { cn } from "@core-ui/utils/cn";
import { useAdminHeader } from "@ext/enterprise/components/admin/hooks/useAdminHeader";
import type { AlertMessageState } from "@ext/enterprise/components/admin/hooks/useAlertMessage";
import { SaveButton } from "@ext/enterprise/components/admin/ui-kit/SaveButton";
import { Spinner } from "@ext/enterprise/components/admin/ui-kit/Spinner";
import { TabErrorBlock } from "@ext/enterprise/components/admin/ui-kit/TabErrorBlock";
import { TabInitialLoader } from "@ext/enterprise/components/admin/ui-kit/TabInitialLoader";
import type { GesErrorCode } from "@ext/enterprise/errors/GesError";
import type { Page } from "@ext/enterprise/types/Page";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import type { ReactNode } from "react";

interface SettingsPageLayoutProps {
	page: Page;
	children: ReactNode;
	contentClassName?: string;
	isInitialLoading?: boolean;
	tabError?: GesErrorCode | null;
	onRetry?: () => void;
	isRefreshing?: boolean;
	saveError?: AlertMessageState;
	onSave?: () => void;
	isSaving?: boolean;
	isSaveDisabled?: boolean;
	actions?: ReactNode;
}

export const SettingsPageLayout = (props: SettingsPageLayoutProps) => {
	const {
		page,
		children,
		contentClassName,
		isInitialLoading,
		tabError,
		onRetry,
		isRefreshing,
		saveError,
		onSave,
		isSaving,
		isSaveDisabled,
		actions,
	} = props;

	const isContentUnavailable = Boolean(isInitialLoading || tabError);
	const saveAction = onSave && <SaveButton disabled={isSaveDisabled} isSaving={isSaving} onClick={onSave} />;

	useAdminHeader({
		title: (
			<>
				{getAdminPageTitle(page)} <Spinner show={Boolean(isRefreshing)} size="small" />
			</>
		),
		actions: isContentUnavailable ? undefined : (actions ?? saveAction),
		alert: saveError,
	});

	if (isInitialLoading) return <TabInitialLoader />;

	if (tabError) return <TabErrorBlock code={tabError} onRetry={onRetry} />;

	return <div className={cn("space-y-6", contentClassName)}>{children}</div>;
};
