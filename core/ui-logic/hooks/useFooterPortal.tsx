import React, { createContext, useContext, useState, ReactNode, PropsWithChildren } from "react";

interface FooterPortalContextType {
	primaryButton: ReactNode;
	setPrimaryButton: (button: ReactNode) => void;
	secondaryButton: ReactNode;
	setSecondaryButton: (button: ReactNode) => void;
}

const FooterPortalContext = createContext<FooterPortalContextType | null>(null);

export const FooterPortalProvider: React.FC<PropsWithChildren> = ({ children }) => {
	const [primaryButton, setPrimaryButton] = useState<ReactNode>(null);
	const [secondaryButton, setSecondaryButton] = useState<ReactNode>(null);

	const value: FooterPortalContextType = {
		primaryButton,
		setPrimaryButton,
		secondaryButton,
		setSecondaryButton,
	};

	return <FooterPortalContext.Provider value={value}>{children}</FooterPortalContext.Provider>;
};

export const useFooterPortal = () => {
	const context = useContext(FooterPortalContext);
	if (!context) throw new Error("useFooterPortal must be used within a FooterPortalProvider");
	return context;
};

export const useSetFooterButton = () => {
	const { setPrimaryButton, setSecondaryButton } = useFooterPortal();

	return {
		setPrimaryButton,
		setSecondaryButton,
	};
};

export const useGetFooterButtons = () => {
	const { primaryButton, secondaryButton } = useFooterPortal();

	return {
		primaryButton,
		secondaryButton,
	};
};
