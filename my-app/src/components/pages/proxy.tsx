import React, {useEffect, useState} from 'react';
import SimpleBox from "../general/simpleBox";
import { BackIcon, ViewAllIcon } from '../../images/icons/icons';
import ToggleSwitch from '../general/toggle';
import LineGraph from '../charts/lineGraph';
import { useTheme } from '../../ThemeContext';
import ProxyNodesTable from '../tables/proxyNodesTable/proxyNodesTable';
import { proxyNodeStructure } from '../tables/proxyNodesTable/proxyNodes';
import ClientUsageTable, { clientUsageData } from '../tables/clientUsageTable/clientUsageTable';
import { startHeartbeat, stopHeartbeat } from '../general/Heartbeat';

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
    for (let i = 0; i < 4*60; i++){
        items.push(<span className={`items-table-item${isDarkMode ? '-dark' : ''}`}> </span>);
    }

    const headings1 = ["Client IP", "Data", "Charge", "Date"];
    const headings2 = ["IP Address", "Price per MB", "Location", "Status", "      "];
    const [isViewHistory, setViewHistory] = useState(false);
    const [isViewAvailable, setViewAvailable] = useState(false);
    const [isProxyEnabled, setIsProxyEnabled] = useState(false);
    const [isUsingProxy, setIsUsingProxy] = useState(false);
    const [pricePerMB, setPricePerMB] = useState(() => {
        const savedPrice = localStorage.getItem("pricePerMB");
        return savedPrice ? savedPrice : "";
    });
    const [enableError, setEnableError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [useError, setUseError] = useState('');
    const [selectedProxyNode, setSelectedProxyNode] = useState({
        ipAddress: '',
        location: '',
        pricePerMB: 0
    });
    const [proxyNodes, setProxyNodes] = useState<proxyNodeStructure[]>([]);

    const toggleViewHistory = () => setViewHistory(!isViewHistory);
    const toggleViewAvailable = () => setViewAvailable(!isViewAvailable);
    const banwidthData = generateRandomBanwidthData();

    const POLLING_INTERVAL = 5000;
    const HEARTBEAT_INTERVAL = 10000;
    useEffect(() => {
        const fecthData = async () => {
            const [proxies, status] = await Promise.all([fetchProxies(), fetchProxyStatus()]);
            setProxyNodes(proxies);
            setIsProxyEnabled(status);
            if(!status)
                setSuccessMessage('');
        };
        fecthData();
        const interval = setInterval(() => {
            fecthData();
        }, POLLING_INTERVAL);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleUnload = () => {
            stopHeartbeat();
        };
    
        window.addEventListener("beforeunload", handleUnload);
    
        return () => {
            window.removeEventListener("beforeunload", handleUnload);
        };
    }, []);

    const DataTransferred = 0;
    const DataUsed = 0;

    const handleEnableProxy = async () => {
        const price = parseFloat(pricePerMB);
        const validNumberPattern = /^[0-9]*\.?[0-9]+$/;
        if(!pricePerMB || !validNumberPattern.test(pricePerMB) || price < 0) {
            setEnableError('Please enter a valid positive number or 0.');
            setSuccessMessage('');
        }else {
            setEnableError('');

            try {
                // Send a request
                const response = await fetch('http://localhost:8080/enable-proxy', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ pricePerMB: price }),
                });
    
                const result = await response.json();
    
                if(response.ok) {
                    setSuccessMessage(result.status);
                    setIsProxyEnabled(true);
                    startHeartbeat();
                }else {
                    setEnableError('Failed to enable proxy.');
                    console.error('Error enabling proxy:', result);
                }
            }catch(error) {
                setEnableError('Network error. Please try again.');
                console.error('Failed to enable proxy:', error);
            }
        }
    };

    const handleDisableProxy = async () => {
        try {
            const response = await fetch('http://localhost:8080/disable-proxy', {
                method: 'POST'
            });
            const result = await response.json();
            if(response.ok) {
                setIsProxyEnabled(false);
                setSuccessMessage('');
                stopHeartbeat();
            }else {
                console.error(result)
            }
        }catch(error) {
            console.error('Failed to disable proxy: ', error);
        }
    };

    const fetchProxies = async (): Promise<proxyNodeStructure[]> => {
        try {
            const response = await fetch('http://localhost:8080/get-proxies');
            const proxies = await response.json();

            const proxiesWithLocation = await Promise.all(
                proxies.map(async (proxy: proxyNodeStructure) => {
                    const location = await fetchLocation(proxy.ipAddress);
                    return {...proxy, location};
                })
            );

            return proxiesWithLocation
        }catch(error) {
            console.error('Failed to fetch proxies:', error);
            return [];
        }
    };

    const fetchProxyStatus = async () => {
        try {
            const response = await fetch("http://localhost:8080/proxy-status");
            const status = await response.json();
            return status.isProxyEnabled;
        }catch(error) {
            console.error("Failed to fetch proxy status:", error);
            return false
        }
    }

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPricePerMB(value);
        localStorage.setItem("pricePerMB", value);
    };

    const fetchLocation = async (ipAddress: string): Promise<string> => {
        try {
            const response = await fetch(`http://ip-api.com/json/${ipAddress}`);
            const data = await response.json();
    
            if(data.status === "success") {
                return `${data.city}, ${data.country}`;
            }else {
                console.warn(`Failed to fetch location for IP: ${ipAddress}`);
                return "Unknown";
            }
        }catch (error) {
            console.error(`Failed to fetch location for IP: ${ipAddress}`, error);
            return "Unknown";
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
                        <input type="text" value={pricePerMB} onChange={handlePriceChange} disabled={isProxyEnabled} />
                        <label style={{ color:isDarkMode ? 'white' : 'black', marginLeft: '10px', marginRight: '20px', fontSize: '14px'}}>AMB</label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                        <label style={{ color:isDarkMode ? 'white' : 'black', marginLeft: '20px', marginRight: '5px', fontSize: '14px' }}>Data Transferred:</label>
                        <span style={{color:isDarkMode ? 'white' : 'black'}}>{DataTransferred} MB</span>
                    </div>
                    <div style={{ minHeight: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '5px' }}>
                        <span style={{ fontSize: '12px', color: enableError ? 'red' : 'green' }}>{enableError || successMessage}</span> 
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '5px' }}>
                        <ToggleSwitch name="toggle-proxy-node" offText="Off" onText="On" checked={isProxyEnabled} onClick={isProxyEnabled ? handleDisableProxy : handleEnableProxy} />
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