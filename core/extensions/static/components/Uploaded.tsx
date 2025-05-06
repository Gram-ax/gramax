import Button from "@components/Atoms/Button/Button";
import PureLink from "@components/Atoms/PureLink";
import FormStyle from "@components/Form/FormStyle";
import t from "@ext/localization/locale/translate";

interface UploadedProps {
	url: string;
	onOkClick?: () => void;
}

const Uploaded = ({ url, onOkClick }: UploadedProps) => {
	return (
		<FormStyle>
			<fieldset>
				<legend>{t("cloud.upload-success")}</legend>
				<span className="article">
					{t("cloud.upload-success-link") + ": "} <PureLink href={url}>{url}</PureLink>
				</span>
				<div className="buttons">
					<Button onClick={onOkClick}>{t("ok")}</Button>
				</div>
			</fieldset>
		</FormStyle>
	);
};

export default Uploaded;
