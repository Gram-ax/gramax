import Icon from "@components/Atoms/Icon";
import { forwardRef } from "react";

interface PlayButtonProps {
	className?: string;
	onClick?: () => void;
}

const PlayButton = forwardRef<HTMLElement, PlayButtonProps>(({ className, onClick }, ref) => {
	return (
		<div className={className} onClick={onClick}>
			<Icon ref={ref} code="play-button" />
		</div>
	);
});

export default PlayButton;
