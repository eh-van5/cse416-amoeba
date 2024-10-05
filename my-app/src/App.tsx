import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import Login from './components/login';
import Navbar from './components/navbar';
import DashboardPage from './components/pages/dashboard';
import FilesPage from './components/pages/files';
import TransactionsPage from './components/pages/transactions';
import WalletPage from './components/pages/wallet';
import MiningPage from './components/pages/mining';
import SettingsPage from './components/pages/settings';

export enum Page{
  Dashboard,
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
  const [currentPage, setCurrentPage] = useState<Page>(Page.Dashboard);

  const[isDarkMode, setDarkMode] = useState<boolean>(false);
  const[notifications, setNotifications] = useState<boolean>(true);

  useEffect(() => {
    setCurrentPage(Page.Dashboard);
  }, [loggedIn]);

  return(
    <div>
      {!loggedIn && <Login setLoggedIn={setLoggedIn}></Login>}
      {loggedIn && 
      <div className="page">
        <Navbar
          setPage={setCurrentPage}
          logout={() => setLoggedIn(false)}
        ></Navbar>
        {
          ({
            [Page.Dashboard]: <DashboardPage/> ,
            [Page.Files]: <FilesPage/>,
            [Page.Transactions]: <TransactionsPage/>,
            [Page.Wallet]: <WalletPage/>,
            [Page.Mining]: <MiningPage/>,
            [Page.Settings]: <SettingsPage 
                            isDarkMode={isDarkMode} 
                            setDarkMode={setDarkMode} 
                            notifications={notifications} 
                            setNotifications={setNotifications}
                            />,
          })[currentPage]
        }
      </div>}
    </div>
    
  )
}

export default App;
