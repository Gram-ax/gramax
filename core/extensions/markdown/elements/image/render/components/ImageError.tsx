import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { LfsPointerError, type ResourceError } from "@ext/markdown/elements/copyArticles/errors";
import { Icon } from "@ui-kit/Icon";

export interface ImageErrorProps {
	width: string;
	height: string;
	resourceError?: ResourceError;
}

const Container = styled.div<{ width: string; height: string; borderColor: string; backgroundColor: string }>`
	display: flex;

	cursor: default;

	border: 1px solid ${({ borderColor }) => borderColor};
	border-radius: var(--radius-small);
	background-color: ${({ backgroundColor }) => backgroundColor};

	width: ${({ width }) => width} !important;

	min-width: fit-content;
	min-height: fit-content;

	max-width: 100%;
`;

const Wrapper = styled.div<{ color: string }>`
	display: flex;

	padding: 1.5rem 1.75rem 1.5rem 1.5rem;

	svg {
		color: ${({ color }) => color};
		stroke-width: 1.25;
	}
`;

const Header = styled.div`
	color: ${({ color }) => color};
	font-weight: 500;
`;

const Body = styled.div`
	margin-left: 1.8rem;
`;

const getErrorData = (resourceError: ResourceError) => {
	if (resourceError instanceof LfsPointerError) {
		return {
			icon: "cloud-alert",
			title: t("alert.image.unavailable"),
			body: t("git.lfs.file-is-pointer"),

			color: "hsl(var(--secondary-fg))",
			borderColor: "hsl(var(--primary-border))",
			backgroundColor: "hsl(var(--primary-bg))",
		};
	}

	return {
		icon: "circle-alert",
		title: t("alert.image.unavailable"),
		body: t("alert.image.path"),
		color: "hsl(var(--status-error))",
		borderColor: "hsl(var(--status-error-border))",
		backgroundColor: "hsl(var(--status-error-bg))",
	};
};

const ImageError = ({ width, height, resourceError }: ImageErrorProps) => {
	const { icon, title, body, color, borderColor, backgroundColor } = getErrorData(resourceError);

	return (
		<Container
			backgroundColor={backgroundColor}
			borderColor={borderColor}
			className="main-container"
			data-focusable="true"
			height={height}
			width={width}
		>
			<Wrapper color={color}>
				<div>
					<p className="flex items-center gap-2">
						<Icon icon={icon} size="lg" />
						<Header color={color}>{title}</Header>
					</p>

					<Body>{body}</Body>
				</div>
			</Wrapper>
		</Container>
	);
};

export default ImageError;
