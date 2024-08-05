import GetErrorComponent from "@ext/errorHandlers/logic/GetErrorComponent";
import t from "@ext/localization/locale/translate";
import { ComponentProps } from "react";
import InfoModalForm from "../../../../../errorHandlers/client/components/ErrorForm";

const CloneErrorComponent = ({ error, onCancelClick }: ComponentProps<typeof GetErrorComponent>) => {
	return (
		<InfoModalForm onCancelClick={onCancelClick} title={t("clone-fail")} closeButton={{ text: t("ok") }}>
			<div className="article">
				<span>
					{t("clone-error-desc1")}{" "}
					<a href={error.props.repUrl} target="_blank" rel="noreferrer">
						{error.props.repUrl}
					</a>
					. {t("clone-error-desc2")}
				</span>
			</div>
		</InfoModalForm>
	);
};

export default CloneErrorComponent;
