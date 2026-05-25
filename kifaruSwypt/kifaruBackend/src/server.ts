
import express, { NextFunction, Request, Response, json } from 'express';
import dotenv from 'dotenv';
dotenv.config();
import router from './routes/userRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import fonbnkRoutes from './routes/fonbnkRoutes';
import bodyParser from 'body-parser';
import cors from 'cors';


export const app = express();

app.use(json());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*'
}));

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        service: 'kifaru-backend',
        uptime: process.uptime()
    });
});

app.use('/api', router);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/fonbnk', fonbnkRoutes);

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled Error:', error);
    res.status(500).json({
        message: 'Internal Server Error'
    });
});


let port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
