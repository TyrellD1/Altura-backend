import mongoose from 'mongoose';
import { IUser } from '../../@types/user';


const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        // could require first & last name (split)
    },
    email: {
        type: String,
        required: true,
        unique: true,
        index: true,
        validate: {
            validator: function (email: string) {
                return emailRegex.test(email);
            },
            message: (props: { value: string }) => `${props.value} is not a valid email address`
        }
    },
    age: {
        type: Number,
        required: true,
        min: [1, 'Must be at least 1 year old'],
        max: [120, 'Age must be less than 120 years']
    }
}, {
    strict: 'throw'
});

export const User = mongoose.model<IUser>('User', userSchema);

// export default User;