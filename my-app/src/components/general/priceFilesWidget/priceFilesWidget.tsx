import { ReactElement } from "react";
import { useTheme } from "../../../ThemeContext";
import { UserFileData } from "../../pages/userFiles";
import FilesTable from "../../tables/filesTable";
import { stringify } from "querystring";

interface priceFilesProps {
    sharedFiles: UserFileData[];
    uploadedFiles: Map<string, UserFileData>;
    setSharedFiles: React.Dispatch<React.SetStateAction<UserFileData[]>>;
    setUploadedFiles: React.Dispatch<React.SetStateAction<Map<string, UserFileData>>>;
}

interface formatPriceTableProps {
    files: UserFileData[];
}

function FormatPriceTable({files}: formatPriceTableProps): JSX.Element[] {
    const {isDarkMode} = useTheme();
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

    const response = await fetch('http://localhost:8000/uploadFile', {
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
export default function PriceFilesWidget({sharedFiles, uploadedFiles, setSharedFiles, setUploadedFiles}: priceFilesProps) {
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