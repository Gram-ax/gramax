import ActionConfirm, { type ActionConfirmProps } from "@components/Atoms/ActionConfirm";
import ButtonLink from "@components/Molecules/ButtonLink";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { MouseEvent } from "react";

export type DeleteItemProps = Partial<ActionConfirmProps> & {
	className?: string;
	buttonText?: string;

	isLoading?: boolean;

	confirmTitle?: string;
	confirmBody?: React.ReactNode | string;

	onClick?: (event: MouseEvent) => void;
};

const DeleteItem = (props: DeleteItemProps) => {
	const { buttonText: text = t("delete"), className, isLoading, onClick, ...rest } = props;

	if (rest.confirmTitle && rest.confirmBody) {
		return (
			<div className={className}>
				<ActionConfirm {...(rest as ActionConfirmProps)} confirmText={text}>
					<ButtonLink className={className} iconCode="trash" text={text} iconIsLoading={isLoading} />
				</ActionConfirm>
			</div>
		);
	}

	const onClickHandler = (event: MouseEvent) => {
		onClick?.(event);
		rest.onConfirm?.();
	};

	return (
		<ButtonLink
			className={className}
			onClick={onClickHandler}
			iconCode="trash"
			text={text}
			iconIsLoading={isLoading}
		/>
	);
};

export default styled(DeleteItem)`
	&:hover span,
	&:hover svg {
		color: red !important;
	}
`;
