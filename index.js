const express = require("express");
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();

// middle wares
app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.send('Going Global server in Running')
});

app.listen(port, () => {
    console.log(`Going Global server is running on ${port}`)
})
