import React, {useState} from 'react';
import LineGraph from "../charts/lineGraph";
import BarGraph from '../charts/barGraph';
import PieGraph from '../charts/pieGraph';
import SimpleBox from '../general/simpleBox';
import { DownloadIcon, IncomingIcon, OutgoingIcon, UploadIcon } from '../../images/icons/icons';

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
        <div className="page-content" style={{padding: '20px'}}>
            <h1>Transactions</h1>
            <div className="page-row">
                <SimpleBox title="Outgoing Traffic">
                    <div style={{ position: 'relative'}}>
                        <div style={{ textAlign: 'center', marginBottom: '24px'}}>
                            <span style={{fontSize: '48px', lineHeight: '1', margin: '0'}}>15</span>
                            <span style={{fontSize: '14px'}}>MB/s</span>
                        </div>
                        <div style={{position: 'absolute', bottom: '-24px', right: '10px'}}>
                            <OutgoingIcon />
                        </div>
                    </div>
                </SimpleBox>
                <SimpleBox title="Incoming Traffic">
                    <div style={{ position: 'relative'}}>
                        <div style={{ textAlign: 'center', marginBottom: '24px'}}>
                            <span style={{fontSize: '48px', lineHeight: '1', margin: '0'}}>22</span>
                            <span style={{fontSize: '14px'}}>MB/s</span>
                        </div>
                        <div style={{position: 'absolute', bottom: '-24px', right: '10px'}}>
                            <IncomingIcon />
                        </div>
                    </div>
                </SimpleBox>
                <SimpleBox title="Total Upload">
                    <div style={{ position: 'relative'}}>
                        <div style={{ textAlign: 'center', marginBottom: '24px'}}>
                            <span style={{fontSize: '48px', lineHeight: '1', margin: '0'}}>94</span>
                            <span style={{fontSize: '14px'}}>Files</span>
                        </div>
                        <div style={{position: 'absolute', bottom: '-24px', right: '10px'}}>
                            <UploadIcon />
                        </div>
                    </div>
                </SimpleBox>
                <SimpleBox title="Total Download">
                    <div style={{ position: 'relative'}}>
                        <div style={{ textAlign: 'center', marginBottom: '24px'}}>
                            <span style={{fontSize: '48px', lineHeight: '1', margin: '0'}}>87</span>
                            <span style={{fontSize: '14px'}}>Files</span>
                        </div>
                        <div style={{position: 'absolute', bottom: '-24px', right: '10px'}}>
                            <DownloadIcon />
                        </div>
                    </div>
                </SimpleBox>
            </div>
            <div className="page-row">
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
            <div className="page-row">
                <PieGraph
                    data={fileTypeData}
                    title="File Type"
                />
            </div>
        </div>
    );
}