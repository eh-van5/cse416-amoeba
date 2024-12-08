import { ReactElement } from "react";
import { useAppContext } from "../../AppContext";

interface itemsTableProps {
    headings: string[],
    items: ReactElement[],
}
export default function FilesTable ({
    headings,
    items
}: itemsTableProps){
    const {isDarkMode} = useAppContext();
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



