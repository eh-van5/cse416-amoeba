import React, {useState} from 'react';
import LineGraph from "../charts/lineGraph";
import BarGraph from '../charts/barGraph';
import PieGraph from '../charts/pieGraph';

export default function TransactionsPage(){
    const generateRandomBanwidthData = () => {
        const data = [];
        for(let i = 0; i < 12; i++) {
            let t = `09:${i+10}`;
            let value1 = Math.floor(Math.random() * 30) + 20;
            let value2 = Math.floor(Math.random() * 30) + 15;
            data.push({name: t, value1, value2});
        }
        return data;
    }
    const generateRandomActivityData = () => {
        const data = [];
        let today = new Date();
        for(let i = 6; i >= 0; i--) {
            let date = new Date(today);
            date.setDate(today.getDate() - i);
            let formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
            let down = Math.floor(Math.random() * 40) + 10;
            let up = Math.floor(Math.random() * 40) + 10;
            data.push({
                name: formattedDate,
                value1: down,
                value2: up
            })
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

    // Get some random fake data
    const banwidthData = generateRandomBanwidthData();
    const activityData = generateRandomActivityData();
    const fileTypeData = generateRandomFileTypeData();

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
                    //maxWidth={1220}
                    //height={200}
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
            <div className="graph-row">
                <PieGraph
                    data={fileTypeData}
                    title="File Type"
                />
            </div>
        </div>
    );
}