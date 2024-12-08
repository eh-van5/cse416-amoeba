import { PauseIcon, PlayIcon } from "../../../images/icons/icons";
import { useAppContext } from "../../../AppContext";
import { UserFileData } from "../../pages/userFiles";

interface statusButtonProps {
    item: UserFileData;
    items: UserFileData[];
    setItems: React.Dispatch<React.SetStateAction<UserFileData[]>>;
}

function FlipSharing({item, items, setItems}: statusButtonProps){
    let itemIndex = 0;
    items.forEach((i, index) => {
        if (i.file.name === item.file.name) {
            itemIndex = index;
        }
    })
    item.shared = !item.shared;
    items[itemIndex] = item;
    setItems([...items])
}


export default function StatusButton({item, items, setItems}: statusButtonProps) { 
    const {isDarkMode} = useAppContext();
    // just hoping duplicate handling is done on the backend
    return (
        <button 
            onClick={(e) => {FlipSharing({item, items, setItems})}} 
            className={`share-button ${isDarkMode ? '-dark' : ''}`}>
            {item.shared ? <PauseIcon /> : <PlayIcon />}
            <br></br>
            {item.shared ? "Sharing" : "Not Sharing"}
        </button>
    )
}