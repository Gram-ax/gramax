import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import { AdminModalContent } from "@ext/enterprise/components/admin/modal/AdminModalContent";
import EnterpriseService from "@ext/enterprise/EnterpriseService";
import { getEnterpriseSourceData } from "@ext/enterprise/utils/getEnterpriseSourceData";
import { Dialog } from "@ui-kit/Dialog";
import { useCallback, useMemo, useRef, useState } from "react";

export const Admin = ({ onClose, gesUrl }: { onClose: () => void; gesUrl: string }) => {
	const [isOpen, setIsOpen] = useState(true);
	const sourceDatas = SourceDataService.value;
	const enterpriseService = useMemo(() => new EnterpriseService(gesUrl), [gesUrl]);
	// biome-ignore lint/correctness/useExhaustiveDependencies: idc
	const token = useMemo(() => getEnterpriseSourceData(sourceDatas, gesUrl)?.token, [gesUrl, sourceDatas]);
	const guardedCloseRef = useRef<(() => void) | null>(null);

	const handleRequestClose = useCallback(() => {
		setIsOpen(false);
		onClose();
	}, [onClose]);

	const onOpenChange = useCallback(
		(open: boolean) => {
			if (!open) {
				if (guardedCloseRef.current) {
					guardedCloseRef.current();
				} else {
					handleRequestClose();
				}
			}
		},
		[handleRequestClose],
	);

	return (
		<Dialog onOpenChange={onOpenChange} open={isOpen}>
			<AdminModalContent
				enterpriseService={enterpriseService}
				guardedCloseRef={guardedCloseRef}
				onRequestClose={handleRequestClose}
				token={token}
			/>
		</Dialog>
	);
};
