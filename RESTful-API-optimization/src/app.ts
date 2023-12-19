import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import userRoutes from './routes/user.routes';
import rateLimiter from './middleware/rateLimiter';

const app = express();

app.use(rateLimiter);

// Body parser middleware
app.use(bodyParser.json());

// not needed
// mongoose.connect(uri, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     useCreateIndex: true
// });

const uri = process.env.DB_URI || 'mongodb://localhost:27017/altura-test';

mongoose.connect(uri).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Error connecting to MongoDB', err);
});

const router = express.Router();

router.use("/users", userRoutes);

app.use("/api/v1", router);

export default app;