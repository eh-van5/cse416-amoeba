import React, {useState} from 'react';
import LineGraph from "../lineGraph";

export default function TransactionsPage(){
    const generateRandomBanwidthData = () => {
        const data = [];
        for(let i = 0; i < 24; i+=2) {
            let time = `${i}:00`;
            let value1 = Math.floor(Math.random() * 30) + 20;
            let value2 = Math.floor(Math.random() * 30) + 15;
            data.push({name: time, value1, value2});
        }
        return data;
    }

    // Get some random fake data
    const banwidthData = generateRandomBanwidthData();

    return (
        <div style={{padding: '20px'}}>
            <h1>Transactions</h1>
            <div className="line-graph-row">
                <LineGraph
                    data={banwidthData}
                    line1Color="#17BD28"
                    line2Color="#FF6D6D"
                    xAxisLabel="Time"
                    yAxisLabel="MB/s"
                    line1Name = "Download"
                    line2Name = "Upload"
                    title="Bandwidth Over Time"
                />
            </div>
        </div>
    );
}