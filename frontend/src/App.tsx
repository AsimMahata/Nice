import './App.css'

import { Routes, Route } from "react-router-dom";
import _Home from './pages/Home';
import Profile from './pages/Profile'
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import _MainLayout from './pages/Home/HomeTest';

function App() {
    return (
        <Routes>
            <Route path='/' element={< _MainLayout />} />
            <Route path='/user/:id' element={<Profile />} />
            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />
        </Routes>
    )
}

export default App
