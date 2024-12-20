import { EnterpriseConfig } from "@app/config/AppConfig";
import Button from "@components/Atoms/Button/Button";
import Input from "@components/Atoms/Input";
import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import useWatch from "@core-ui/hooks/useWatch";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import t from "@ext/localization/locale/translate";
import { useState } from "react";

const EditEnterpriseConfig = ({
	open,
	config,
	onSave,
}: {
	open: boolean;
	config: EnterpriseConfig;
	onSave: (config: EnterpriseConfig) => void;
}) => {
	const [isOpen, setIsOpen] = useState(open);
	const [value, setValue] = useState(config.gesUrl);

	const [disabled, setDisabled] = useState(false);

	useWatch(() => {
		setIsOpen(open);
	}, [open]);

	return (
		<ModalLayout
			isOpen={isOpen}
			closeOnCmdEnter={false}
			onOpen={() => setIsOpen(true)}
			onClose={() => setIsOpen(false)}
		>
			<ModalLayoutLight>
				<FormStyle>
					<>
						<legend>{t("enterprise.ges-settings")}</legend>
						<fieldset>
							<div className="form-group">
								<div className="field field-string row" style={{ alignItems: "center" }}>
									<label className="control-label">{"GES URL"}</label>
									<div className="input-lable">
										<Input
											isCode
											value={value}
											onChange={async (e) => {
												const gesUrl = e.target.value;
												setValue(gesUrl);
												setDisabled(true);
												if (!gesUrl || gesUrl === "") return setDisabled(false);
												setDisabled(!(await new EnterpriseApi(gesUrl).check()));
											}}
										/>
									</div>
								</div>
							</div>
						</fieldset>
						<div className="buttons">
							<Button disabled={disabled} onClick={() => onSave({ gesUrl: value })}>
								{t("save")}
							</Button>
						</div>
					</>
				</FormStyle>
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default EditEnterpriseConfig;
