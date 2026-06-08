import GesCloudOrgSettingsPage from "@ext/enterprise-cloud/types/GesCloudOrgSettingsPage";
import assert from "assert";
import { createContext, type ReactNode, useCallback, useContext, useState } from "react";

interface OrganizationSettingsNavigationContextValue {
	page: GesCloudOrgSettingsPage;
	tryNavigate: <P extends GesCloudOrgSettingsPage>(page: P) => void;
	subscribeToNavigation: (handler: (event: NavigateEvent) => void) => () => void;
	tryCloseModal: () => void;
	subscribeToModalClose: (handler: (event: ModalCloseEvent) => void) => () => void;
}

const OrganizationSettingsNavigationContext = createContext<OrganizationSettingsNavigationContextValue | undefined>(
	undefined,
);

interface OrganizationSettingsNavigationProviderProps {
	children: ReactNode;
	initialPage?: GesCloudOrgSettingsPage;
	onClose: () => void;
}

interface NavigateEvent {
	execute: () => void;
}

interface ModalCloseEvent {
	execute: () => void;
}

export const OrganizationSettingsNavigationProvider = ({
	children,
	initialPage = GesCloudOrgSettingsPage.ORGANIZATION,
	onClose,
}: OrganizationSettingsNavigationProviderProps) => {
	const [page, setPage] = useState<GesCloudOrgSettingsPage>(initialPage);

	const [onNavigate, setOnNavigate] = useState<((event: NavigateEvent) => void) | undefined>(undefined);
	const [onModalClose, setOnModalClose] = useState<((event: ModalCloseEvent) => void) | undefined>(undefined);

	const navigate = useCallback(<P extends GesCloudOrgSettingsPage>(newPage: P) => {
		setPage(newPage);
	}, []);

	const tryNavigate = useCallback(
		<P extends GesCloudOrgSettingsPage>(newPage: P) => {
			const event: NavigateEvent = { execute: () => navigate(newPage) };
			if (onNavigate) onNavigate(event);
			else event.execute();
		},
		[navigate, onNavigate],
	);

	const subscribeToNavigation = useCallback((handler: (event: NavigateEvent) => void) => {
		setOnNavigate(() => handler);
		return () => {
			setOnNavigate(undefined);
		};
	}, []);

	const tryCloseModal = useCallback(() => {
		const event: ModalCloseEvent = {
			execute: () => {
				onClose();
			},
		};
		if (onModalClose) onModalClose(event);
		else event.execute();
	}, [onModalClose, onClose]);

	const subscribeToModalClose = useCallback((handler: (event: ModalCloseEvent) => void) => {
		setOnModalClose(() => handler);
		return () => {
			setOnModalClose(undefined);
		};
	}, []);

	const value: OrganizationSettingsNavigationContextValue = {
		page,
		tryNavigate,
		subscribeToNavigation,
		tryCloseModal,
		subscribeToModalClose,
	};

	return (
		<OrganizationSettingsNavigationContext.Provider value={value}>
			{children}
		</OrganizationSettingsNavigationContext.Provider>
	);
};

export const useOrganizationSettingsNavigation = () => {
	const context = useContext(OrganizationSettingsNavigationContext);

	assert(context, "useOrganizationSettingsNavigation must be used within OrganizationSettingsNavigationProvider");

	return {
		tryNavigate: context.tryNavigate,
		subscribeToNavigation: context.subscribeToNavigation,
		page: context.page,
		tryCloseModal: context.tryCloseModal,
		subscribeToModalClose: context.subscribeToModalClose,
	};
};
