import Button from "@components/Atoms/Button/Button";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";

export interface ReplacerProps {
	name: string;
	replaceText: string;
	description: string;
	onClick: (replaceText: string) => void;
	className?: string;
}

const Replacer = (props: ReplacerProps) => {
	const { name, replaceText, onClick, description, className } = props;
	return (
		<ModalLayoutLight>
			<div className={className}>
				<div className="name">{name}</div>
				<p className="description">{description}</p>
				{replaceText !== null && (
					<>
						<div className="replace-text">
							{replaceText ? (
								<>
									<div>{t("style-guide.replace-text")}</div>
									<pre>{replaceText}</pre>
								</>
							) : (
								<div>{t("style-guide.delete-text")}</div>
							)}
						</div>

						<div className="buttons-layout">
							<Button isEmUnits onClick={() => onClick(replaceText)}>
								{t(replaceText ? "replace" : "delete")}
							</Button>
						</div>
					</>
				)}
			</div>
		</ModalLayoutLight>
	);
};

export default styled(Replacer)`
	padding: 0.7em;
	font-size: 12px;
	border-radius: var(--radius-x-large);
	box-shadow: var(--shadows-changeable-deeplight);

	.name {
		font-weight: 500;
	}

	.description {
		font-weight: 400;
		margin-bottom: 0;
	}

	.replace-text {
		pre {
			margin: 0;
			padding: 0.5em 1em;
			border-radius: var(--radius-small);
		}
	}

	.buttons-layout {
		display: flex;
		margin-top: 1em;
		line-height: 150%;
		justify-content: flex-end;

		.default {
			border-radius: var(--radius-small);
		}
	}
`;
