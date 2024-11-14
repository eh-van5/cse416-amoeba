import { useTheme } from "../../../ThemeContext";
import FilesTable from "../filesTable";
import { UserFileData } from "../../pages/userFiles";
import StatusButton from "./userFilesTableButton";
import { formatBytes, translateDate } from "../../general/formatHelpers";

interface FileTableProps {
    items: UserFileData[]
    setItems: React.Dispatch<React.SetStateAction<UserFileData[]>>;
    headings: string[]
}


export default function UserFilesTable ({items, setItems, headings} : FileTableProps) {
    // console.log(items)
    const {isDarkMode} = useTheme();

    // pull actual items from backend
    const formattedItems: JSX.Element[] = items.map((item) => {
        if (!item.shared) {
            return <></>;
        }
        // const status = item.shared ? "sharing" : "not sharing"
        return (
        <div key = {item.file.name} className = "items-table-row">

            <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                <StatusButton item = {item} items = {items} setItems={setItems} />
            </span>
            <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                {item.file.name}
            </span>
            <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                {item.price}
            </span>
                    <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                {translateDate(item.file.lastModified)}
            </span>
            <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                {formatBytes(item.file.size)}
            </span>
        </div>
        )
    })

    return (
        <div id = "filesTable" className={`items-table${isDarkMode? '-dark' : ''}`}>
            <FilesTable headings={headings} items={formattedItems} />
        </div>
    )
}

