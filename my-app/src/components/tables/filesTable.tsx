import ItemsTable from "./itemsTable"

interface FileTableProps {
    items: React.ReactElement[],
    headings: string[]
}
export default function FileTable ({items, headings} : FileTableProps) {
    // pull items from backend
    console.log(items)
    return (
        <div id="filesTable">
            <ItemsTable headings={headings} items={items}/>
        </div>
    )
}