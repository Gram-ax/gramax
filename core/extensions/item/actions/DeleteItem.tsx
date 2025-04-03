import ButtonLink from "@components/Molecules/ButtonLink";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";

export type DeleteItemProps = {
	className?: string;
	text?: string;
};

const DeleteItem = (props: DeleteItemProps) => {
	const { text = t("delete"), className } = props;

	return (
		<div className={className}>
			<ButtonLink iconCode="trash" text={text} />
		</div>
	);
};

export default styled(DeleteItem)`
	&:hover span,
	&:hover svg {
		color: red !important;
	}
`;
