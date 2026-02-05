
import express, { NextFunction, Request, Response, json } from 'express';
import router from './routes/userRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import bodyParser from 'body-parser';
import cors from 'cors';


export const app = express();

app.use(json());
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.urlencoded({ extended: true }));


app.use(router);
app.use(inventoryRoutes);

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    res.json({
        message: error.message
    })
    next()
})


let port = process.env.PORT || 3000;

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    })
}