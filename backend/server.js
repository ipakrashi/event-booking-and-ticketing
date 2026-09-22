import dns from 'dns'
import app from './app.js'
import connectDB from './util/connectDB.js'

dns.setServers(['8.8.8.8', '8.8.4.4'])

const PORT = process.env.PORT || 3000

// Connect to Database
connectDB()

// Start Server
app.listen(PORT, () => {
    console.log(`Server Started On Port : ${PORT}`)
})
