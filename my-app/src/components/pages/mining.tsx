import SimpleBox from "../general/simpleBox"
import LineGraph from "../charts/lineGraph"
import { generateRandomData } from "../charts/lineGraph"

export default function MiningPage(){
    const beginMining = () => {}
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
                    <button className="button" onClick={beginMining} style={{position:'absolute', bottom:'10px', right:'10px'}}>Send</button>
                </SimpleBox>
                
                {/* Still needs drop-down box, slider, and button*/}
        </div>
        
        
    )
}