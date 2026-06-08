import Icon from "@components/Atoms/Icon";
import { forwardRef } from "react";

interface PlayButtonProps {
	className?: string;
	iconClassName?: string;
	onClick?: () => void;
}

const PlayButton = forwardRef<HTMLElement, PlayButtonProps>(({ className, iconClassName, onClick }, ref) => {
	return (
		<div className={className} onClick={onClick}>
			<Icon className={iconClassName} code="play-button" ref={ref} />
		</div>
	);
});

export default PlayButton;
