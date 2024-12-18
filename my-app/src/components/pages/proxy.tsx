import React, {useEffect, useState} from 'react';
import SimpleBox from "../general/simpleBox";
import { BackIcon, ViewAllIcon } from '../../images/icons/icons';
import ToggleSwitch from '../general/toggle';
import LineGraph from '../charts/lineGraph';
import { useAppContext } from '../../AppContext';
import ProxyNodesTable from '../tables/proxyNodesTable/proxyNodesTable';
import { proxyNodeStructure } from '../tables/proxyNodesTable/proxyNodes';
import ClientUsageTable, { clientUsageData } from '../tables/clientUsageTable/clientUsageTable';
import { startHeartbeat, stopHeartbeat } from '../general/Heartbeat';
import axios from 'axios';


interface AccountData {
    username: string;
    password: string;
    address: string;
  }

export default function ProxyPage(){
    const PORT = 8000;
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

    const headings1 = ["Total", "Data", "Price", "Date"];
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
        pricePerMB: 0,
        peerID: '',
        walletAddr: ''
    });
    const [proxyNodes, setProxyNodes] = useState<proxyNodeStructure[]>([]);
    const [dataUsed, setDataUsed] = useState('0');
    const [totalCost, setTotalCost] = useState(0);
    const [accountData, setAccountData] = useState<AccountData>({
        username: "",
        password: "",
        address: "",
    });
    const [coinAmount, setCoinAmount] = useState(0.00);
    const [currencyAmount, setCurrencyAmount] = useState(0.00);

    const toggleViewHistory = () => setViewHistory(!isViewHistory);
    const toggleViewAvailable = () => setViewAvailable(!isViewAvailable);
    const banwidthData = generateRandomBanwidthData();

    const POLLING_INTERVAL = 5000;
    useEffect(() => {
        const fecthData = async () => {
            const [proxies, status] = await Promise.all([fetchProxies(), fetchProxyStatus()]);
            setProxyNodes(proxies);
            setIsProxyEnabled(status.isProxyEnabled);
            setIsUsingProxy(status.isUsingProxy)
            if(!status.isProxyEnabled) {
                stopHeartbeat();
                setSuccessMessage('');
            }
            if(status.isUsingProxy) {
                const total = Number(status.dataSent) + Number(status.dataRecv);
                setDataUsed((total / (1024)).toFixed(2));
            }
            setSelectedProxyNode(currentNode => {
                const isProxyNodeValid = proxies.some(node => node.peerID === currentNode.peerID);
                if (!isProxyNodeValid) {
                    if(status.isUsingProxy) {
                        console.warn("Selected proxy node no longer valid. Stopping proxy...");
                        handleStopUsingProxy();
                    }else {
                        localStorage.removeItem("selectedProxyNode");
                        setSelectedProxyNode({
                            ipAddress: '',
                            location: '',
                            pricePerMB: 0,
                            peerID: '',
                            walletAddr: ''
                        });
                    }
                }
                return currentNode;
            });
        };
        fecthData();
        const interval = setInterval(() => {
            fecthData();
        }, POLLING_INTERVAL);

        const savedProxyNode = localStorage.getItem("selectedProxyNode");
        if(savedProxyNode) {
            setSelectedProxyNode(JSON.parse(savedProxyNode));
        }else {
            setSelectedProxyNode({
                ipAddress: '',
                location: '',
                pricePerMB: 0,
                peerID: '',
                walletAddr: ''
            });
        }

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

    const fetchAccountData = async () => {
        const response = await axios.get(`http://localhost:${PORT}/getData`);  // Use your server's endpoint here
        console.log(response)
        setAccountData(response.data);
    }

    const updateWalletValues = async() =>{
        let res = await axios.get(`http://localhost:${PORT}/getWalletValue/username/password`)
        console.log("Updated Wallet Values")
        //walletNum = res.data;
        console.log(res.data)
        if(res.data!= null){
            setCoinAmount(res.data)
            setCurrencyAmount(res.data * 10000)//the currency amount shall be 10,000 * coin amount
        }
        

    }
    //updates the page when loading
    useEffect(() => {
        updateWalletValues();
        fetchAccountData();
    }, []);

    const handleEnableProxy = async () => {
        if(isUsingProxy) {
            setEnableError('Please stop using proxy before enabling as proxy node.');
            return;
        }
        const price = parseFloat(pricePerMB);
        if(!pricePerMB || isNaN(price) || price < 0) {
            setEnableError('Please enter a valid positive number or 0.');
            setSuccessMessage('');
        }else {
            setEnableError('');

            try {
                // Send a request
                const response = await fetch('http://localhost:8088/enable-proxy', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ pricePerMB: price, walletAddr: accountData.address }),
                });
    
                const result = await response.json();
    
                if(response.ok) {
                    setTotalCost(0);
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
            const response = await fetch('http://localhost:8088/disable-proxy', {
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
            const response = await fetch('http://localhost:8088/get-proxies');
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
            const response = await fetch("http://localhost:8088/proxy-status");
            const status = await response.json();
            return status;
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
                const region = data.regionName || data.city
                return `${region}, ${data.country}`;
            }else {
                console.warn(`Failed to fetch location for IP: ${ipAddress}`);
                return "Unknown";
            }
        }catch (error) {
            console.error(`Failed to fetch location for IP: ${ipAddress}`, error);
            return "Unknown";
        }
    };

    const handleUseProxy = async () => {
        if(isProxyEnabled) {
            setUseError('Please disable proxy node before using proxy.');
            return;
        }
        if (!selectedProxyNode.peerID) {
            setUseError('Please select a proxy node before using.');
            return;
        }
        try {
            const response = await fetch("http://localhost:8088/use-proxy", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ targetPeerID: selectedProxyNode.peerID }),
            });

            const result = await response.json();
            if(response.ok) {
                setIsUsingProxy(true);
                setUseError('');
                localStorage.setItem("selectedProxyNode", JSON.stringify(selectedProxyNode));
            }else {
                setUseError('Failed to connect to proxy node.');
                console.error(result);
            }
        }catch(error) {
            console.error(error);
            setUseError('Network error while connecting to proxy.');
        }
    };

    const handleStopUsingProxy = async () => {
        localStorage.removeItem("selectedProxyNode");
        setSelectedProxyNode({
            ipAddress: '',
            location: '',
            pricePerMB: 0,
            peerID: '',
            walletAddr: ''
        });
        try {
            const response = await fetch('http://localhost:8088/stop-using-proxy', {
                method: 'POST',
            });
            if(response.ok) {
                const result = await response.json();
                const {dataSent, dataRecv} = result;
                const totalBytes = dataSent + dataRecv;
                const totalKB = totalBytes / 1024;
                const calculatedCost = totalKB * selectedProxyNode.pricePerMB;
                setTotalCost(calculatedCost);
                console.log(`Total cost: ${totalCost.toFixed(4)}`);
                setIsUsingProxy(false);
                send();
            }else {
                //console.error('Failed to stop using proxy.');
            }
        }catch(error) {
            console.error('Network error while stopping proxy.');
        }
    }

    const handleSelectProxyNode = (node: proxyNodeStructure) => {
        if(isViewAvailable)
            toggleViewAvailable();
        setSelectedProxyNode({
            ipAddress: node.ipAddress,
            location: node.location,
            pricePerMB: node.pricePerMB,
            peerID: node.peerID,
            walletAddr: node.walletAddr
        });
        setDataUsed('0');
    };

    const send = async() => {
        let numberErrors = 0;
        const generalError = (document.getElementById('general_error'));
        
        if(totalCost>coinAmount){
            if(generalError){
                generalError.innerHTML = 'Error: Coin sent is more than coins in wallet';
            }
            numberErrors += 1;
        }
        if(totalCost<=0){
            if(generalError){
                generalError.innerHTML = 'Error: Coin sent cannot be 0 or less';
            }
            numberErrors += 1;
        }

        if(!selectedProxyNode.walletAddr|| isNaN(totalCost)){
            if(generalError){
                generalError.innerHTML = 'An error occured. Please try again.';
            }
            numberErrors += 1;

        }
        let resSend = await axios.get(`http://localhost:${PORT}/sendToWallet/username/password/${selectedProxyNode.walletAddr}/${totalCost}`)
        console.log("send result", resSend.data)
        if(resSend.data != 0){
            numberErrors += 1;
        }
        if(numberErrors===0){
            if(generalError){
                generalError.innerHTML = 'Successfully sent to wallet!';
            }
            const conversionAmb= currencyAmount / coinAmount;
            //coinAmount = coinAmount-ambAmount;
            setCoinAmount(coinAmount => coinAmount - totalCost);
            //might change this
            //setCurrencyAmount (currencyAmount => currencyAmount-(ambAmount/currencyAmount));
            //setTimeout(()=>{startTimer()}, 5)
            updateWalletValues();
        }
        else{
            if (generalError && resSend.data == -2){
                generalError.innerHTML = 'Error: Transaction Limits reached. Mine more coins before trying again.';
            }
            else if (generalError && resSend.data == -3){
                generalError.innerHTML = 'Error: Wallet Address is not correct.';
            }
            else if (generalError && resSend.data == -4){
                generalError.innerHTML = 'Error: Cannot send to yourself!';
            }
            else if (generalError){
                generalError.innerHTML = 'Unknown error occured. Please try again.';
            }
        }
    }

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
                        <label style={{ color:isDarkMode ? 'white' : 'black', marginLeft: '20px', marginRight: '5px', fontSize: '14px' }}>Price per KB: </label>
                        <input type="text" value={pricePerMB} onChange={handlePriceChange} disabled={isProxyEnabled} />
                        <label style={{ color:isDarkMode ? 'white' : 'black', marginLeft: '10px', marginRight: '20px', fontSize: '14px'}}>AMB</label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px' }}>
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
                        <span style={{color:isDarkMode ? 'white' : 'black'}}>{dataUsed} KB</span>
                    </div>
                    <div style={{ minHeight: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '5px' }}>
                        <span style={{ fontSize: '12px', color: 'red' }}>{useError}</span> 
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '5px' }}>
                        <ToggleSwitch name="toggle-use-proxy-node" offText="Off" onText="On" checked={isUsingProxy} onClick={isUsingProxy ? handleStopUsingProxy : handleUseProxy} />
                    </div>
                </SimpleBox>
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