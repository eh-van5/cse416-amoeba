import SimpleBox from "../general/simpleBox"
import LineGraph from "../charts/lineGraph"
import { generateRandomData } from "../charts/lineGraph"
import { useState, useRef } from "react"
import DropdownMenu from "../general/dropdownMenu";
import useChartMenu from "../charts/useChartMenu";
import { useTheme } from "../../ThemeContext";

// Note: Consider adding a visible timer somehow in the future
// WIP code for timer drop down menu is commented out

export default function MiningPage() {
    const { isDarkMode } = useTheme();
    const [sliderValue, setSliderValue] = useState<number>(50); // Initialize the slider value
    const [hours, setHours] = useState<string>('0');
    const [minutes, setMinutes] = useState<string>('0');
    const [seconds, setSeconds] = useState<string>('0');
    const [timerValue, setTimerValue] = useState<number>(-1); // Usestate for the mining timer
    var timerActive: boolean = false;
    const [isMining, setIsMining] = useState<boolean>(false); // Switch for button state

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

    const beginMining = () => {
        const totalSeconds = (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
        if (totalSeconds > 0) {
            // setSeconds('0');
            // setMinutes('0');
            // setHours('0');
            timerActive = true;
            setTimerValue(totalSeconds);
        }
        setIsMining((isMining) => !isMining);
    }

    return (
        <div className="page-content">
            <h1 style={{ color: isDarkMode ? 'white' : 'black' }}>Mining</h1>
            <div style={{ display: 'flex' }}>
                <SimpleBox title='Balance' style={{ maxWidth: '50%' }}>
                    <h2 style={{ color: isDarkMode ? 'white' : 'black', margin: '20px' }}>(Insert Balance Here) AMB</h2>
                </SimpleBox>
                <SimpleBox title="Units Mined This Month" style={{ maxWidth: '50%' }}>
                    <h2 style={{ color: isDarkMode ? 'white' : 'black', margin: '20px' }}>(Insert Profit Here) AMB</h2>
                </SimpleBox>
            </div>
            <SimpleBox title="Mining Network" style={{ display: 'block', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: "space-between", maxWidth: '50%' }}>
                    <h3 style={{ color: isDarkMode ? 'white' : 'black', margin: '20px', display: "inline-block" }}>(Insert Number) Active Colonists</h3>
                    <h3 style={{ color: isDarkMode ? 'white' : 'black', margin: '20px', display: "inline-block" }}>(Insert Number) Peak Colonists</h3>
                </div>
                {/*RESOLVED: Drop down menu does not appear next to the button like on other pages */}
                <LineGraph
                    data={generateRandomData(true)}
                    xAxisLabel="Time"
                    yAxisLabel="Users"
                    title="Mining Activity (Past 24 Hours)"
                    line1Name="Activity"
                    maxWidth={70}
                />
                <div style={{ position: 'absolute', bottom: '20%', right: '5%', width: '20%' }}>
                    <h3 style={{ color: isDarkMode ? 'white' : 'black', display: "block" }}>
                        {
                            isMining ?
                                timerActive && `Time Left` :
                                'Cancel Mining'
                        }
                    </h3>
                    {
                        isMining
                            ?
                            timerActive &&
                            <h3 style={{ color: isDarkMode ? 'white' : 'black', display: "block" }}>
                                {`${Math.floor(timerValue / 3600)}h ${Math.floor((timerValue % 3600) / 60)}m ${timerValue % 60}`}
                            </h3>
                            :
                            (<div className="input-container">
                                <div className="input-group">
                                    <label>
                                        Hrs
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
                                        Mins
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
                                        Secs:
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
                    />
                    <h6 style={{ color: isDarkMode ? 'white' : 'black', display: 'inline-block', marginTop: '0px' }}>Low</h6>
                    <h6 style={{ color: isDarkMode ? 'white' : 'black', display: 'inline-block', float: 'right', marginTop: '0px' }}>High</h6>
                </div>
                <button className="button" type='button' onClick={beginMining} style={{ position: 'absolute', bottom: '20px', right: '20px' }}>{(isMining ? 'Mining...' : 'Begin')}</button>
            </SimpleBox>

            {/* Still needs drop-down box, slider, and button*/}
        </div>


    )
}