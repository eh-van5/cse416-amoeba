import React, {useState} from 'react';
import SimpleBox from "../general/simpleBox";
import { BackIcon, ViewAllIcon } from '../../images/icons/icons';
import ItemsTable from '../tables/itemsTable';
import ToggleSwitch from '../general/toggle';
import LineGraph from '../charts/lineGraph';
import { useTheme } from '../../ThemeContext';

export default function ProxyPage(){
    const {isDarkMode} = useTheme();
    const generateRandomBanwidthData = () => {
        const data = [];
        for(let i = 0; i < 12; i++) {
            let t = `09:${i+10}`;
            let value1 = i+5;
            let value2 = i;
            data.push({name: t, value1, value2});
        }
        return data;
    }

    const items = [];
    for (let i = 0; i < 5*60; i++){
        items.push(<span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>test</span>);
    }

    const headings1 = ["Client IP", "Data Transferred", "Charge"];
    const headings2 = ["IP Address", "Price per MB", "Location", "Status", "Select Buttom"];
    const [isViewHistory, setViewHistory] = useState(false);
    const [isViewAvailable, setViewAvailable] = useState(false);
    const [isProxyEnabled, setIsProxyEnabled] = useState(false);
    const [isUsingProxy, setIsUsingProxy] = useState(false);
    const toggleViewHistory = () => setViewHistory(!isViewHistory);
    const toggleViewAvailable = () => setViewAvailable(!isViewAvailable);
    const banwidthData = generateRandomBanwidthData();

    const selectedIPAddress = "192.168.0.1";
    const location = "United States";
    const DataTransferred = 0;
    const DataUsed = 0;

    /*  Enable proxy node
        Use proxy node
        Proxy node statistics
        Client usage history
        Available proxy nodes
    */
    return(
        <div className="page-content">
            <h1 style={{ color:isDarkMode ? 'white' : 'black'}}>Proxy</h1>
            {isViewHistory === false && isViewAvailable === false && ( <div className="page-row">
                <SimpleBox title='Enable My IP as a Proxy'>
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: "16px", marginBottom: '10px' }} className="no-wrap">
                        <label style={{ color:isDarkMode ? 'white' : 'black', marginLeft: '20px', marginRight: '5px', fontSize: '14px' }}>Price per MB: </label>
                        <input type="text" disabled={isProxyEnabled} />
                        <label style={{ color:isDarkMode ? 'white' : 'black', marginLeft: '10px', marginRight: '20px', fontSize: '14px'}}>AMB</label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                        <label style={{ color:isDarkMode ? 'white' : 'black', marginLeft: '20px', marginRight: '5px', fontSize: '14px' }}>Data Transferred:</label>
                        <span style={{color:isDarkMode ? 'white' : 'black'}}>{DataTransferred} MB</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '5px' }}>
                        <ToggleSwitch name="toggle-proxy-node" offText="Off" onText="On" checked={isProxyEnabled} onClick={() => setIsProxyEnabled(!isProxyEnabled)} />
                    </div>
                </SimpleBox>
                <SimpleBox title='Use Proxy Node'>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }} className="no-wrap">
                        <label style={{ color:isDarkMode ? 'white' : 'black', marginLeft: '20px', marginRight: '5px', fontSize: '14px' }}>Selected Proxy Node:</label>
                        <span style={{ color:isDarkMode ? 'white' : 'black', marginRight: '20px' }}>{selectedIPAddress}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                        <label style={{ color:isDarkMode ? 'white' : 'black', marginLeft: '20px', marginRight: '5px', fontSize: '14px' }}>Location:</label>
                        <span style={{color:isDarkMode ? 'white' : 'black'}}>{location}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                        <label style={{ color:isDarkMode ? 'white' : 'black', marginLeft: '20px', marginRight: '5px', fontSize: '14px' }}>Data Used:</label>
                        <span style={{color:isDarkMode ? 'white' : 'black'}}>{DataUsed} MB</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '5px' }}>
                        <ToggleSwitch name="toggle-use-proxy-node" offText="Off" onText="On" checked={isUsingProxy} onClick={() => setIsUsingProxy(!isUsingProxy)} />
                    </div>
                </SimpleBox>
            </div> )}
            {isViewAvailable === false && ( <div className="page-row">
                <SimpleBox title="Client Usage History">
                    <div style={{position: 'relative', margin: '20px'}}>
                        <div className="box-header-button" onClick={toggleViewHistory} style={{position: 'absolute', right: '-20px', top: '-60px', cursor: 'pointer'}}>
                            {isViewHistory? <BackIcon /> : <ViewAllIcon />}
                        </div>
                        <ItemsTable headings={headings1} items={isViewHistory? items.slice(0, 180) : items.slice(0, 36)}/>
                    </div>
                </SimpleBox>
                {isViewHistory === false && ( <LineGraph
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
                /> )}
            </div> )}
            {isViewHistory === false && ( <div className="page-row">
            <SimpleBox title="Available Proxy Nodes">
                    <div style={{position: 'relative', margin: '20px'}}>
                        <div className="box-header-button" onClick={toggleViewAvailable} style={{position: 'absolute', right: '-20px', top: '-60px', cursor: 'pointer'}}>
                            {isViewAvailable? <BackIcon /> : <ViewAllIcon />}
                        </div>
                        <ItemsTable headings={headings2} items={isViewAvailable? items : items.slice(0, 60)}/>
                    </div>
                </SimpleBox>
            </div> )}
        </div>
    )
}