import React, {useState} from 'react';
import LineGraph from "../charts/lineGraph";
import PieGraph from '../charts/pieGraph';
import SimpleBox from "../general/simpleBox";
import { BackIcon, ViewAllIcon } from '../../images/icons/icons';
import ItemsTable from '../tables/itemsTable';

export default function DashboardPage(){
    const coinAmount = 0.367;
    const currencyAmount = 6.90;

    const [isView, setView] = useState(false);
    const toggleView = () => setView(!isView);

    const items = [];
    for (let i = 0; i < 4*60; i++){
        items.push(<span className="items-table-item">test</span>);
    }

    const generateRandomLossGainData = () => {
        const data = [];
        for(let i = 0; i < 12; i++) {
            let t = `09/${i+10}/2024`;
            let value1 = Math.floor(Math.random() * 30) + 20;
            let value2 = Math.floor(Math.random() * 30) + 15;
            data.push({name: t, value1, value2});
        }
        return data;
    }
    const generateRandomFileTypeData = () => [
        {name: '.pdf', value: Math.floor(Math.random() * 20) + 10},
        {name: '.png', value: Math.floor(Math.random() * 20) + 10},
        {name: '.xls', value: Math.floor(Math.random() * 20) + 10},
        {name: '.docx', value: Math.floor(Math.random() * 20) + 10},
        {name: '.exe', value: Math.floor(Math.random() * 20) + 10},
    ];

    const fileTypeData = generateRandomFileTypeData();
    const lossGainData = generateRandomLossGainData();

    const headings = ["File", "Hash", "Status", "Amount"];

    return(
        <div className="page-content">
            <h1>Dashboard</h1>
            {isView === false && ( <div className="page-row">
                <SimpleBox title='Wallet'>
                    <h2 style={{margin:'20px'}}>{coinAmount.toFixed(3)} AMB</h2>
                </SimpleBox>
                <SimpleBox title='USD Amount'>
                    <h2 style={{margin:'20px'}}> $ {currencyAmount.toFixed(2)} USD</h2>
                </SimpleBox>
            </div> )}
            {isView === false && ( <div className="page-row">
                <LineGraph
                    data = {lossGainData}
                    line1Color="#17BD28"     // Default is #1C9D49
                    line2Color="#FF6D6D"     // Default is #9D1C1C
                    xAxisLabel="Time"
                    yAxisLabel="USD"
                    line1Name = "Gain"
                    line2Name = "Loss"
                    title="Gain/Loss over Time"
                />
            </div> )}
            <div className="page-row">
                <SimpleBox title="Recent Transactions">
                    <div style={{position: 'relative', margin: '20px'}}>
                        <div className="box-header-button" onClick={toggleView} style={{position: 'absolute', right: '-20px', top: '-60px', cursor: 'pointer'}}>
                            {isView? <BackIcon /> : <ViewAllIcon />}
                        </div>
                        <ItemsTable headings={headings} items={isView? items : items.slice(0, 48)}/>
                    </div>
                </SimpleBox>
                {isView === false && ( <PieGraph
                    data={fileTypeData}
                    title="File Type"
                /> )}
            </div>
        </div>
    )
}