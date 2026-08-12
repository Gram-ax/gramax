import { useState } from "react";

export const useSidebarGroupOpen = (containsActivePage: boolean, isTargetActive: boolean) => {
	const [open, setOpen] = useState(containsActivePage);
	const onItemClick = () => setOpen(!(open && isTargetActive));
	return { open, setOpen, onItemClick };
};
