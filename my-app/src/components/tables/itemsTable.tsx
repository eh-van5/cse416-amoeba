import { useTheme } from "../../ThemeContext";

interface formatItemsProps{
    colNum: number,
    items: JSX.Element[]
}
function formatItems({colNum, items}: formatItemsProps){
    let formattedItems = []
    for(let i = 0; i < items.length; i+=colNum){
        formattedItems.push(
        <div className = "items-table-row">
            {items.splice(0, colNum)}
        </div>
        )
    }
    return formattedItems;
}

interface itemsTableProps {
    headings: string[],
    items: JSX.Element[],
}
export default function ItemsTable ({
    headings,
    items
}: itemsTableProps){
    const {isDarkMode} = useTheme();
    const formattedHeader = headings.map(heading => {
        return <span className={`items-table-header${isDarkMode? '-dark' : ''}`}>{heading}</span>
    });
    const formattedItems = formatItems({colNum: headings.length, items});
    return (
        <div className={`items-table${isDarkMode? '-dark' : ''}`}>
            {formattedHeader}
            {formattedItems}
        </div>
    );
};



