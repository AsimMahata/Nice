import './App.css'


import { Routes, Route } from "react-router-dom";
import Profile from './pages/User/Profile'
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Home from './pages/Home/Home';
import WorkspaceProvider from './contexts/Workspace/WorkspaceProvider';
import EditorProvider from './contexts/Editor/EditorProvider';
import CommandProvider from './contexts/Commands/CommandProvider';

function App() {
    console.log('render app')
    return (
        <WorkspaceProvider>
            <EditorProvider>
                <CommandProvider>
                    <Routes>
                        <Route path='/' element={< Home />} />
                        <Route path='/user/:id' element={<Profile />} />
                        <Route path='/login' element={<Login />} />
                        <Route path='/register' element={<Register />} />
                    </Routes>
                </CommandProvider>
            </EditorProvider>
        </WorkspaceProvider>
    )
}

export default App
