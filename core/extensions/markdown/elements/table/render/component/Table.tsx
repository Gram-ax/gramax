import WidthWrapper from "@components/WidthWrapper/WidthWrapper";
import ColGroup from "@ext/markdown/elements/table/edit/components/Helpers/ColGroup";
import { useAggregation } from "@ext/markdown/elements/table/edit/logic/aggregation";
import { TableHeaderTypes } from "@ext/markdown/elements/table/edit/model/tableTypes";
import TableWrapper from "@ext/markdown/elements/table/render/component/TableWrapper";
import { ReactElement, useLayoutEffect, useRef, useState } from "react";
import { Wrapper } from "@ext/markdown/elements/table/edit/components/TableComponent";

interface TableProps {
	children?: any;
	header?: TableHeaderTypes;
	isPrint?: boolean;
}

const Table = (props: TableProps): ReactElement => {
	const { children, header, isPrint } = props;
	const ref = useRef<HTMLTableElement>(null);
	const [isEnabledWrapper, setIsEnabledWrapper] = useState(false);

	useAggregation(ref);

	const table =
		typeof children === "string" ? (
			<table
				ref={ref}
				dangerouslySetInnerHTML={{ __html: children }}
				suppressHydrationWarning={true}
				data-header={header}
				data-focusable="true"
			/>
		) : (
			<table ref={ref} data-header={header} data-focusable="true" style={{ padding: "1.5em 0" }}>
				<ColGroup tableRef={ref} isPrint={isPrint} />
				{children}
			</table>
		);

	if (isPrint) return table;

	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return;

		const wrapper = el.closest('[data-wrapper="table"]');
		setIsEnabledWrapper(wrapper?.parentElement?.nodeName === "ARTICLE");
	});

	const WrapperComponent = isEnabledWrapper ? WidthWrapper : Wrapper;

	return (
		<WrapperComponent data-wrapper="table">
			<TableWrapper>{table}</TableWrapper>
		</WrapperComponent>
	);
};

export default Table;
