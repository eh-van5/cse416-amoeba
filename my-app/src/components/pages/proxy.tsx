import React, {useState} from 'react';
import SimpleBox from "../general/simpleBox";
import { BackIcon, ViewAllIcon } from '../../images/icons/icons';
import ItemsTable from '../tables/itemsTable';
import ToggleSwitch from '../general/toggle';
import LineGraph from '../charts/lineGraph';
import { useAppContext } from '../../AppContext';
import ProxyNodesTable from '../tables/proxyNodesTable/proxyNodesTable';
import { proxyNodes, proxyNodeStructure } from '../tables/proxyNodesTable/proxyNodes';
import ClientUsageTable, { clientUsageData } from '../tables/clientUsageTable/clientUsageTable';

export default function ProxyPage(){
    const {isDarkMode} = useAppContext();
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
    for (let i = 0; i < 4*60; i++){
        items.push(<span className={`items-table-item${isDarkMode ? '-dark' : ''}`}> </span>);
    }

    const headings1 = ["Client IP", "Data", "Charge", "Date"];
    const headings2 = ["IP Address", "Price per MB", "Location", "Status", "      "];
    const [isViewHistory, setViewHistory] = useState(false);
    const [isViewAvailable, setViewAvailable] = useState(false);
    const [isProxyEnabled, setIsProxyEnabled] = useState(false);
    const [isUsingProxy, setIsUsingProxy] = useState(false);
    const [pricePerMB, setPricePerMB] = useState('');
    const [enableError, setEnableError] = useState('');
    const [useError, setUseError] = useState('');
    const [selectedProxyNode, setSelectedProxyNode] = useState({
        ipAddress: '',
        location: '',
        pricePerMB: 0
    });

    const toggleViewHistory = () => setViewHistory(!isViewHistory);
    const toggleViewAvailable = () => setViewAvailable(!isViewAvailable);
    const banwidthData = generateRandomBanwidthData();

    const DataTransferred = 0;
    const DataUsed = 0;

    const handleEnableProxy = () => {
        const price = parseFloat(pricePerMB);
        const validNumberPattern = /^[0-9]*\.?[0-9]+$/;
        if(!pricePerMB || !validNumberPattern.test(pricePerMB) || price < 0) {
            setEnableError('Please enter a valid positive number or 0.');
        }else {
            setEnableError('');
            setIsProxyEnabled(!isProxyEnabled);
        }
    };

    const handleUseProxy = () => {
        if (!selectedProxyNode.ipAddress) {
            setUseError('Please select a proxy node before using.');
        } else {
            setUseError('');
            setIsUsingProxy(!isUsingProxy);
        }
    };

    const handleSelectProxyNode = (node: proxyNodeStructure) => {
        if(isViewAvailable)
            toggleViewAvailable();
        setSelectedProxyNode({
            ipAddress: node.ipAddress,
            location: node.location,
            pricePerMB: node.pricePerMB
        });
    };

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
                        <input type="text" value={pricePerMB} onChange={(e) => setPricePerMB(e.target.value)} disabled={isProxyEnabled} />
                        <label style={{ color:isDarkMode ? 'white' : 'black', marginLeft: '10px', marginRight: '20px', fontSize: '14px'}}>AMB</label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                        <label style={{ color:isDarkMode ? 'white' : 'black', marginLeft: '20px', marginRight: '5px', fontSize: '14px' }}>Data Transferred:</label>
                        <span style={{color:isDarkMode ? 'white' : 'black'}}>{DataTransferred} MB</span>
                    </div>
                    <div style={{ minHeight: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '5px' }}>
                        <span style={{ fontSize: '12px', color: 'red' }}>{enableError}</span> 
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '5px' }}>
                        <ToggleSwitch name="toggle-proxy-node" offText="Off" onText="On" checked={isProxyEnabled} onClick={handleEnableProxy} />
                    </div>
                </SimpleBox>
                <SimpleBox title='Use Proxy Node'>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }} className="no-wrap">
                        <label style={{ color:isDarkMode ? 'white' : 'black', marginLeft: '20px', marginRight: '5px', fontSize: '14px' }}>Selected Proxy Node:</label>
                        <span style={{ color:isDarkMode ? 'white' : 'black', marginRight: '20px' }}>{selectedProxyNode.ipAddress} - {selectedProxyNode.location}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                        <label style={{ color:isDarkMode ? 'white' : 'black', marginLeft: '20px', marginRight: '5px', fontSize: '14px' }}>Price per MB:</label>
                        <span style={{color:isDarkMode ? 'white' : 'black'}}>{selectedProxyNode.pricePerMB || " - "} AMB</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <label style={{ color:isDarkMode ? 'white' : 'black', marginLeft: '20px', marginRight: '5px', fontSize: '14px' }}>Data Used:</label>
                        <span style={{color:isDarkMode ? 'white' : 'black'}}>{DataUsed} MB</span>
                    </div>
                    <div style={{ minHeight: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '5px' }}>
                        <span style={{ fontSize: '12px', color: 'red' }}>{useError}</span> 
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '5px' }}>
                        <ToggleSwitch name="toggle-use-proxy-node" offText="Off" onText="On" checked={isUsingProxy} onClick={handleUseProxy} />
                    </div>
                </SimpleBox>
            </div> )}
            {isViewAvailable === false && ( <div className="page-row">
                <SimpleBox title="Client Usage History" style={{ minHeight: isViewHistory ? '680px' : '0px' }}>
                    <div style={{position: 'relative', margin: '20px'}}>
                        <div className="box-header-button" onClick={toggleViewHistory} style={{position: 'absolute', right: '-20px', top: '-60px', cursor: 'pointer'}}>
                            {isViewHistory? <BackIcon /> : <ViewAllIcon />}
                        </div>
                        <ClientUsageTable headings={headings1} items={isViewHistory? clientUsageData : clientUsageData.slice(0, 3)}/>
                    </div>
                </SimpleBox>
                {isViewHistory === false && ( <LineGraph
                    data={banwidthData}
                    line1Color="#17BD28"
                    line2Color="#FF6D6D"
                    xAxisLabel="Time"
                    yAxisLabel="MB/s"
                    line1Name = "Download"
                    line2Name = "Upload"
                    title="Bandwidth Over Time"
                /> )}
            </div> )}
            {isViewHistory === false && ( <div className="page-row">
            <SimpleBox title="Available Proxy Nodes" style={{ minHeight: isViewAvailable ? '680px' : '0px' }}>
                    <div style={{position: 'relative', margin: '20px'}}>
                        <div className="box-header-button" onClick={toggleViewAvailable} style={{position: 'absolute', right: '-20px', top: '-60px', cursor: 'pointer'}}>
                            {isViewAvailable? <BackIcon /> : <ViewAllIcon />}
                        </div>
                        <ProxyNodesTable items={isViewAvailable ? proxyNodes : proxyNodes.slice(0, 3)} headings={headings2} onSelect={handleSelectProxyNode} />
                    </div>
                </SimpleBox>
            </div> )}
        </div>
    )
}