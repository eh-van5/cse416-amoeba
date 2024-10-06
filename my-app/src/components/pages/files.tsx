import FileUploadWidget from "../general/dragndrop";
import FileTable from "../tables/filesTable";

export default function FilesPage(){
    return(
        <div className="page-content">
            <FileUploadWidget />
            <FileTable />
        </div>
    )
}