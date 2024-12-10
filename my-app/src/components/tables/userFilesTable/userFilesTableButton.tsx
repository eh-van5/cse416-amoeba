import { PauseIcon, PlayIcon } from "../../../images/icons/icons";
import { useAppContext } from "../../../AppContext";
import { UserFileData } from "../../pages/userFiles";

interface statusButtonProps {
    item: UserFileData;
    items: UserFileData[];
    setItems: React.Dispatch<React.SetStateAction<UserFileData[]>>;
}

export default function StatusButton({item, items, setItems}: statusButtonProps) { 
    const {isDarkMode} = useAppContext();
    // just hoping duplicate handling is done on the backend
    return (
        <button 
            onClick={(e) => {}} 
            className={`share-button ${isDarkMode ? '-dark' : ''}`}>
            <PauseIcon />
            <br></br>
        </button>
    )
}