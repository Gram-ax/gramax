import { CloseConfirmationDialog } from "@ext/enterprise/components/admin/ui-kit/CloseConfirmationDialog";
import type { Page } from "@ext/enterprise/types/Page";
import { createContext, type ReactNode, useCallback, useContext, useState } from "react";

export type TabGuard = {
	hasChanges: () => boolean;
	onSave: () => void | Promise<void>;
	onDiscard?: () => void | Promise<void>;
};

interface PendingClose {
	onSave: () => void | Promise<void>;
	onDiscard: () => void | Promise<void>;
}

interface GuardContextValue {
	register: (page: Page, guard: TabGuard) => void;
	unregister: (page: Page) => void;
	getGuard: (page: Page) => TabGuard | undefined;
	hasChanges: (page: Page) => boolean;
	clear: () => void;
	showUnsavedChangesModal: (
		guard: TabGuard | undefined,
		onSaveCallback: () => void | Promise<void>,
		onDiscardCallback: () => void | Promise<void>,
	) => void;
}

const GuardContext = createContext<GuardContextValue | undefined>(undefined);

export function GuardProvider({ children }: { children: ReactNode }) {
	const [guards, setGuards] = useState<Map<Page, TabGuard>>(new Map());
	const [pendingClose, setPendingClose] = useState<PendingClose | null>(null);

	const register = useCallback((page: Page, guard: TabGuard) => {
		setGuards((prev) => {
			const next = new Map(prev);
			next.set(page, guard);
			return next;
		});
	}, []);

	const unregister = useCallback((page: Page) => {
		setGuards((prev) => {
			const next = new Map(prev);
			next.delete(page);
			return next;
		});
	}, []);

	const getGuard = useCallback(
		(page: Page) => {
			return guards.get(page);
		},
		[guards],
	);

	const hasChanges = useCallback(
		(page: Page) => {
			return guards.get(page)?.hasChanges() ?? false;
		},
		[guards],
	);

	const clear = useCallback(() => {
		setGuards(new Map());
	}, []);

	const showUnsavedChangesModal = useCallback(
		(
			guard: TabGuard | undefined,
			onSaveCallback: () => void | Promise<void>,
			onDiscardCallback: () => void | Promise<void>,
		) => {
			setPendingClose({
				onSave: async () => {
					await guard?.onSave?.();
					await onSaveCallback();
				},
				onDiscard: async () => {
					await guard?.onDiscard?.();
					await onDiscardCallback();
				},
			});
		},
		[],
	);

	return (
		<GuardContext.Provider value={{ register, unregister, getGuard, hasChanges, clear, showUnsavedChangesModal }}>
			{children}
			<CloseConfirmationDialog
				isOpen={Boolean(pendingClose)}
				onClose={() => undefined}
				onDiscard={() => pendingClose?.onDiscard()}
				onOpenChange={(open) => !open && setPendingClose(null)}
			/>
		</GuardContext.Provider>
	);
}

export function useGuard() {
	const context = useContext(GuardContext);
	if (!context) {
		throw new Error("useGuard must be used within GuardProvider");
	}
	return context;
}
