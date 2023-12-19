import { Router, Response, Request } from 'express';
import mongoose from 'mongoose';
import { IUser } from '../../@types/user';
import { User } from '../schemas/user';

const router = Router();

/*
Opted to not use controllers for simplicity
*/
// const User = 

// Get all users
router.get('/', async (req: Request, res: Response) => {
    try {
        // page starts at 1
        if (!req.query.page) {
            res.status(400).send('Missing page query parameter');
            return;
        }

        const queryPage = parseInt(req.query.page as string);

        if (!req.query.limit) {
            res.status(400).send('Missing limit query parameter');
            return;
        }

        const queryLimit = parseInt(req.query.limit as string);
        if (queryLimit < 10) {
            res.status(400).send('Limit must be at least 10');
            return;
        } else if (queryLimit > 100) {
            res.status(400).send('Limit must be less than 100');
            return;
        }

        let queryFields: string[] = [];

        if (req.query.fields) {
            const fields = (req.query.fields as string).split(',');
            for (const field of fields) {
                if (!Object.keys(User.schema.obj).includes(field)) {
                    res.status(400).send(`Invalid field: ${field}`);
                    return;
                }
            }
            if (fields.length) queryFields = fields;
        }

        const users = await User.find({}).select(queryFields.length ? queryFields : [])
            .lean()
            .limit(queryLimit)
            .skip(queryLimit * (queryPage - 1))

        // could be in separate query
        // frontend can call w/ Promise.all
        const count = await User.countDocuments({})

        if (count > 0 && users.length === 0) {
            res.status(404).send('Page not found');
            return;
        }

        res.json({
            users,
            page: queryPage,
            limit: queryLimit,
            // alternatively can return nextPage:true or totalPages
            count
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
});

// Create a new user
router.post('/', async (req: Request, res: Response) => {
    try {
        const newUser = new User(req.body);
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (err: any) {
        console.error(err);
        if (err.code === 11000) {
            res.status(400).send('User with that email already exists');
            return;
        }
        res.status(500).send(err.message);
    }
});

export default router;