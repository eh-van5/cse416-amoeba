import { ReactElement, useState } from "react";
import NetworkWidget from "../general/networkWidget/networkWidget";
import UploadFileWidget from "../general/uploadFileWidget";
import FileTable from "../tables/filesTable";

export default function FilesPage(){
    const headings = ["Name", "Shared By", "Last Opened", "Status", "Size"];
    const [items, setItems] = useState<ReactElement[]>([]);
    return(
        <div className="page-content">
            <div id = "top-file-widgets">
                <UploadFileWidget setItems = {setItems} />
                <NetworkWidget />
            </div>
            <FileTable items={items} headings={headings}/>
        </div>
    )
}