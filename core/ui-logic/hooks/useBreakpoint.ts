import { useMediaQuery } from "@react-hook/media-query";

const breakpoints = {
	sm: "640px",
	md: "768px",
	lg: "1024px",
	xl: "1280px",
	"2xl": "1536px",
} as const;

export type Breakpoint = keyof typeof breakpoints;

const useIsSm = () => useMediaQuery(`(min-width: ${breakpoints.sm})`);
const useIsMd = () => useMediaQuery(`(min-width: ${breakpoints.md})`);
const useIsLg = () => useMediaQuery(`(min-width: ${breakpoints.lg})`);
const useIsXl = () => useMediaQuery(`(min-width: ${breakpoints.xl})`);
const useIs2Xl = () => useMediaQuery(`(min-width: ${breakpoints["2xl"]})`);

export const useBreakpoint = (): Breakpoint => {
	const is2Xl = useIs2Xl();
	const isXl = useIsXl();
	const isLg = useIsLg();
	const isMd = useIsMd();
	const isSm = useIsSm();

	if (is2Xl) return "2xl";
	if (isXl) return "xl";
	if (isLg) return "lg";
	if (isMd) return "md";
	if (isSm) return "sm";
	return "sm";
};
