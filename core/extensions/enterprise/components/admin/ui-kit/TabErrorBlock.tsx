import RichText from "@components/Atoms/RichText/RichText";
import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import type { GesErrorCode } from "@ext/enterprise/errors/GesError";
import { getGesErrorDescription, getGesErrorTitle } from "@ext/enterprise/errors/getGesErrorText";
import t from "@ext/localization/locale/translate";
import { Alert, AlertButton, AlertDescription, AlertIcon, AlertTitle } from "@ui-kit/Alert";

interface TabErrorBlockProps {
	code: GesErrorCode;
	onRetry?: () => void;
	className?: string;
}

export function TabErrorBlock({ code, onRetry, className }: TabErrorBlockProps) {
	const { gesUrl } = useSettings();
	return (
		<div className={className}>
			<Alert focus="high" status="error">
				<AlertIcon icon="alert-circle" />
				<AlertTitle>{getGesErrorTitle(code)}</AlertTitle>
				<AlertDescription>
					<RichText text={getGesErrorDescription(code, gesUrl)} />
				</AlertDescription>
				{onRetry && <AlertButton onClick={onRetry}>{t("enterprise.admin.retry")}</AlertButton>}
			</Alert>
		</div>
	);
}
