import './init.js'



import { httpServer, cphApp } from './server.js';


const PORT = process.env.PORT || 3000;
const CPH_PORT = process.env.CPH_PORT || 10043;

cphApp.listen(CPH_PORT, () => {
    console.log(`CPH Server listening on port ${CPH_PORT}`);
});

httpServer.listen(PORT, () => {
    console.log(`Backend running on ${PORT}`);
});
