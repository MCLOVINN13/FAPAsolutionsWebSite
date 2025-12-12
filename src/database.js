const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to SQLite database
const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDatabase();
    }
});

function initDatabase() {
    db.serialize(() => {
        // 1. Usuarios Table
        db.run(`CREATE TABLE IF NOT EXISTS Usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            ip_address TEXT,
            edad INTEGER,
            numero_cotizaciones INTEGER DEFAULT 0,
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
            username TEXT UNIQUE,
            fullname TEXT,
            profile_pic TEXT,
            cover_pic TEXT,
            location TEXT,
            bio TEXT
        )`, (err) => {
            if (err) {
                console.error('Error creating table Usuarios:', err.message);
            } else {
                console.log('Table "Usuarios" ready or already exists.');
                // Attempt migrations for existing instances
                addColumnsIfNotExist('Usuarios', [
                    { name: 'username', type: 'TEXT UNIQUE' },
                    { name: 'fullname', type: 'TEXT' },
                    { name: 'profile_pic', type: 'TEXT' },
                    { name: 'cover_pic', type: 'TEXT' },
                    { name: 'location', type: 'TEXT' },
                    { name: 'bio', type: 'TEXT' }
                ]);
            }
        });

        // 2. Cotizaciones Table
        db.run(`CREATE TABLE IF NOT EXISTS Cotizaciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            device_model TEXT,
            problem_description TEXT,
            estimated_price REAL,
            status TEXT DEFAULT 'Pendiente',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES Usuarios(id)
        )`, (err) => {
            if (err) {
                console.error('Error creating table Cotizaciones:', err.message);
            } else {
                console.log('Table "Cotizaciones" ready.');
            }
        });
    });
}

function addColumnsIfNotExist(tableName, columns) {
    columns.forEach(col => {
        db.run(`ALTER TABLE ${tableName} ADD COLUMN ${col.name} ${col.type}`, (err) => {
            // Ignore error if column exists
            if (err && !err.message.includes('duplicate column')) {
                // console.log(`Column ${col.name} already exists or error: ${err.message}`);
            } else if (!err) {
                console.log(`Added column ${col.name} to ${tableName}`);
            }
        });
    });
}

module.exports = db;
