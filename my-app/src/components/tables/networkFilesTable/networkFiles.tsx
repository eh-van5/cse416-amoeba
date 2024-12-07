import { useTheme } from "../../../ThemeContext";
import FilesTable from "../filesTable";
import NetworkBuyButton from "./networkBuyButton";
import { networkFileStructure } from "../../pages/networkFiles";
import { formatBytes, translateDate } from "../../general/formatHelpers";
import SearchBar from "./findFile";

interface FileTableProps {
    items:networkFileStructure
    headings: string[]
}

export default function NetworkFilesTable ({items, headings} : FileTableProps) {
    // console.log(items)
    const {isDarkMode} = useTheme();

    // pull actual items from backend
    items
    const formattedItems: JSX.Element[] = items.map((item) => {
        // const status = item.shared ? "sharing" : "not sharing"
        return (
        <div key = {item.host.name} className = "items-table-row">

            <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                <NetworkBuyButton item = {item} />
            </span>
            <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                {item.file.name}
            </span>
            <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                {formatBytes(item.file.size)}
            </span>
        </div>
        )
    })

    return (
        <div id = "filesTable" className={`items-table${isDarkMode? '-dark' : ''}`}>
            <SearchBar/>
            <FilesTable headings={headings} items={formattedItems} />
        </div>
    )
}

