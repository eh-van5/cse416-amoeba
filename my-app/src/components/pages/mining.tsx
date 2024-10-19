import SimpleBox from "../general/simpleBox"
import LineGraph from "../charts/lineGraph"
import { generateRandomData } from "../charts/lineGraph"
import { useState, useRef } from "react"
import DropdownMenu from "../general/dropdownMenu";
import useChartMenu from "../charts/useChartMenu";
import { useTheme } from "../../ThemeContext";

// Note: Consider adding a visible timer somehow in the future
// WIP code for timer drop down menu is commented out

export default function MiningPage(){
    const [buttonState, setButtonState] = useState<boolean>(false); // Switch for button state
    const {isDarkMode} = useTheme();
    const [sliderValue, setSliderValue] = useState<number>(50); // Initialize the slider value
    const [timerValue, setTimerValue] = useState(-1); // Usestate for the mining timer
    // const [isMenuVisible, setMenuVisible] = useState(false);
    // const buttonRef = useRef<HTMLDivElement>(null);

    // const menuItems: {label: string; onClick: () => void}[] = [
    //     {
    //         label:'Never',
    //         onClick: () => setTimerValue(-1)
    //     },
    //     {
    //         label:'5 Minutes',
    //         onClick: () => setTimerValue(300)
    //     }
    // ];

    // const toggleMenu = () => setMenuVisible(!isMenuVisible);
    // const closeMenu = () => setMenuVisible(false);

    const handleSlider = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSliderValue(Number(event.target.value)); // Update state with the slider value
    }
    const beginMining = () => {
        setButtonState((buttonState) => !buttonState)
    }
    
    return(
        <div className="page-content">
            <h1 style={{ color:isDarkMode ? 'white' : 'black'}}>Mining</h1>
                <div style={{display:'flex'}}>
                    <SimpleBox title='Balance' style={{maxWidth:'50%'}}>
                        <h2 style={{ color:isDarkMode ? 'white' : 'black', margin:'20px'}}>(Insert Balance Here) AMB</h2>
                    </SimpleBox>
                    <SimpleBox title="Units Mined This Month" style={{maxWidth:'50%'}}>
                        <h2 style={{ color:isDarkMode ? 'white' : 'black', margin:'20px'}}>(Insert Profit Here) AMB</h2>
                    </SimpleBox>
                </div>                
                <SimpleBox title="Mining Network" style={{display:'block', position:'relative'}}>
                    <h3 style={{ color:isDarkMode ? 'white' : 'black', margin:'20px', display:"inline-block"}}>(Insert Number) Active Colonists</h3>
                    <h3 style={{ color:isDarkMode ? 'white' : 'black', margin:'20px', display:"inline-block", left:'20%', position:'relative'}}>(Insert Number) Peak Colonists</h3>
                    {/*BUG: Drop down menu does not appear next to the button like on other pages (Fixed)*/}
                    <LineGraph
                        data={generateRandomData(true)}
                            xAxisLabel="Time"
                            yAxisLabel="Users"
                            title="Mining Activity (Past 24 Hours)"
                            line1Name="Activity"
                            maxWidth={70}
                    />
                    <div style={{ position:'absolute', bottom:'20%', right:'5%', width:'20%'}}>
                        <h3 style={{ color:isDarkMode ? 'white' : 'black', display:'inline-block'}}>Cancel Mining</h3>
                        {/* <div onClick={toggleMenu} ref={buttonRef} style={{cursor: 'pointer'}}>
                            <h3>Test</h3>
                        </div>
                        <DropdownMenu isVisible={isMenuVisible} menuItems={menuItems} buttonRef={buttonRef} onClose={closeMenu} /> */}
                        <br></br>
                        <h3 style={{ color:isDarkMode ? 'white' : 'black' }}>Resource Consumption</h3>
                        <input
                            className="custom-range"
                            type="range"
                            min={0}
                            max={100}
                            value={sliderValue}
                            onChange={handleSlider}
                            style={{ width: '95%', marginLeft:'10px', marginRight:'10px' }}
                        />
                        <h6 style={{ color:isDarkMode ? 'white' : 'black', display:'inline-block', marginTop:'0px'}}>Low</h6>
                        <h6 style={{ color:isDarkMode ? 'white' : 'black', display:'inline-block', float:'right', marginTop:'0px'}}>High</h6>
                    </div>
                    <button className="button" type='button' onClick={beginMining} style={{position:'absolute', bottom:'20px', right:'20px'}}>{(buttonState ? 'Mining...' : 'Begin')}</button>
                </SimpleBox>
                
                {/* Still needs drop-down box, slider, and button*/}
        </div>
        
        
    )
}