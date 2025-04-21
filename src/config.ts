import dotenv from 'dotenv';

dotenv.config();

export default {
    knex: {
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    }
}
