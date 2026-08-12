import RichText from "@components/Atoms/RichText/RichText";
import type { AlertMessageState } from "@ext/enterprise/components/admin/hooks/useAlertMessage";
import { Alert, AlertDescription, AlertIcon, AlertTitle } from "@ui-kit/Alert";
import { Collapsible, CollapsibleContent } from "@ui-kit/Collapsible";

interface HeaderAlertProps {
	alert?: AlertMessageState;
}

export const HeaderAlert = ({ alert }: HeaderAlertProps) => {
	return (
		<Collapsible className="!mt-0" open={Boolean(alert?.isShown)}>
			<CollapsibleContent>
				<div className="mt-6">
					<Alert focus="high" status="error">
						<AlertIcon icon="alert-circle" />
						{alert?.title && <AlertTitle>{alert?.title}</AlertTitle>}
						<AlertDescription>
							<RichText text={alert?.message} />
						</AlertDescription>
					</Alert>
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
};
