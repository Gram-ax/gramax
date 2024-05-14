import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import GetErrorComponent from "@ext/errorHandlers/logic/GetErrorComponent";
import useLocalize from "@ext/localization/useLocalize";
import { ComponentProps } from "react";

const CommandNotFoundError = (args: ComponentProps<typeof GetErrorComponent>) => {
	return (
		<InfoModalForm
			{...args}
			title={useLocalize("error")}
			icon={{ code: "circle-xmark", color: "var(--color-danger)" }}
		>
			<span>{`${useLocalize("command")} "${args.error.props.commandPath}" ${useLocalize(
				"notFound2",
			).toLowerCase()}`}</span>
		</InfoModalForm>
	);
};

export default CommandNotFoundError;
