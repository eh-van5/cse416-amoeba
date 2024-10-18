import { ReactElement } from "react";
import { useTheme } from "../../../ThemeContext";
import PriceItemsTable from "./priceFilesTable";
import { UserFileData } from "../../pages/userFiles";

interface priceFilesProps {
    files: Map<string, UserFileData>;
    setFiles: React.Dispatch<React.SetStateAction<UserFileData[]>>
}

interface formatPriceTableProps {
    files: string[];
}

function FormatPriceTable({files}: formatPriceTableProps): JSX.Element[] {
    const {isDarkMode} = useTheme();
    const filesAndPrice = files.map((fileName) => {
        return (
            <div key = {fileName} className = "items-table-row">
                <label htmlFor = {fileName} className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                    {fileName}
                </label>
                <input required id = {fileName + "-price"} name = {fileName} type="number" className={`items-table-item${isDarkMode ? '-dark' : ''}`} />
            </div>
        );
    });
    return filesAndPrice;
}

export default function PriceFilesWidget({files, setFiles}: priceFilesProps) {
    const headings = ["File Name", "Price"]
    const items : ReactElement[] = FormatPriceTable({files: Array.from(files.keys())});
    function uploadFiles(e : React.FormEvent<HTMLFormElement>){
        e.preventDefault();
        Array.from(files.keys()).forEach((fileName) => {
            const price = fileName+"-price";
            const input = document.getElementById(price) as HTMLInputElement;
            if (input !== null){
                const file = files.get(fileName)?.file;
                if (file === undefined){
                    throw Error();
                }
                files.set(fileName, {file: file, price: parseFloat(input.value), shared: false});
            }
        })
        setFiles(Array.from(files.values()));
    }
    return(
        <form id = "price-files-widget" onSubmit = {uploadFiles} >
            <input type = "submit" value = "Upload"/>
            <PriceItemsTable items={items} headings={headings} />
        </form>
    )
}