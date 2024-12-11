import SimpleBox from "../general/simpleBox"
import LineGraph from "../charts/lineGraph"
import { generateRandomData } from "../charts/lineGraph"
import { useState, useRef, useEffect } from "react"
import DropdownMenu from "../general/dropdownMenu";
import useChartMenu from "../charts/useChartMenu";
import { useTheme } from "../../ThemeContext";
import { useAppContext } from '../../AppContext';
import axios from "axios";

const PORT = 8088
// Note: Consider adding a visible timer somehow in the future
// WIP code for timer drop down menu is commented out

let timer: ReturnType<typeof setInterval> | null = null;

export default function MiningPage() {
    const { isDarkMode, sendMessage } = useAppContext();
    const [sliderValue, setSliderValue] = useState<number>(50); // Initialize the slider value
    const [hours, setHours] = useState<string>('0');
    const [minutes, setMinutes] = useState<string>('0');
    const [seconds, setSeconds] = useState<string>('0');
    const [timerValue, setTimerValue] = useState<number>(-1); // Usestate for the mining timer
    const [buttonText, setButtonText] = useState<string>("Begin Mining");
    
    const [isMining, setIsMining] = useState<boolean>(false); // Switch for button state
    const [coinAmount, setCoinAmount] = useState(0.00);
    const [peerAmount, setPeerAmount] = useState(0);
    const [peakAmount, setpeakAmount] = useState(0);
    const updateWalletValues = async() =>{
        let res = await axios.get(`http://localhost:${PORT}/getWalletValue/username/password`)
        console.log("Updated Wallet Values")
        //walletNum = res.data;
        setCoinAmount(res.data)
    }
    const updatePeerValues = async() =>{
        let res = await axios.get(`http://localhost:${PORT}/getConnectionCount/username/password`)
        console.log("Updated Peer Amt Values")
        if(res.data.length > peakAmount){
            setpeakAmount(res.data.length)
        }
        //walletNum = res.data;
        setPeerAmount(res.data.length)
    }

    const handleSlider = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSliderValue(Number(event.target.value)); // Update state with the slider value
    }

    const handleHoursChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        if (!value || /^[0-9]*$/.test(value)) {
            setHours(value);
        }
    };

    const handleMinutesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        if (!value || /^[0-9]*$/.test(value)) {
            setMinutes(value);
        }
    };

    const handleSecondsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        if (!value || /^[0-9]*$/.test(value)) {
            setSeconds(value);
        }
    };
    const startTimer = ()=> {
        const totalSeconds = (parseInt(hours)) * 3600 + (parseInt (minutes)) * 60 + (parseInt(seconds))
        if (totalSeconds > 0) {
            const targetEnd = Date.now() + totalSeconds * 1000;
            if(timer){
                clearInterval(timer)
            }

            //const interval = setInterval(()=>{
            timer = setInterval(()=>{
                const remainingTime = targetEnd-Date.now()
                if(remainingTime <=0){
                    //clearInterval(timer)
                    stopMining()
                    setIsMining(false);
                    setHours('0');
                    setMinutes('0');
                    setSeconds('0');
                    setButtonText("Begin Mining");
                }
                else{
                    setTimerValue(Math.floor(remainingTime / 1000))
                }
            });
        }

    };

    const startMining = async() => { 
        //get numCores
        let numCores = 0
        try {
            const res = await axios.get(`http://localhost:${PORT}/getCPUThreads/username/password`)
            console.log(res.data)
            numCores = res.data
        }
        catch (error) {
            console.error("Error getting number of cores:", error)
        }
        //will not allow 0 core mining!
        const numCoresPass = Math.max(1,Math.round(sliderValue * 0.01 * numCores))
        console.log("NumCores to mine: ", numCoresPass)
        //calculate cores it should pass
        try {
            const res = await axios.get(`http://localhost:${PORT}/startMining/username/password/${numCoresPass}`)
            console.log(res.data)
        }
        catch (error) {
            console.error("Error starting mining:", error)
        }
    }
    const stopMining = async() => { 
        try {
            const res = await axios.get(`http://localhost:${PORT}/stopMining/username/password`)
            console.log(res.data)
        }
        catch (error) {
            console.error("Error stopping mining:", error)
        }
    }

    const handleButtonClick = () => {
        setTimerValue(0);
        const totalSeconds = (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
        console.log(totalSeconds);
        if (totalSeconds > 0) {
            // setSeconds('0');
            // setMinutes('0');
            // setHours('0');
            setTimerValue(totalSeconds);
            startTimer()
        }
        if (isMining) {
            setButtonText('Begin Mining');
            //sendMessage('Stop Mining Request')
            //call to start mining
            stopMining()
            setTimerValue(0)
        }
        else {
            setButtonText('Stop Mining');
            //sendMessage('Begin Mining Request')
            //call to stop mining
            startMining()
        }
        setIsMining((isMining) => !isMining);
    }

    const handleMouseOver = () => {
        if(isMining) {
            setButtonText('Stop Mining');
        }
    }

    const handleMouseOut = () => {
        if(isMining) {
            setButtonText(`${0} Units Mined`);
        }
        else {
            setButtonText("Begin Mining");
        }
    }
    useEffect(() => {
        updateWalletValues();
        updatePeerValues();
    }, []);


    return (
        <div className="page-content">
            <h1 style={{ color: isDarkMode ? 'white' : 'black' }}>Mining</h1>
            <div style={{ display: 'flex' }}>
                <SimpleBox title='Balance' style={{ maxWidth: '50%' }}>
                    <h2 style={{ color: isDarkMode ? 'white' : 'black', margin: '20px' }}>{coinAmount.toFixed(3)} AMB</h2>
                </SimpleBox>
                <SimpleBox title="Units Mined This Month" style={{ maxWidth: '50%' }}>
                    <h2 style={{ color: isDarkMode ? 'white' : 'black', margin: '20px' }}>(Insert Profit Here) AMB</h2>
                </SimpleBox>
            </div>
            <SimpleBox title="Mining Network" style={{ display: 'block', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: "space-between", maxWidth: '60%' }}>
                    <h3 style={{ color: isDarkMode ? 'white' : 'black', margin: '20px', display: "inline-block" }}>{peerAmount.toFixed(0)} Active Colonists</h3>
                    <h3 style={{ color: isDarkMode ? 'white' : 'black', margin: '20px', display: "inline-block" }}>{peakAmount.toFixed(0)} Peak Colonists</h3>
                </div>
                {/*RESOLVED: Drop down menu does not appear next to the button like on other pages */}
                <LineGraph
                    data={generateRandomData(true)}
                    xAxisLabel="Time"
                    yAxisLabel="Users"
                    title="Mining Activity (Past 24 Hours)"
                    line1Name="Activity"
                    maxWidth={60}
                />
                <div style={{ position: 'absolute', bottom: '20%', right: '5%', width: '30%' }}>
                    <h3 style={{ color: isDarkMode ? 'white' : 'black', display: "block" }}>
                        {
                            isMining ?
                                `Time Left` :
                                'Cancel Mining'
                        }
                    </h3>
                    {
                        isMining
                            ?
                            <h1 style={{ color: isDarkMode ? 'white' : 'black', display: "block" }}>
                                {timerValue > 0 ? `${Math.floor(timerValue / 3600).toString().padStart(2, '0')}h ${Math.floor((timerValue % 3600) / 60).toString().padStart(2, '0')}m ${(timerValue % 60).toString().padStart(2, '0')}s` : '~~h ~~m ~~s'}
                            </h1>
                            :
                            (<div className="input-container">
                                <div className="input-group">
                                    <label>
                                        <span style={{ color: isDarkMode ? 'white' : 'black', display: "block" }}>Hrs</span>
                                        <input
                                            type="number"
                                            value={hours}
                                            onChange={handleHoursChange}
                                            min="0"
                                        />
                                    </label>
                                </div>
                                <div className="input-group">
                                    <label style={{ width: '30%' }}>
                                        <span  style={{ color: isDarkMode ? 'white' : 'black', display: "block" }}>Mins</span>
                                        <input
                                            type="number"
                                            value={minutes}
                                            onChange={handleMinutesChange}
                                            min="0"
                                        />
                                    </label>
                                </div>
                                <div className="input-group">
                                    <label style={{ width: '30%' }}>
                                        <span  style={{ color: isDarkMode ? 'white' : 'black', display: "block" }}>Secs</span>
                                        <input
                                            type="number"
                                            value={seconds}
                                            onChange={handleSecondsChange}
                                            min="0"
                                        />
                                    </label>
                                </div>
                            </div>)
                    }
                    <h3 style={{ color: isDarkMode ? 'white' : 'black' }}>Resource Consumption</h3>
                    <input
                        className="custom-range"
                        type="range"
                        min={0}
                        max={100}
                        value={sliderValue}
                        onChange={handleSlider}
                        style={{ width: '95%', marginLeft: '10px', marginRight: '10px' }}
                        disabled={isMining}
                    />
                    <h6 style={{ color: isDarkMode ? 'white' : 'black', display: 'inline-block', marginTop: '0px' }}>Low</h6>
                    <h6 style={{ color: isDarkMode ? 'white' : 'black', display: 'inline-block', float: 'right', marginTop: '0px' }}>High</h6>
                </div>
                <button className={`button ${isMining ? 'mining-button': ''}`} type='button' onMouseOver={handleMouseOver} onMouseOut={handleMouseOut} onClick={handleButtonClick} style={{ position: 'absolute', bottom: '20px', right: '20px' }}>
                    {buttonText}
                </button>
            </SimpleBox>

            {/* Still needs drop-down box, slider, and button*/}
        </div>


    )
}