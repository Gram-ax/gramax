import ModifiedBackend from "@ext/navigation/catalog/drag/logic/ModifiedBackend";
import { DndProvider } from "react-dnd";
import ValueHandler from "@ext/properties/components/Helpers/ValueHandler";
import styled from "@emotion/styled";
import { memo, useCallback } from "react";
import t from "@ext/localization/locale/translate";
import ButtonLink from "@components/Molecules/ButtonLink";

interface MenuProps {
	name: string;
	data: string[];
	updateData: (name: string, value?: string | string[]) => void;
	className?: string;
}

const Menu = memo(({ name, data, updateData, className }: MenuProps) => {
	const onChange = useCallback(
		(values: string[]) => {
			updateData(name, values);
		},
		[updateData, name],
	);

	const deleteHandler = useCallback(() => {
		updateData(name);
	}, [updateData, name]);

	return (
		<DndProvider backend={ModifiedBackend}>
			<ButtonLink text={t("reset")} iconCode="rotate-ccw" onClick={deleteHandler} />
			<span className={`${className} tree-root`}>
				<ValueHandler data={data} isActions={false} onChange={onChange} />
			</span>
		</DndProvider>
	);
});

export default styled(Menu)`
	display: block;
	padding: 0.5em;
	cursor: default !important;

	i {
		font-size: 14px !important;
	}

	.value-handler > div {
		cursor: default;
	}
`;
