import type { FilterAndSortProps } from "@ext/markdown/elements/table/edit/model/tableTypes";
import { createContext, type ReactNode, useContext, useMemo } from "react";

type TablePropsContextType = {
	tableProps: FilterAndSortProps | undefined;
};

const TablePropsContext = createContext<TablePropsContextType | null>(null);

interface TablePropsProviderProps {
	children: ReactNode;
	tableProps: FilterAndSortProps;
}

export const TablePropsProvider = ({ children, tableProps }: TablePropsProviderProps) => {
	const value = useMemo(() => ({ tableProps }), [tableProps]);

	return <TablePropsContext.Provider value={value}>{children}</TablePropsContext.Provider>;
};

export const useTableProps = () => useContext(TablePropsContext);
