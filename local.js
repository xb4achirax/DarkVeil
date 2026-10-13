import app from './server.js';
import 'dotenv/config'

const port = process.env.PORT || 3001;

app.listen(port, () => {
    console.log(`🚀 https://localhost:${port} 🚀`)
})
