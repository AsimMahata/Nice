import './App.css'


import { Routes, Route } from "react-router-dom";
import Profile from './pages/User/Profile'
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Home from './pages/Home/Home';
import CodeforcesStats from './pages/Codeforces/CodeforcesStats';
import WorkspaceProvider from './contexts/Workspace/WorkspaceProvider';
import EditorProvider from './contexts/Editor/EditorProvider';
import CommandProvider from './contexts/Commands/CommandProvider';
import CodeActionProvider from './contexts/CodeAction/CodeActionProvider';
import { logger } from './services/Logger/Logger';

function App() {
    logger.info('App', 'Rendering App component');
    return (
        <WorkspaceProvider>
            <EditorProvider>
                <CommandProvider>
                    <CodeActionProvider>
                        <Routes>
                            <Route path='/' element={< Home />} />
                            <Route path='/user/:id' element={<Profile />} />
                            <Route path='/login' element={<Login />} />
                            <Route path='/register' element={<Register />} />
                            <Route path='/codeforces' element={<CodeforcesStats />} />
                        </Routes>
                    </CodeActionProvider>
                </CommandProvider>
            </EditorProvider>
        </WorkspaceProvider>
    )
}

export default App
