import React, {useState} from 'react';
import LineGraph from "../charts/lineGraph";
import SimpleBox from "../general/simpleBox";

export default function WalletPage(){
    //Determines the coin amount
    const coinAmount = 0.367
    const currencyAmount = 6.90

    const send = () => {}

    const generateRandomLossGainData = () => {
        const data = [];
        for(let i = 0; i < 12; i++) {
            let t = `09:${i+10}`;
            let value1 = Math.floor(Math.random() * 30) + 20;
            let value2 = Math.floor(Math.random() * 30) + 15;
            data.push({name: t, value1, value2});
        }
        return data;
    }
    const lossGainData = generateRandomLossGainData();
    return(
    <div className="page-content" style={{padding: '20px'}}>
        <h1>Wallet</h1>
        <div className="graph-row">
            <SimpleBox title='Wallet'>
                <h2 style={{margin:'20px'}}>{coinAmount.toFixed(3)} AMB</h2>
            </SimpleBox>
            <SimpleBox title='USD Amount'>
                <h2 style={{margin:'20px'}}> $ {currencyAmount.toFixed(2)} USD</h2>
            </SimpleBox>
        </div>
        <div className="graph-row">
            <LineGraph
                data = {lossGainData}
                line1Color="#17BD28"     // Default is #1C9D49
                line2Color="#FF6D6D"     // Default is #9D1C1C
                xAxisLabel="Time"
                yAxisLabel="Amount"
                line1Name = "Gain"
                line2Name = "Loss"
                title="Gain/Loss over Time"
            />
        </div>
        <div className="graph-row">
            <SimpleBox title='Send'>
                <div style={{ display: 'flex', alignItems: 'center'}}>
                    <label style={{ marginLeft: '10px', marginRight: '10px',}}>Wallet Number</label>
                    <input type="text" className = "login-input" />
                </div>  
                <div style={{ display: 'flex', alignItems: 'center'}}>
                    <label style={{ marginLeft: '10px', marginRight: '10px' }}>Amount</label>
                    <input type="text" className = "login-input"/>
                    <label style={{ marginLeft: '10px', marginRight: '10px' }}>AMB</label>
                </div> 
    
                <div style={{ display: 'flex', justifyContent: 'center'}}>
                    <button id='login-button' className="button" type="button" onClick={send}>Send</button>
                </div>
            </SimpleBox>
        </div>
    </div>
    );      
}