import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello from backend!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access the server at: http://localhost:${PORT}`);
});