import { useTheme } from "../../ThemeContext";
import PriceItemsTable from "../general/priceFilesWidget/priceFilesTable";
import { UserFileData } from "../pages/userFiles";
import ItemsTable from "./itemsTable"

interface FileTableProps {
    items: UserFileData[],
    headings: string[]
}

export default function FileTable ({items, headings} : FileTableProps) {
    // pull items from backend
    // console.log(items)
    const {isDarkMode} = useTheme();

    const formattedItems: JSX.Element[] = [];
    items.map((item) => {
        return (
        <div key = {item.file.name} className = "items-table-row">
            <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                {item.shared}
            </span>
            <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                {item.file.name}
            </span>
            <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                {item.price}
            </span>
                    <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                {item.file.lastModified}
            </span>
            <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                {item.file.size}
            </span>
        </div>
        )
    })
    // pull items from backend
    
    // for (let i = 0; i < 4*60; i++){
    //     items.push(<span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>test</span>);
    // }

    console.log(items);
    return (
        <div id="filesTable">
            <PriceItemsTable headings={headings} items={formattedItems}/>
        </div>
    )
}