import UploadFileWidget from "../general/uploadFileWidget";
import FileTable from "../tables/filesTable";

export default function FilesPage(){
    return(
        <div className="page-content">
            <UploadFileWidget />
            <FileTable />
        </div>
    )
}