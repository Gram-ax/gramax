import { create } from "zustand";

interface AgentChatIsOpenState {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
}

const useAgentChatIsOpenStore = create<AgentChatIsOpenState>()((set) => ({
	isOpen: false,
	setIsOpen: (isOpen) => set({ isOpen }),
}));

export const useAgentChatIsOpen = () => useAgentChatIsOpenStore((s) => s.isOpen);
export const setAgentChatIsOpen = (isOpen: boolean) => useAgentChatIsOpenStore.getState().setIsOpen(isOpen);

export default useAgentChatIsOpenStore;
