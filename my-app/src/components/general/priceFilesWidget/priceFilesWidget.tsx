import { ReactElement } from "react";
import { useTheme } from "../../../ThemeContext";
import PriceItemsTable from "./priceFilesTable";
import { UserFileData } from "../../pages/userFiles";

interface priceFilesProps {
    files: Map<string, UserFileData>;
}

interface formatPriceTableProps {
    files: string[];
}

function FormatPriceTable({files}: formatPriceTableProps): JSX.Element[] {
    const {isDarkMode} = useTheme();
    function onPriceChange(e: React.ChangeEvent){
        e.preventDefault();
        console.log(e);
    }
    const filesAndPrice = files.map((fileName) => {
        return (
            <div key = {fileName} className = "items-table-row">
                <label htmlFor = {fileName} className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                    {fileName}
                </label>
                <input required onChange = {onPriceChange} name = {fileName} type="number" className={`items-table-item${isDarkMode ? '-dark' : ''}`} />
            </div>
        );
    });
    return filesAndPrice;
}

export default function PriceFilesWidget({files}: priceFilesProps) {
    const headings = ["File Name", "Price"]
    const items : ReactElement[] = FormatPriceTable({files: Array.from(files.keys())});
    function uploadFiles(e : React.MouseEvent){
        e.preventDefault();

    }
    return(
        <form id = "price-files-widget">
            <input onClick = {uploadFiles} formMethod = "dialog" type = "submit" value = "Upload"/>
            <PriceItemsTable items={items} headings={headings} />
        </form>
    )
}