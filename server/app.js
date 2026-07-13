import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.status(200).json({ message: "Server is healthy" });
})

app.listen(PORT, () => {
    console.log(`Server is now running on PORT : ${PORT}`);
})