import { createContext, useContext } from "react";

type ResetSettingsFormContextValue = {
	markReset: (key: string) => void;
};

const ResetSettingsFormContext = createContext<ResetSettingsFormContextValue | null>(null);

export const ResetSettingsFormProvider = ResetSettingsFormContext.Provider;

export const useResetSettingsForm = () => useContext(ResetSettingsFormContext);
