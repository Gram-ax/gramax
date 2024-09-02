import FormStyle from "@components/Form/FormStyle";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import type { HTMLAttributes, ReactNode } from "react";

type WelcomeProps = {
	title: string;
	body: ReactNode;
	actions: ReactNode;
	article?: boolean;
} & HTMLAttributes<HTMLDivElement>;

const Welcome = ({ title, body, actions, ...props }: WelcomeProps) => {
	const isLogged = PageDataContextService.value.isLogged;

	return (
		<div {...props}>
			<div>
				<ModalLayoutLight>
					<FormStyle>
						<>
							<h2>{title}</h2>
							{isLogged && (
								<>
									{body}
									<ActionsContainer>{actions}</ActionsContainer>
								</>
							)}
						</>
					</FormStyle>
				</ModalLayoutLight>
			</div>
		</div>
	);
};

const WelcomeStyled = styled(Welcome)`
	height: inherit;
	max-width: 50rem;
	width: 100%;

	align-items: center;
	justify-content: center;
	display: flex;
	flex: 1;

	a {
		color: var(--color-link);
	}

	h2 {
		margin-top: 0 !important;
		line-height: 1;
	}

	ul {
		margin: 0;
	}

	${(p) =>
		p.article &&
		`.form-layout {
		  background: var(--color-contextmenu-bg);
	}`}
	.form-layout {
		padding: 2rem;
	}

	> div {
		border-radius: var(--radius-small);
		border: 1px solid rgba(0, 0, 0, 0.1);
		overflow: hidden;
		margin: auto;

		> div {
			display: flex;
			align-items: flex-start;
		}
	}

	${cssMedia.medium} {
		min-width: 0;

		> div {
			width: 100%;
		}
	}
`;

const ActionsContainer = styled.div`
	padding-top: 1rem;
	gap: 2rem;
	width: 100%;

	display: flex;
	justify-content: center;
	align-items: center;

	ul {
		margin-block-start: 0;
	}

	> * {
		flex: 1;
		.content {
			width: 100%;
		}
	}

	${cssMedia.medium} {
		align-items: center;
		justify-content: space-around;
	}
`;

export default WelcomeStyled;
