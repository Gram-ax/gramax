import ActionConfirm, { type ActionConfirmProps } from "@components/Atoms/ActionConfirm";
import Icon from "@components/Atoms/Icon";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import t from "@ext/localization/locale/translate";
import { DropdownMenuItem } from "@ui-kit/Dropdown";
import { ComponentProps, MouseEvent } from "react";

export type DeleteItemProps = Partial<ActionConfirmProps> & {
	buttonText?: string;

	isLoading?: boolean;

	confirmTitle?: string;
	confirmBody?: React.ReactNode | string;

	onClick?: (event: Event | MouseEvent) => void;
};

const DeleteItem = (props: DeleteItemProps) => {
	const { buttonText: text = t("delete"), isLoading, onClick, ...rest } = props;

	if (rest.confirmTitle && rest.confirmBody) {
		const onSelect = () => {
			ModalToOpenService.setValue<ComponentProps<typeof ActionConfirm>>(ModalToOpen.ActionConfirm, {
				...(rest as ActionConfirmProps),
				initialIsOpen: true,
				onConfirm: () => {
					rest.onConfirm?.();
					ModalToOpenService.resetValue();
				},
				onClose: () => {
					rest.onClose?.();
					ModalToOpenService.resetValue();
				},
			});
		};

		return (
			<DropdownMenuItem type="danger" onSelect={onSelect}>
				{isLoading ? <SpinnerLoader width={14} height={14} /> : <Icon code="trash" />}
				{text}
			</DropdownMenuItem>
		);
	}

	const onClickHandler = (event: Event) => {
		onClick?.(event);
		rest.onConfirm?.();
	};

	return (
		<DropdownMenuItem onSelect={onClickHandler} type="danger">
			<Icon code="trash" />
			{text}
		</DropdownMenuItem>
	);
};

export default DeleteItem;
