import Icon from "@components/Atoms/Icon";
import { forwardRef } from "react";

interface PlayButtonProps {
	className?: string;
	onClick?: () => void;
}

const PlayButton = forwardRef<HTMLElement, PlayButtonProps>(({ className, onClick }, ref) => {
	return (
		<div className={className} onClick={onClick}>
			<Icon
				className="[&_svg]:absolute [&_svg]:inset-0 [&_svg]:m-auto [&_svg]:z-[var(--z-index-foreground)] [&_svg]:h-[min(5em,70%)] [&_svg]:w-auto [&_svg]:cursor-pointer [&_svg]:text-[color:var(--color-white)] [&_svg]:[filter:drop-shadow(0px_0px_2px_rgba(0,0,0,0.7))]"
				code="play-button"
				ref={ref}
			/>
		</div>
	);
});

export default PlayButton;
