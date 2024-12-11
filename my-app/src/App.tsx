import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import Login from './components/login';
import Navbar from './components/navbar';
import DashboardPage from './components/pages/proxy';
import TransactionsPage from './components/pages/transactions';
import WalletPage from './components/pages/wallet';
import MiningPage from './components/pages/mining';
import SettingsPage from './components/pages/settings';
import { useAppContext } from './AppContext';
import UserFilesPage from './components/pages/userFiles';
import NetworkFilesPage from './components/pages/networkFiles';
import ProfilePage from './components/pages/profile';
import axios from 'axios';

export enum Page {
  Proxy,
  UserFiles,
  NetworkFiles,
  Transactions,
  Wallet,
  Mining,
  Settings,
  Profile
}

interface AccountData {
  username: string;
  password: string;
  address: string;
}

// This is the type that setState from useState hook uses
// Simplified as a single type
export type Dispatcher<S> = Dispatch<SetStateAction<S>>;

function App() {
  // http server PORT
  const PORT = 8000;

  // REMEMBER TO CAHNE THIS 
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<Page>(Page.Proxy);
  const { isDarkMode, sendMessage } = useAppContext();

  const [notifications, setNotifications] = useState<boolean>(true);

  const [accountData, setAccountData] = useState<AccountData>({
    username: "",
    password: "",
    address: "",
  }); 

  const fetchData = async () => {
    const response = await axios.get(`http://localhost:${PORT}/getData`);  // Use your server's endpoint here
    console.log(response)
    setAccountData(response.data);
  }
  const logout = async () => {
    await axios.get(`http://localhost:${PORT}/stopServer`);
    setLoggedIn(false);
  }

  useEffect(() => {
    if(loggedIn){
      fetchData()
    }
    setCurrentPage(Page.Proxy);
  }, [loggedIn]);
  return (
    <div>
      {/*<button onClick={() => sendMessage("Test", {testInt: 1})}>Test</button>*/}
      {!loggedIn && <Login setLoggedIn={setLoggedIn}></Login>}
      {loggedIn &&
        <div className={`page${isDarkMode ? '-dark' : ''}`}>
          <Navbar
            username={accountData.username}
            setPage={setCurrentPage}
            logout={logout}
          ></Navbar>
          {
            ({
              [Page.Proxy]: <DashboardPage />,
              [Page.UserFiles]: <UserFilesPage />,
              [Page.NetworkFiles]: <NetworkFilesPage />,
              [Page.Transactions]: <TransactionsPage />,
              [Page.Wallet]: <WalletPage />,
              [Page.Mining]: <MiningPage />,
              [Page.Settings]: <SettingsPage
                notifications={notifications}
                setNotifications={setNotifications}
              />,
              [Page.Profile]: <ProfilePage 
                username={accountData.username}
                password={accountData.password}
                walletAddress={accountData.address}
              />
            })[currentPage]
          }
        </div>}
    </div>

  )
}

export default App;
