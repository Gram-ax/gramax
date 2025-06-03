import { TextSize } from "@components/Atoms/Button/Button";
import Tooltip from "@components/Atoms/Tooltip";
import ButtonLink from "@components/Molecules/ButtonLink";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";

interface TopBarControllersProps {
	onClose: () => void;
	className?: string;
}

const TopBarControllers = ({ onClose, className }: TopBarControllersProps) => {
	return (
		<div className={className}>
			<Tooltip content={t("close")}>
				<ButtonLink textSize={TextSize.L} onClick={onClose} iconCode="x" />
			</Tooltip>
		</div>
	);
};

export default styled(TopBarControllers)`
	position: absolute;
	top: 0.5em;
	right: 0.5em;
	z-index: var(--z-index-base);
	display: flex;
	align-items: center;
	justify-content: end;
`;
