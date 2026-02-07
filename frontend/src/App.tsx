import './App.css'

import { Routes, Route } from "react-router-dom";
import _Home from './pages/HomeOld';
import Profile from './pages/Profile'
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Home from './pages/Home/Home';

function App() {
    return (
        <Routes>
            <Route path='/' element={< Home />} />
            <Route path='/user/:id' element={<Profile />} />
            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />
        </Routes>
    )
}

export default App
