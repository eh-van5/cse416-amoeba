interface itemsTableProps {
    headings: string[],
    items: JSX.Element[],
}

export default function ItemsTable ({
    headings,
    items
}: itemsTableProps){
    const formattedHeader = headings.map(heading => {
        return <div className = "items-table-header">{heading}</div>
    });
    return (
        <div className="items-table">
            {formattedHeader}
            {items}
        </div>
    );
};

