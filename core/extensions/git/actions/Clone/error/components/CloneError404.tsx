import GetErrorComponent from "@ext/errorHandlers/logic/GetErrorComponent";
import { ComponentProps } from "react";
import InfoModalForm from "../../../../../errorHandlers/client/components/ErrorForm";
import useLocalize from "../../../../../localization/useLocalize";

const CloneError404Component = ({ error, onCancelClick }: ComponentProps<typeof GetErrorComponent>) => {
	return (
		<InfoModalForm
			onCancelClick={onCancelClick}
			title={useLocalize("cloneFail")}
			closeButton={{ text: useLocalize("ok") }}
		>
			<div className="article">
				<span>{useLocalize("noAccessToRepository")} </span>
				<a href={error.props.repUrl} target="_blank" rel="noreferrer">
					{error.props.repUrl}
				</a>
				<ul>
					<li>{useLocalize("cloneError404Desc1")}</li>
					<li>{useLocalize("cloneError404Desc2")}</li>
				</ul>
			</div>
		</InfoModalForm>
	);
};

export default CloneError404Component;
