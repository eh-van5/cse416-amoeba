import { ReactElement } from "react";
import { useAppContext } from "../../../AppContext";
import { FileData, UserFileData } from "../../pages/userFiles";
import FilesTable from "../../tables/filesTable";


interface priceFilesProps {
    uploadedFiles: Map<string, FileData>;
    setUploadedFiles: React.Dispatch<React.SetStateAction<Map<string, FileData>>>;
}

interface formatPriceTableProps {
    files: FileData[];
}

function FormatPriceTable({files}: formatPriceTableProps): JSX.Element[] {
    const {isDarkMode} = useAppContext();
    const filesAndPrice = files.map((file) => {
        return (
            <div key = {file.file.name} className = "items-table-row">
                <label htmlFor = {file.file.name} className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                    {file.file.name}
                </label>
                <label htmlFor = {file.file.name} className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                    {file.file.size}
                </label>
                <input required id = {file.file.name + "-price"} name = {file.file.name} type="number" className={`items-table-item${isDarkMode ? '-dark' : ''}`} />
            </div>
        );
    });
    return filesAndPrice;
}

async function uploadFileHelper(file: File, price: string){
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', file.name)
    formData.append('filesize', file.size.toString())
    formData.append('filetype', file.type)
    formData.append('price', price)
    formData.append('lastmodified', file.lastModified.toString());

    const PORT = 8088;
    const response = await fetch(`http://localhost:${PORT}/uploadFile`, {
        method:'POST',
        body: formData,
    })

    if (response.ok) {
        // Handle success
        console.log("uploaded files");
    }  else {
        // Handle error
        console.log(JSON.stringify(response));
        console.error('Error uploading files');
    }
}
export default function PriceFilesWidget({uploadedFiles, setUploadedFiles}: priceFilesProps) {
    const headings = ["File Name", "Size", "Set Price"]
    const items : ReactElement[] = FormatPriceTable({files: Array.from(uploadedFiles.values())});
    async function uploadFiles(e : React.FormEvent<HTMLFormElement>){
        e.preventDefault();
        
        const files = Array.from(uploadedFiles.keys())
        
        for(var i = 0; i < files.length; i++){
            const fileName = files[i];
            const price = fileName+"-price";
            const input = document.getElementById(price) as HTMLInputElement;
            if (input !== null){
                const file = uploadedFiles.get(fileName)?.file;
                if (file === undefined){
                    throw Error();
                }
                await uploadFileHelper(file, input.value);
            }
        }
        // setSharedFiles([...sharedFiles, ...Array.from(uploadedFiles.values())]);
        setUploadedFiles(new Map());
    }
    return(
        <form id = "price-files-widget" onSubmit = {uploadFiles} >
            <FilesTable items={items} headings={headings} />
            <input type = "submit" value = "Share Files"/>
        </form>
    )
}