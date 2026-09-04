const { initAuthCreds, BufferJSON } = require('@whiskeysockets/baileys');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const usePostgresAuthState = async () => {
    // Ensure table exists
    await pool.query(`
        CREATE TABLE IF NOT EXISTS wa_sessions (
            id VARCHAR(255) PRIMARY KEY,
            data TEXT
        );
    `);

    const writeData = async (data, id) => {
        try {
            const str = JSON.stringify(data, BufferJSON.replacer);
            await pool.query(
                'INSERT INTO wa_sessions (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data',
                [id, str]
            );
        } catch (error) {
            console.error('Error writing auth state to DB:', error);
        }
    };

    const readData = async (id) => {
        try {
            const res = await pool.query('SELECT data FROM wa_sessions WHERE id = $1 LIMIT 1', [id]);
            if (res.rows.length > 0) {
                return JSON.parse(res.rows[0].data, BufferJSON.reviver);
            }
            return null;
        } catch (error) {
            console.error('Error reading auth state from DB:', error);
            return null;
        }
    };

    const removeData = async (id) => {
        try {
            await pool.query('DELETE FROM wa_sessions WHERE id = $1', [id]);
        } catch (error) {
            console.error('Error deleting auth state from DB:', error);
        }
    };

    const creds = (await readData('creds')) || initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(
                        ids.map(async (id) => {
                            let value = await readData(`${type}-${id}`);
                            data[id] = value;
                        })
                    );
                    return data;
                },
                set: async (data) => {
                    const tasks = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const key = `${category}-${id}`;
                            if (value) {
                                tasks.push(writeData(value, key));
                            } else {
                                tasks.push(removeData(key));
                            }
                        }
                    }
                    await Promise.all(tasks);
                },
            },
        },
        saveCreds: () => {
            return writeData(creds, 'creds');
        },
    };
};

module.exports = { usePostgresAuthState };
