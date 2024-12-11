import { PauseIcon, PlayIcon } from "../../../images/icons/icons";
import { useAppContext } from "../../../AppContext";
import { FileInfo } from "../../types";

interface statusButtonProps {
    item: FileInfo;
    items: FileInfo[];
    setItems: React.Dispatch<React.SetStateAction<FileInfo[]>>;
}

export default function StatusButton({item, items, setItems}: statusButtonProps) { 
    const {isDarkMode} = useAppContext();
    // just hoping duplicate handling is done on the backend
    async function stopSharing(e : React.MouseEvent<HTMLButtonElement>) {
        const formData = new FormData();
        formData.append('hash', item.Hash);
        const PORT = 8088;
        const response = await fetch(`http://localhost:${PORT}/stopProvide`, {
            method:'DELETE',
            body: formData,
        })

        if (response.ok) {
            // Handle success
            console.log("uploaded files");
        }  else {
            // Handle error
            console.error("Error:", response);
            alert('Error deleting files');
        }
        
        return;
    }

    return (
        <button 
            onClick={stopSharing} 
            className={`share-button ${isDarkMode ? '-dark' : ''}`}>
            Stop Share
            <br></br>
        </button>
    )
}