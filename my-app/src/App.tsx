import React, { useState } from 'react';
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

function App() {
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<Page>(Page.Dashboard);

  console.log('logged in: ' + loggedIn);
  return(
    <div>
      {!loggedIn && <Login setLoggedIn={setLoggedIn}></Login>}
      {loggedIn && 
      <div className="page">
        <Navbar
          setPage={setCurrentPage}
        ></Navbar>
        {
          ({
            [Page.Dashboard]: <DashboardPage/> ,
            [Page.Files]: <FilesPage/>,
            [Page.Transactions]: <TransactionsPage/>,
            [Page.Wallet]: <WalletPage/>,
            [Page.Mining]: <MiningPage/>,
            [Page.Settings]: <SettingsPage/>,
          })[currentPage]
        }
      </div>}
    </div>
    
  )
}

export default App;
