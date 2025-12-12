const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '../public/uploads');
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Middleware
app.set('trust proxy', true);
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// === ROUTES ===

// DEBUG ENDPOINT
app.get('/api/debug/users', (req, res) => {
    db.all("SELECT id, email, username FROM Usuarios", [], (err, rows) => {
        if (err) return res.json({ error: err.message });
        res.json({ 
            dbPath: require('./database').filename, // unavailable via require, but lets try to just fetch rows
            count: rows.length,
            users: rows 
        });
    });
});


// --- AUTH ---

app.post('/api/register', async (req, res) => {
    const { email, password, age } = req.body;
    let ip = req.ip || req.connection.remoteAddress;
    if (ip.substr(0, 7) == "::ffff:") ip = ip.substr(7);

    if (!email || !password) return res.status(400).json({ error: "Email y contraseña requeridos" });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // Default username from email
        const username = email.split('@')[0];
        
        const sql = `INSERT INTO Usuarios (email, password, ip_address, edad, username, fullname) VALUES (?, ?, ?, ?, ?, ?)`;
        db.run(sql, [email, hashedPassword, ip, age, username, username], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    if (err.message.includes('email')) return res.status(409).json({ error: "El correo ya está registrado" });
                    if (err.message.includes('username')) return res.status(409).json({ error: "El usuario ya existe" });
                }
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: "Usuario registrado con éxito", userId: this.lastID });
        });
    } catch (err) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email y contraseña requeridos" });

    const sql = `SELECT * FROM Usuarios WHERE email = ?`;
    db.get(sql, [email], async (err, user) => {
        if (err) return res.status(500).json({ error: "Error en el servidor" });
        if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

        const match = await bcrypt.compare(password, user.password);
        if (match) {
            // Return user details ensuring sensitive info is stripped if needed, but for now sending what's safe
            res.json({ 
                message: "Login exitoso", 
                user: { 
                    id: user.id, 
                    email: user.email,
                    username: user.username,
                    fullname: user.fullname,
                    profile_pic: user.profile_pic,
                    cover_pic: user.cover_pic
                } 
            });
        } else {
            res.status(401).json({ error: "Credenciales inválidas" });
        }
    });
});

// --- PROFILE ---

// Get Profile by User ID (passed via query or header for simplicity in this mono-repo setup)
// In a real app we'd use JWT middleware. Here we'll trust the client sending ID or Email safely for demo.
// Let's rely on query param ?id=X since we don't have JWT implemented yet.
// Get Profile
// ...
app.get('/api/profile', (req, res) => {
    const userId = req.query.id;
    console.log(`[GET /api/profile] Request for ID: ${userId}`);
    if (!userId) return res.status(400).json({ error: "User ID missing" });

    db.get("SELECT id, email, username, fullname, profile_pic, cover_pic, location, bio, fecha_registro, numero_cotizaciones FROM Usuarios WHERE id = ?", [userId], (err, row) => {
        if (err) {
            console.error(`[GET /api/profile] DB Error: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            console.warn(`[GET /api/profile] User not found: ${userId}`);
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        res.json(row);
    });
});

// ...

// Upload images
app.post('/api/upload', upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), (req, res) => {
    const userId = req.body.userId;
    console.log(`[POST /api/upload] User: ${userId}, Files:`, req.files);
    
    if (!userId) {
        console.error('[POST /api/upload] Missing User ID');
        return res.status(400).json({ error: "User ID missing" });
    }

    let updates = [];
    let params = [];

    if (req.files && req.files['avatar']) {
        updates.push("profile_pic = ?");
        params.push('uploads/' + req.files['avatar'][0].filename);
    }
    if (req.files && req.files['cover']) {
        updates.push("cover_pic = ?");
        params.push('uploads/' + req.files['cover'][0].filename);
    }

    if (updates.length > 0) {
        params.push(userId);
        const sql = `UPDATE Usuarios SET ${updates.join(', ')} WHERE id = ?`;
        db.run(sql, params, function(err) {
            if (err) {
                console.error(`[POST /api/upload] DB Update Error: ${err.message}`);
                return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0) {
                 console.warn(`[POST /api/upload] No rows updated. User ID ${userId} might not exist.`);
                 return res.status(404).json({ error: "Usuario no existe" });
            }
            res.json({ message: "Imágenes actualizadas", files: req.files });
        });
    } else {
        res.json({ message: "No se subieron archivos" });
    }
});

// --- QUOTES ---

app.post('/api/quotes', upload.array('images', 3), (req, res) => {
    // Note: req.body structure depends on FormData
    const { userId, device, brand, issue, estimatedPrice } = req.body; // status defaults to 'Pendiente'
    
    // Convert undefined/null string to actual user id if logged in, else null
    const uId = (userId && userId !== 'null' && userId !== 'undefined') ? userId : null;
    
    // In a real app we'd save the image paths too. For now let's just create the Quote record.
    
    const sql = `INSERT INTO Cotizaciones (user_id, device_model, problem_description, estimated_price, status) VALUES (?, ?, ?, ?, ?)`;
    // We store Brand + Device in device_model
    const fullDevice = `${device} - ${brand}`;
    
    // Basic price logic for demo (backend override)
    // In strict world, backend calculates price.
    const price = estimatedPrice || 0; 

    db.run(sql, [uId, fullDevice, issue, price, 'Pendiente'], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Update user quote count if registered
        if (uId) {
            db.run("UPDATE Usuarios SET numero_cotizaciones = numero_cotizaciones + 1 WHERE id = ?", [uId]);
        }

        res.status(201).json({ message: "Cotización recibida", id: this.lastID });
    });
});

app.get('/api/user/quotes', (req, res) => {
    const userId = req.query.id;
    if (!userId) return res.status(400).json({ error: "User ID missing" });

    db.all("SELECT * FROM Cotizaciones WHERE user_id = ? ORDER BY created_at DESC", [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});


// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
