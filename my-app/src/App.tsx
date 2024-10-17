import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import Login from './components/login';
import Navbar from './components/navbar';
import DashboardPage from './components/pages/proxy';
import FilesPage from './components/pages/files';
import TransactionsPage from './components/pages/transactions';
import WalletPage from './components/pages/wallet';
import MiningPage from './components/pages/mining';
import SettingsPage from './components/pages/settings';
import { useTheme } from './ThemeContext';

export enum Page{
  Proxy,
  Files,
  Transactions,
  Wallet,
  Mining,
  Settings
}

// This is the type that setState from useState hook uses
// Simplified as a single type
export type Dispatcher<S> = Dispatch<SetStateAction<S>>;

function App() {
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<Page>(Page.Proxy);
  const { isDarkMode } = useTheme();

  const[notifications, setNotifications] = useState<boolean>(true);
  useEffect(() => {
    setCurrentPage(Page.Proxy);
  }, [loggedIn]);

  return(
    <div>
      {!loggedIn && <Login setLoggedIn={setLoggedIn}></Login>}
      {loggedIn && 
      <div className={`page${isDarkMode ? '-dark' : ''}`}>
        <Navbar
          setPage={setCurrentPage}
          logout={() => setLoggedIn(false)}
        ></Navbar>
        {
          ({
            [Page.Proxy]: <DashboardPage/> ,
            [Page.Files]: <FilesPage/>,
            [Page.Transactions]: <TransactionsPage/>,
            [Page.Wallet]: <WalletPage/>,
            [Page.Mining]: <MiningPage/>,
            [Page.Settings]: <SettingsPage 
                            notifications={notifications} 
                            setNotifications={setNotifications}
                            />,          })[currentPage]
        }
      </div>}
    </div>
    
  )
}

export default App;
