import { ReactElement, useState } from "react";
import { useTheme } from "../../ThemeContext";
import NetworkWidget from "../general/networkWidget/networkWidget";
import UploadFileWidget from "../general/uploadFileWidget";
import FileTable from "../tables/filesTable";

export default function NetworkFilesPage(){
    const headings = ["Name", "Shared By", "Last Opened", "Status", "Size"];
    const [items, setItems] = useState<ReactElement[]>([]);
    const {isDarkMode} = useTheme();

    return(
        <div className="page-content">
            <h1 style={{ color:isDarkMode ? 'white' : 'black'}}>Files</h1>
            <div id = "top-widgets">
                <NetworkWidget />
            </div>
            <FileTable items={items} headings={headings}/>
        </div>
    )
}