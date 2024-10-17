import React, {useState} from 'react';
import SimpleBox from "../general/simpleBox";
import { BackIcon, ViewAllIcon } from '../../images/icons/icons';
import ItemsTable from '../tables/itemsTable';

export default function ProxyPage(){

    const items = [];
    for (let i = 0; i < 4*60; i++){
        items.push(<span className="items-table-item">test</span>);
    }

    const headings = ["File", "Hash", "Status", "Amount"];

    return(
        <div className="page-content">
            <h1>Proxy</h1>
        </div>
    )
}