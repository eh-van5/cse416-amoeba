import { useAppContext } from "../../../AppContext";
import { proxyNodeStructure } from "./proxyNodes"

interface selectButtonProps {
    item: proxyNodeStructure;
    onSelect: (selectedNode: proxyNodeStructure) => void; // A callback function to handle selection
}

export default function ProxySelectButton({ item, onSelect }: selectButtonProps) {
    const { isDarkMode } = useAppContext();
    const handleSelect = () => {
        onSelect(item); // Trigger the selection logic when the button is clicked
    };

    return (
        <button onClick={handleSelect} className={`select-button${isDarkMode ? '-dark' : ''}`}>Select</button>
    );
}