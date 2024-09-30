import React, {useState} from 'react';
import LineGraph from "../charts/lineGraph";
import BarGraph from '../charts/barGraph';

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
    const generateRandomActivityData = () => {
        const data = [];
        const today = new Date();
        for(let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
            const down = Math.floor(Math.random() * 40) + 10;
            const up = Math.floor(Math.random() * 40) + 10;
            data.push({
                name: formattedDate,
                value1: down,
                value2: up
            })
        }
        return data;
    }

    // Get some random fake data
    const banwidthData = generateRandomBanwidthData();
    const activityData = generateRandomActivityData();

    return (
        <div style={{padding: '20px'}}>
            <h1>Transactions</h1>
            <div className="graph-row">
                <LineGraph
                    data={banwidthData}
                    line1Color="#17BD28"     // Default is #1C9D49
                    line2Color="#FF6D6D"     // Default is #9D1C1C
                    xAxisLabel="Time"
                    yAxisLabel="MB/s"
                    line1Name = "Download"
                    line2Name = "Upload"
                    title="Bandwidth Over Time"
                />
                <BarGraph
                    data={activityData}
                    bar1Color="#17BD28"
                    bar2Color="#FF6D6D"
                    xAxisLabel="Date"
                    yAxisLabel="files"
                    title="Activity"
                    bar1Name="Downloads"
                    bar2Name="Uploads"
                />
            </div>
        </div>
    );
}