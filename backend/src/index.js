const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.send({ status: 'OK' });
});

const PORT = process.env.PORT || 5876;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));