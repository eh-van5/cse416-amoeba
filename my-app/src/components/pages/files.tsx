import NetworkWidget from "../general/networkWidget/networkWidget";
import UploadFileWidget from "../general/uploadFileWidget";
import FileTable from "../tables/filesTable";

export default function FilesPage(){
    return(
        <div className="page-content">
            <div>
                <UploadFileWidget />
                <NetworkWidget />
            </div>
            <FileTable />
        </div>
    )
}