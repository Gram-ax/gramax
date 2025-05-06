import Checkbox from "@components/Atoms/Checkbox";
import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";

export type SquashCheckboxProps = {
	onClick: (value: boolean) => void;
};

const Wrapper = styled.div`
	margin-left: 5px;
`;

const StyledIcon = styled(Icon)`
	margin-bottom: 2px;
	font-size: 13px;
`;

const SquashCheckbox = ({ onClick }: SquashCheckboxProps) => {
	return (
		<div className="control-label delete-after-merge-checkbox">
			<Checkbox overflow="hidden" onClick={onClick}>
				<div className="control-label picker-text" data-qa="qa-clickable">
					<span>{t("git.merge.squash")}</span>
					<Tooltip content={t("git.merge.squash-tooltip")}>
						<Wrapper>
							<StyledIcon code="circle-help" />
						</Wrapper>
					</Tooltip>
				</div>
			</Checkbox>
		</div>
	);
};

export default SquashCheckbox;
