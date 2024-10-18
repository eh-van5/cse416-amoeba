import { useTheme } from "../../ThemeContext";
import ItemsTable from "./itemsTable"

interface FileTableProps {
    items: React.ReactElement[],
    headings: string[]
}
export default function FileTable ({items, headings} : FileTableProps) {
    // pull items from backend
    console.log(items)
    const {isDarkMode} = useTheme();

    // pull items from backend
    for (let i = 0; i < 4*60; i++){
        items.push(<span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>test</span>);
    }
    return (
        <div id="filesTable">
            <ItemsTable headings={headings} items={items}/>
        </div>
    )
}