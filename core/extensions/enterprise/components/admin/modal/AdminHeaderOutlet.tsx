import { cn } from "@core-ui/utils/cn";
import { useAdminHeaderStore } from "@ext/enterprise/components/admin/contexts/AdminHeaderContext";
import { ConnectionErrorBadge } from "@ext/enterprise/components/admin/ui-kit/ConnectionErrorBadge";
import { useSyncExternalStore } from "react";

const useHeaderContent = () => {
	const store = useAdminHeaderStore();
	return useSyncExternalStore(store.subscribe, store.getContent, store.getContent);
};

export const AdminHeaderOutlet = () => {
	const content = useHeaderContent();

	if (!content) return null;

	return (
		<div className={cn("flex flex-row justify-between items-center", content.className)}>
			<h1 className={cn("text-lg font-medium flex items-center gap-2", content.titleClassName)}>
				{content.title}
			</h1>
			<div className="flex items-center gap-2">
				<ConnectionErrorBadge alert={content.alert} />
				{content.actions}
			</div>
		</div>
	);
};
