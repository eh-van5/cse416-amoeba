import { useTheme } from "../../ThemeContext";
import FilesTable from "./filesTable";
import { UserFileData } from "../pages/userFiles";

interface FileTableProps {
    items: UserFileData[],
}

export default function UserFilesTable ({items} : FileTableProps) {
    // pull items from backend
    // console.log(items)
    const {isDarkMode} = useTheme();

    const formattedItems: JSX.Element[] = items.map((item) => {
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

    const headings = [ "Status", "Name", "Price", "Last Modified", "Size"];

    return (
        <div id = "filesTable" className={`items-table${isDarkMode? '-dark' : ''}`}>
            <FilesTable headings={headings} items={formattedItems} />
        </div>
    )
}

