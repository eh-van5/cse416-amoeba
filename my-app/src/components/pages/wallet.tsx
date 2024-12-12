
import React, {useEffect, useState} from 'react';
import LineGraph from "../charts/lineGraph";
import SimpleBox from "../general/simpleBox";
import { useAppContext } from '../../AppContext';
import axios from 'axios';


const PORT = 8000;
//const username = user.username

export default function WalletPage(){
    //const {isDarkMode} = useTheme();//old
    const {isDarkMode} = useAppContext()
    //Determines the coin amount
    const [coinAmount, setCoinAmount] = useState(0.00);
    const [currencyAmount, setCurrencyAmount] = useState(0.00);
    //function to update the wallet values
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
    }, []);
    //function to send to this wallet
    const send = async() => {
        let numberErrors = 0;
        const walletNum = (document.getElementById('walletNum') as HTMLInputElement).value;
        //console.log(walletNum)
        const ambAmount = parseFloat((document.getElementById('ambAmount') as HTMLInputElement).value);
        const generalError = (document.getElementById('general_error'));
        
        if(ambAmount>coinAmount){
            if(generalError){
                generalError.innerHTML = 'Error: Coin sent is more than coins in wallet';
            }
            numberErrors += 1;
        }
        if(ambAmount<=0){
            if(generalError){
                generalError.innerHTML = 'Error: Coin sent cannot be 0 or less';
            }
            numberErrors += 1;
        }

        if(!walletNum|| isNaN(ambAmount)){
            if(generalError){
                generalError.innerHTML = 'An error occured. Please try again.';
            }
            numberErrors += 1;

        }
        let resSend = await axios.get(`http://localhost:${PORT}/sendToWallet/username/password/${walletNum}/${ambAmount}`)
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
            setCoinAmount(coinAmount => coinAmount - ambAmount);
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
            else if (generalError){
                generalError.innerHTML = 'Unknown error occured. Please try again.';
            }
        }
    }

    const generateRandomLossGainData = () => {
        const data = [];
        for(let i = 0; i < 12; i++) {
            let t = `09/${i+10}/2024`;
            let value1 = Math.floor(Math.random() * 30) + 20;
            let value2 = Math.floor(Math.random() * 30) + 15;
            data.push({name: t, value1, value2});
        }
        return data;
    }
    const lossGainData = generateRandomLossGainData();
    return(
    <div className="page-content" style={{padding: '20px'}}>
        <h1 style={{ color:isDarkMode ? 'white' : 'black'}}>Wallet</h1>
        <div className="graph-row">
            <SimpleBox title='Wallet'>
                <h2 style={{color:isDarkMode ? 'white' : 'black', margin:'20px'}}>{coinAmount.toFixed(3)} AMB</h2>
            </SimpleBox>
            <SimpleBox title='USD Amount'>
                <h2 style={{color:isDarkMode ? 'white' : 'black', margin:'20px'}}> $ {currencyAmount.toFixed(2)} USD</h2>
            </SimpleBox>
        </div>
        <div className="graph-row">
            <LineGraph
                data = {lossGainData}
                line1Color="#17BD28"     // Default is #1C9D49
                line2Color="#FF6D6D"     // Default is #9D1C1C
                xAxisLabel="Time"
                yAxisLabel="AMB"
                line1Name = "Gain"
                line2Name = "Loss"
                title="Gain/Loss over Time"
            />
        </div>
        <div className="graph-row">
            <SimpleBox title='Send'>
                <div style={{ display: 'flex', justifyContent: 'center'}}>
                    <p id='general_error' className='error_message' style = {{justifyContent: 'center', color:isDarkMode ? 'white' : 'black'}}></p>
                </div>    
                <div style={{ display: 'flex', alignItems: 'center'}}>
                    <label style={{ color:isDarkMode ? 'white' : 'black', marginLeft: '10px', marginRight: '10px',}}>Wallet Number</label>
                    <input type="text" id = "walletNum" className = "login-input" />
                </div>  
                <div style={{ display: 'flex', alignItems: 'center'}}>
                    <label style={{ color:isDarkMode ? 'white' : 'black', marginLeft: '10px', marginRight: '10px' }}>Amount</label>
                    <input type="text" id = "ambAmount" className = "login-input"/>
                    <label style={{ color:isDarkMode ? 'white' : 'black', marginLeft: '10px', marginRight: '10px' }}>AMB</label>
                </div> 
    
                <div style={{ display: 'flex', justifyContent: 'center'}}>
                    <button id='login-button' className="button" type="button" onClick={send}>Send</button>
                </div>
            </SimpleBox>
        </div>
    </div>
    );
}      


function startTimer() {
    throw new Error('Function not implemented.');
}

