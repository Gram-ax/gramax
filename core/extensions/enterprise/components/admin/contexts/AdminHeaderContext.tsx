import type { AlertMessageState } from "@ext/enterprise/components/admin/hooks/useAlertMessage";
import { createContext, type ReactNode, useContext, useMemo } from "react";

export interface StickyHeaderContent {
	title: ReactNode;
	actions?: ReactNode;
	className?: string;
	titleClassName?: string;
	alert?: AlertMessageState;
}

type Listener = () => void;

interface AdminHeaderStore {
	subscribe: (listener: Listener) => () => void;
	getContent: () => StickyHeaderContent | null;
	publish: (owner: object, content: StickyHeaderContent) => void;
	clear: (owner: object) => void;
}

const createAdminHeaderStore = (): AdminHeaderStore => {
	const listeners = new Set<Listener>();
	let entry: { owner: object; content: StickyHeaderContent } | null = null;

	const notify = () => listeners.forEach((listener) => listener());

	return {
		subscribe: (listener) => {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		getContent: () => entry?.content ?? null,
		publish: (owner, content) => {
			entry = { owner, content };
			notify();
		},
		clear: (owner) => {
			if (entry?.owner !== owner) return;
			entry = null;
			notify();
		},
	};
};

const AdminHeaderContext = createContext<AdminHeaderStore>(null);

interface AdminHeaderProviderProps {
	children: ReactNode;
}

export const AdminHeaderProvider = (props: AdminHeaderProviderProps) => {
	const store = useMemo(createAdminHeaderStore, []);
	return <AdminHeaderContext.Provider value={store}>{props.children}</AdminHeaderContext.Provider>;
};

export const useAdminHeaderStore = () => useContext(AdminHeaderContext);
