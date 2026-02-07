import './init.js'
import { httpServer } from './server.js';


const PORT = process.env.PORT || 3000;


httpServer.listen(PORT, () => {
    console.log(`Backend running on ${PORT}`);
});
