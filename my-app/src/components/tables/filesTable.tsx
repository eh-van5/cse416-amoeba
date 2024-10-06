import ItemsTable from "./itemsTable"

export default function FileTable () {
    // pull items from backend
    let items = [];
    for (let i = 0; i < 4*60; i++){
        items.push(<span className="items-table-item">test</span>);
    }
    const headings = ["Name", "Shared By", "Last Opened", "Size"];
    return (
        <div id="filesTable">
            <ItemsTable headings={headings} items={items}/>
        </div>
    )
}