import { TextSize } from "@components/Atoms/Button/Button";
import Tooltip from "@components/Atoms/Tooltip";
import ButtonLink from "@components/Molecules/ButtonLink";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import NavigationDropdown from "@ext/navigation/components/NavigationDropdown";

const Title = styled.span`
	font-size: 14px;
	text-transform: uppercase;
	font-weight: 400;
	white-space: nowrap;
`;

const Wrapper = styled.span`
	display: flex;
	align-items: center;
	margin-bottom: 0.4em;
	line-height: 16px;
	justify-content: space-between;
	padding-bottom: 0.1em;
	padding-left: 1rem;
	padding-right: 1rem;
`;

const Part = styled.span`
	display: flex;
	align-items: center;
	flex-wrap: nowrap;
	gap: 0.85em;
	max-width: 85%;
	overflow-y: hidden;
	overflow-x: auto;
	scrollbar-width: none;
	-ms-overflow-style: none;
	::-webkit-scrollbar {
		display: none;
	}
`;

const IconsWrapper = styled.div`
	margin-right: -8px;
	display: flex;
	align-items: center;
`;

export type HeaderProps = {
	title: string;
	show: boolean;
	onClose?: () => void;
	actions?: JSX.Element;
	rightExtension?: JSX.Element;
};

const Header = (props: HeaderProps) => {
	const { title, rightExtension, onClose, show, actions } = props;

	return (
		<Wrapper>
			<Part>
				{title && <Title className="tab-wrapper-title">{title}</Title>}
				{rightExtension}
			</Part>
			{onClose && (
				<Part>
					<IconsWrapper>
						{actions && (
							<NavigationDropdown
								trigger={
									<ButtonLink iconCode="ellipsis-vertical" onClick={() => {}} textSize={TextSize.M} />
								}
							>
								{actions}
							</NavigationDropdown>
						)}

						<Tooltip content={show ? t("close") : null} offset={[-2, 8]}>
							<ButtonLink iconCode="x" onClick={onClose} textSize={TextSize.L} />
						</Tooltip>
					</IconsWrapper>
				</Part>
			)}
		</Wrapper>
	);
};

export default Header;
