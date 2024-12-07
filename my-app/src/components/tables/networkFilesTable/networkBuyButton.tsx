import { useTheme } from "../../../ThemeContext";
import { networkFileStructure } from "../../pages/networkFiles";
import BuyForm from "./buyForm";

interface buyButtonProps {
    item: networkFileStructure;
}

function Buy(){
    //pull from backend list of providers
    const purchaseForm : HTMLDialogElement = document.getElementById("purchase-form") as HTMLDialogElement;
    if (purchaseForm !== null) {
        purchaseForm.showModal();
    }
}

export default function NetworkBuyButton({item}: buyButtonProps) { 
    const {isDarkMode} = useTheme();
    // just hoping duplicate handling is done on the backend
    return (
        <>
        <button onClick={Buy} className={`buy-button ${isDarkMode ? '-dark' : ''}`}>
            Buy
        </button>
        </>
    )
}