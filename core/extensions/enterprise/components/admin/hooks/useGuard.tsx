import { Page } from "@ext/enterprise/types/EnterpriseAdmin";
import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import type UnsavedChangesModal from "@components/UnsavedChangesModal";
import type { ComponentProps } from "react";

export type TabGuard = {
	hasChanges: () => boolean;
	onSave: () => void | Promise<void>;
	onDiscard?: () => void | Promise<void>;
};

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
			const modalId = ModalToOpenService.addModal<ComponentProps<typeof UnsavedChangesModal>>(
				ModalToOpen.UnsavedChangesModal,
				{
					isOpen: true,
					onOpenChange: () => ModalToOpenService.removeModal(modalId),
					onSave: async () => {
						await guard?.onSave?.();
						await onSaveCallback();
						ModalToOpenService.removeModal(modalId);
					},
					onDontSave: async () => {
						await guard?.onDiscard?.();
						await onDiscardCallback();
						ModalToOpenService.removeModal(modalId);
					},
				},
			);
		},
		[],
	);

	return (
		<GuardContext.Provider value={{ register, unregister, getGuard, hasChanges, clear, showUnsavedChangesModal }}>
			{children}
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
