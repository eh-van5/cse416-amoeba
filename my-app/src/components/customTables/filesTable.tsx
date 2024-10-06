import ItemsTable from "../itemsTable"

export default function FileTable () {
    // pull items from backend
    let items = [];
    for (let i = 0; i < 4*60; i++){
        items.push(<div className="items-table-items">test</div>);
    }
    const headings = ["Name", "Shared By", "Last Opened", "Size"];
    return (
        <ItemsTable headings={headings} items={items}/>
    )
}