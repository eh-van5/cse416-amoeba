import { useAppContext } from "../../../AppContext";
import { FileInfo } from "../../types";

interface buyButtonProps {
    item: FileInfo;
    setHostToFile: React.Dispatch<React.SetStateAction<{} | Record<string, FileInfo>>>;
}


export default function NetworkBuyButton({item, setHostToFile}: buyButtonProps) { 
    const {isDarkMode} = useAppContext();
    // just hoping duplicate handling is done on the backend
    const PORT = 8088;
    async function buy(){
        try {
            const response = await fetch(`http://localhost:${PORT}/getFile?contentHash=${item.Hash}`, {
              method: 'GET',
            });
      
            if (response.ok) {
              let data = await response.json(); 
              if (!data) data = {}
              setHostToFile(data);
          
              console.log(Array.from(Object.keys(data))); 
              const purchaseForm : HTMLDialogElement = document.getElementById("purchase-form") as HTMLDialogElement;
              if (purchaseForm !== null) {
                  purchaseForm.showModal();
              }
      
            } else {
              alert("Error fetching search results.");
            }
          } catch (error) {
            console.error("Error:", error);
            alert("Error occurred while fetching data.");
          }
    }

    return (
        <>
        <button onClick={buy} className={`buy-button ${isDarkMode ? '-dark' : ''}`}>
            Buy
        </button>
        </>
    )
}