import { TooltipIconButton } from "@components/Atoms/TooltipIconButton";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import NavigationDropdown from "@ext/navigation/components/NavigationDropdown";
import { IconButton } from "@ui-kit/Button";

const Title = styled.span`
	font-size: 14px;
	text-transform: uppercase;
	margin-right: 0.85em;
	font-weight: 400;
	white-space: nowrap;
	overflow: hidden;
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
	height: 1.5rem;
`;

const Part = styled.span`
	display: flex;
	align-items: center;
	flex-wrap: nowrap;
	overflow: hidden;
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
	leftExtension?: JSX.Element;
	rightExtension?: JSX.Element;
};

const Header = (props: HeaderProps) => {
	const { title, rightExtension, onClose, actions, leftExtension } = props;

	return (
		<Wrapper>
			{leftExtension && (
				<Part className="mr-2 shrink-0">
					<IconsWrapper>{leftExtension}</IconsWrapper>
				</Part>
			)}
			<Part className="flex-1">
				{title && <Title className="tab-wrapper-title">{title}</Title>}
				{rightExtension}
			</Part>
			{onClose && (
				<Part className="shrink-0">
					<IconsWrapper>
						{actions && (
							<NavigationDropdown
								trigger={
									<IconButton
										className="shrink-0"
										icon="ellipsis-vertical"
										iconClassName="h-5 w-5"
										size="xs"
										variant="text"
									/>
								}
							>
								{actions}
							</NavigationDropdown>
						)}

						<TooltipIconButton
							className="shrink-0"
							icon="x"
							iconClassName="h-5 w-5"
							onClick={onClose}
							size="xs"
							tooltip={t("close")}
							variant="text"
						/>
					</IconsWrapper>
				</Part>
			)}
		</Wrapper>
	);
};

export default Header;
