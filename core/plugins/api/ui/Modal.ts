import DefaultModal from "@core-ui/ContextServices/ModalToOpenService/components/DefaultModal";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { ModalProps } from "@gramax/sdk/ui";
import { ComponentProps } from "react";

export class Modal {
	title: ModalProps["title"];
	content?: ModalProps["content"];
	status?: ModalProps["status"];
	description?: ModalProps["description"];
	primaryButtonProps?: ModalProps["primaryButtonProps"];
	secondaryButtonProps?: ModalProps["secondaryButtonProps"];

	constructor(props?: ModalProps) {
		if (props) {
			this.title = props.title;
			this.content = props.content;
			this.status = props.status;
			this.description = props.description;
			this.primaryButtonProps = props.primaryButtonProps;
			this.secondaryButtonProps = props.secondaryButtonProps;
		}
	}

	setTitle(title: string): this {
		this.title = title;
		return this;
	}

	setContent(content: ModalProps["content"]): this {
		this.content = content;
		return this;
	}

	setStatus(status: ModalProps["status"]): this {
		this.status = status;
		return this;
	}

	setDescription(description: ModalProps["description"]): this {
		this.description = description;
		return this;
	}

	setPrimaryButtonProps(props: ModalProps["primaryButtonProps"]): this {
		this.primaryButtonProps = props;
		return this;
	}
	setSecondaryButtonProps(props: ModalProps["secondaryButtonProps"]): this {
		this.secondaryButtonProps = props;
		return this;
	}
	open(): void {
		const modalId = ModalToOpenService.addModal<ComponentProps<typeof DefaultModal>>(ModalToOpen.DefaultModal, {
			title: this.title,
			content: this.content,
			description: this.description,
			status: this.status,
			primaryButtonProps: this.primaryButtonProps,
			secondaryButtonProps: this.secondaryButtonProps,
			onClose: () => ModalToOpenService.removeModal(modalId),
		});
	}
}
