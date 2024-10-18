import { ReactElement, useEffect } from "react";
import { useTheme } from "../../ThemeContext";

interface formatItemsProps{
    colNum: number,
    items: JSX.Element[]
}
function formatItems({colNum, items}: formatItemsProps){
    let formattedItems = []
    for(let i = 0; i < items.length; i+=colNum){
        formattedItems.push(
        <div key = {i} className = "items-table-row">
            {items.splice(0, colNum)}
        </div>
        )
    }
    return formattedItems;
}

interface itemsTableProps {
    headings: string[],
    items: ReactElement[],
}
export default function ItemsTable ({
    headings,
    items
}: itemsTableProps){
    useEffect(() => {
        console.log("ItemsTable -> received items:", items); // Log items when received
    }, [items]); // Trigger when items prop changes
    
    const {isDarkMode} = useTheme();
    const formattedHeader = headings.map(heading => {
        return <span className={`items-table-header${isDarkMode? '-dark' : ''}`}>{heading}</span>
    });
    console.log(items);
    const formattedItems = formatItems({colNum: headings.length, items});
    return (
        <div className={`items-table${isDarkMode? '-dark' : ''}`}>
            {formattedHeader}
            {formattedItems}
        </div>
    );
};



