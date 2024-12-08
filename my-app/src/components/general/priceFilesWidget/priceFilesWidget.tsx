<<<<<<< HEAD
import { ReactElement } from "react";
import { useTheme } from "../../../ThemeContext";
import { UserFileData } from "../../pages/userFiles";
import FilesTable from "../../tables/filesTable";

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

export default function PriceFilesWidget({sharedFiles, uploadedFiles, setSharedFiles, setUploadedFiles}: priceFilesProps) {
    const headings = ["File Name", "Size", "Set Price"]
    const items : ReactElement[] = FormatPriceTable({files: Array.from(uploadedFiles.values())});
    function uploadFiles(e : React.FormEvent<HTMLFormElement>){
        e.preventDefault();
        Array.from(uploadedFiles.keys()).forEach((fileName) => {
            const price = fileName+"-price";
            const input = document.getElementById(price) as HTMLInputElement;
            if (input !== null){
                const file = uploadedFiles.get(fileName)?.file;
                if (file === undefined){
                    throw Error();
                }
                uploadedFiles.set(fileName, {file: file, price: parseFloat(input.value), shared: true});
            }
        })
        setSharedFiles([...sharedFiles, ...Array.from(uploadedFiles.values())]);
        setUploadedFiles(new Map());
    }
    return(
        <form id = "price-files-widget" onSubmit = {uploadFiles} >
            <FilesTable items={items} headings={headings} />
            <input type = "submit" value = "Share Files"/>
        </form>
    )
=======
import { ReactElement } from "react";
import { useAppContext } from "../../../AppContext";
import { UserFileData } from "../../pages/userFiles";
import FilesTable from "../../tables/filesTable";

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

export default function PriceFilesWidget({sharedFiles, uploadedFiles, setSharedFiles, setUploadedFiles}: priceFilesProps) {
    const headings = ["File Name", "Size", "Set Price"]
    const items : ReactElement[] = FormatPriceTable({files: Array.from(uploadedFiles.values())});
    function uploadFiles(e : React.FormEvent<HTMLFormElement>){
        e.preventDefault();
        Array.from(uploadedFiles.keys()).forEach((fileName) => {
            const price = fileName+"-price";
            const input = document.getElementById(price) as HTMLInputElement;
            if (input !== null){
                const file = uploadedFiles.get(fileName)?.file;
                if (file === undefined){
                    throw Error();
                }
                uploadedFiles.set(fileName, {file: file, price: parseFloat(input.value), shared: true});
            }
        })
        setSharedFiles([...sharedFiles, ...Array.from(uploadedFiles.values())]);
        setUploadedFiles(new Map());
    }
    return(
        <form id = "price-files-widget" onSubmit = {uploadFiles} >
            <FilesTable items={items} headings={headings} />
            <input type = "submit" value = "Share Files"/>
        </form>
    )
>>>>>>> main
}