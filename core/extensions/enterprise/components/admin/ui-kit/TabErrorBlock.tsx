import t from "@ext/localization/locale/translate";
import { Alert, AlertButton, AlertDescription, AlertIcon, AlertTitle } from "@ui-kit/Alert";

interface TabErrorBlockProps {
	title?: string;
	message: string;
	onRetry?: () => void;
	className?: string;
}

export function TabErrorBlock({ title = t("error"), message, onRetry, className }: TabErrorBlockProps) {
	return (
		<div className={className ?? "p-6"}>
			<Alert focus="high" status="error">
				<AlertIcon icon="alert-circle" />
				<AlertTitle>{title}</AlertTitle>
				<AlertDescription>{message}</AlertDescription>
				{onRetry && <AlertButton onClick={onRetry}>{t("try-again")}</AlertButton>}
			</Alert>
		</div>
	);
}
