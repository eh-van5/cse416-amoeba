import { networkFileStructure } from "../../pages/networkFiles";

interface buyFormProps {
    item: networkFileStructure;
}

function cancel(e: React.MouseEvent){
    const purchaseForm = document.getElementById("purchase-form") as HTMLDialogElement;
    purchaseForm.close();
}

export default function BuyForm({item}: buyFormProps) {
    const owners = item.prices.keys()
    const options = Array.from(owners).map((owner: string) => {
        return (
            <div id="provider-options">
                <input required name = "provider" type = "radio"></input>
                <label className = "buyFormPrices">${item.prices.get(owner)} </label>
                <label className = "buyFormOwners">{owner}</label>
            </div>
        )
    })
    return (
        <dialog id="purchase-form">
            <form method="dialog">
                <p>
                <label>Provider: </label>
                {options}
                </p>
                <div>
                <button onClick={cancel} id="cancel" type="reset">Cancel</button>
                <button type="submit">Confirm</button>
                </div>
            </form>
        </dialog>
    )
}