import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as schema from '../../../migrations/schema';

dotenv.config({ path: '.env.development.local' })

if (!process.env.DATABASE_URL) {
    console.log('no database url')
}

const client = postgres(process.env.DATABASE_URL as string, { max: 1, idle_timeout: 5 });

const db = drizzle(client, { schema });

const migrateDb = async () => {
    try {
        console.log('migrating db...')
        await migrate(db, { migrationsFolder: 'migrations' })
        console.log('db migrated!')
    } catch (error) {
        console.log('error on migrate db', error)
    }
}

// migrateDb()

export default db;
