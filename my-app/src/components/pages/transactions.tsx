import React, {useState} from 'react';
import BarGraph from '../charts/barGraph';
import PieGraph from '../charts/pieGraph';
import SimpleBox from '../general/simpleBox';
import { BackIcon, DownloadIcon, UploadIcon, ViewAllIcon } from '../../images/icons/icons';
import ItemsTable from '../tables/itemsTable';
import { useAppContext } from '../../AppContext';
import RecentTransactionsTable, { transactionData } from '../tables/recentTransactionsTable/recentTransactionstable';

export default function TransactionsPage(){
    const [isView, setView] = useState(false);
    const toggleView = () => setView(!isView);
    const {isDarkMode} = useAppContext();

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

    const items = [];
    for (let i = 0; i < 4*60; i++){
        items.push(<span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>test</span>);
    }

    // Get some random fake data
    const activityData = generateRandomActivityData();
    const fileTypeData = generateRandomFileTypeData();

    const headings = ["File", "Hash", "Status", "Amount", "Date"];

    const totalUpload = 94;
    const totalDownload = 87;

    return (
        <div className="page-content" style={{padding: '20px'}}>
            <h1 style={{ color:isDarkMode ? 'white' : 'black'}}>Transactions</h1>
            {isView === false && ( <div className="page-row">
                <SimpleBox title="Total Upload">
                    <div style={{position: 'relative'}}>
                        <div style={{textAlign: 'center', marginBottom: '60px', marginTop: '20px'}}>
                            <span style={{color:isDarkMode ? 'white' : 'black', fontSize: '48px', lineHeight: '1', margin: '0'}}>{totalUpload}</span>
                            <span style={{color:isDarkMode ? 'white' : 'black', fontSize: '14px', marginLeft: "5px"}}>Files</span>
                        </div>
                        <div style={{position: 'absolute', bottom: '-60px', right: '10px'}}>
                            <UploadIcon />
                        </div>
                    </div>
                </SimpleBox>
                <SimpleBox title="Total Download">
                    <div style={{position: 'relative'}}>
                        <div style={{textAlign: 'center', marginBottom: '60px', marginTop: '20px'}}>
                            <span style={{color:isDarkMode ? 'white' : 'black', fontSize: '48px', lineHeight: '1', margin: '0'}}>{totalDownload}</span>
                            <span style={{color:isDarkMode ? 'white' : 'black', fontSize: '14px', marginLeft: "5px"}}>Files</span>
                        </div>
                        <div style={{position: 'absolute', bottom: '-60px', right: '10px'}}>
                            <DownloadIcon />
                        </div>
                    </div>
                </SimpleBox>
            </div> )}
            {isView === false && ( <div className="page-row">
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
                <PieGraph
                    data={fileTypeData}
                    title="File Type"
                />
            </div> )}
            <div className="page-row">
                <SimpleBox title="Recent Transactions" style={{ minHeight: isView ? '680px' : '0px' }}>
                    <div style={{position: 'relative', margin: '20px'}}>
                        <div className="box-header-button" onClick={toggleView} style={{position: 'absolute', right: '-20px', top: '-60px', cursor: 'pointer'}}>
                            {isView? <BackIcon /> : <ViewAllIcon />}
                        </div>
                        <RecentTransactionsTable headings={headings} items={isView? transactionData : transactionData.slice(0, 3)}/>
                    </div>
                </SimpleBox>
            </div>
        </div>
    );
}