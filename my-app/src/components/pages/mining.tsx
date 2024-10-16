import SimpleBox from "../general/simpleBox"
import LineGraph from "../charts/lineGraph"
import { generateRandomData } from "../charts/lineGraph"
import { useState } from "react"

export default function MiningPage(){
    const [buttonState, setButtonState] = useState<boolean>(false);
    const [sliderValue, setSliderValue] = useState<number>(50); // Initialize the slider value

    const handleSlider = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSliderValue(Number(event.target.value)); // Update state with the slider value
    }
    const beginMining = () => {
        setButtonState((buttonState) => !buttonState)
    }
    
    return(
        <div className="page-content">
            <h1>Mining</h1>
                <div style={{display:'flex'}}>
                    <SimpleBox title='Balance' style={{maxWidth:'50%'}}>
                        <h2 style={{margin:'20px'}}>(Insert Balance Here) AMB</h2>
                    </SimpleBox>
                    <SimpleBox title="Units Mined This Month" style={{maxWidth:'50%'}}>
                        <h2 style={{margin:'20px'}}>(Insert Profit Here) AMB</h2>
                    </SimpleBox>
                </div>                
                <SimpleBox title="Mining Network" style={{display:'block', position:'relative'}}>
                    <h2 style={{margin:'20px', display:"inline-block"}}>(Insert Number) Active Colonists</h2>
                    <h2 style={{margin:'20px', display:"inline-block", left:'20%', position:'relative'}}>(Insert Number) Peak Colonists</h2>
                    <LineGraph
                        data={generateRandomData(true)}
                            xAxisLabel="Time"
                            yAxisLabel="Users"
                            title="Mining Activity (Past 24 Hours)"
                            line1Name="Activity"
                            maxWidth={70}
                    />
                    <div style={{ position:'absolute', bottom:'20%', right:'5%', width:'20%'}}>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={sliderValue}
                            onChange={handleSlider}
                            style={{ width: '100%' }}
                        />
                    </div>
                    <button className="button" type='button' onClick={beginMining} style={{position:'absolute', bottom:'20px', right:'20px'}}>{(buttonState ? 'Mining...' : 'Begin')}</button>
                </SimpleBox>
                
                {/* Still needs drop-down box, slider, and button*/}
        </div>
        
        
    )
}