import sendBug from "@ext/bugsnag/logic/sendBug";
import ErrorHandler, { type ErrorHandlerProps } from "@ext/errorHandlers/client/components/ErrorHandler";
import t from "@ext/localization/locale/translate";
import type { ComponentType, ReactNode } from "react";
import { ModalInlineError } from "./ModalInlineError";

interface ModalErrorHandlerProps extends ErrorHandlerProps {
	onClose: () => void;
	onError?: () => void;
	wrapper?: ComponentType<{ children: ReactNode }>;
}

class ModalErrorHandler extends ErrorHandler<ModalErrorHandlerProps> {
	override renderError() {
		const children = (
			<ModalInlineError
				error={this.state.error}
				isCommandError
				message={t("app.error.command-failed.body")}
				onClose={this.props.onClose}
				title={t("app.error.command-failed.title")}
			/>
		);
		const Wrapper = this.props.wrapper;
		return Wrapper ? <Wrapper>{children}</Wrapper> : children;
	}

	override componentDidCatch(error: Error): void {
		this.props.onError?.();
		sendBug(error);
	}
}

export default ModalErrorHandler;
