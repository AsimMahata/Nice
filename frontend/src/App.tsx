import './App.css'

import { Routes, Route } from "react-router-dom";
import Home from './pages/Home';
import Profile from './pages/Profile'
import Login from './pages/Login';
import Register from './pages/Register';
import MainLayout from './pages/MainLayout';

function App() {
    return (
        <Routes>
            <Route path='/' element={<MainLayout />} />
            <Route path='/user/:id' element={<Profile />} />
            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />
        </Routes>
    )
}

export default App
