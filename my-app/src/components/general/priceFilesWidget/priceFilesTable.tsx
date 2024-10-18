import { ReactElement, useEffect } from "react";
import { useTheme } from "../../../ThemeContext";

interface itemsTableProps {
    headings: string[],
    items: ReactElement[],
}
export default function PriceItemsTable ({
    headings,
    items
}: itemsTableProps){
    const {isDarkMode} = useTheme();
    const formattedHeader = headings.map(heading => {
        return <span className={`items-table-header${isDarkMode? '-dark' : ''}`}>{heading}</span>
    });

    return (
        <div className={`items-table${isDarkMode? '-dark' : ''}`}>
            {formattedHeader}
            {items}
        </div>
    );
};



