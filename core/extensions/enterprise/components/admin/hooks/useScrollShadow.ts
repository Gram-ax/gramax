import { useScrollContainer } from "@ext/enterprise/components/admin/contexts/ScrollContainerContext";
import { useEffect, useState } from "react";

export const useScrollShadow = () => {
	const [isScrolled, setIsScrolled] = useState(false);
	const scrollContainer = useScrollContainer();

	useEffect(() => {
		if (!scrollContainer) return;

		const handleScroll = () => setIsScrolled(scrollContainer.scrollTop > 0);

		scrollContainer.addEventListener("scroll", handleScroll);
		handleScroll();

		return () => scrollContainer.removeEventListener("scroll", handleScroll);
	}, [scrollContainer]);

	return { isScrolled };
};
