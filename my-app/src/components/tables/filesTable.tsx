import { useTheme } from "../../ThemeContext";
import ItemsTable from "./itemsTable"

export default function FileTable () {
    const {isDarkMode} = useTheme();

    // pull items from backend
    let items = [];
    for (let i = 0; i < 4*60; i++){
        items.push(<span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>test</span>);
    }
    const headings = ["Name", "Shared By", "Last Opened", "Size"];
    return (
        <div id="filesTable">
            <ItemsTable headings={headings} items={items}/>
        </div>
    )
}