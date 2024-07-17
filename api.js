const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const mysql = require('mysql');

const app = express();

app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:5173', // Allow requests from this origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow these methods
    allowedHeaders: ['Content-Type', 'Authorization'] // Allow these headers
}));

const PORT = process.env.PORT || 1406;
const JWT_SECRET = 'dheenavicky123';
const TOKEN_EXPIRATION = '1d';

// MySQL database connection setup
const db = mysql.createConnection({
    host: 'b6sglcjq9ocpqjyudrai-mysql.services.clever-cloud.com',
    user: 'urdolnnewhrckj0q',
    password: 'K3PhRmTVpgmdBl9jbQWA',
    database: 'b6sglcjq9ocpqjyudrai'
});

db.connect(err => {
    if (err) {
        console.error('Database connection error:', err);
        return;
    }
    console.log('Connected to MySQL');
});

// Routes
app.get('/owner-details/:name', (req, res) => {
    const ownerName = req.params.name.toLowerCase().split(" ").join("");

    const sql = 'SELECT * FROM owner WHERE owner_name = ?';
    db.query(sql, [ownerName], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Failed to fetch owner details');
        } else if (results.length === 0) {
            res.status(404).send('Owner not found');
        } else {
            res.status(200).json(results[0]);
        }
    });
});

app.post("/owner-login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const query = `
            SELECT owner_name, owner_password 
            FROM owner
            WHERE owner_name = ?
        `;

        db.query(query, [username.toLowerCase().split(" ").join("")], async (err, results) => {
            if (err) {
                console.error('Database query error:', err);
                res.status(500).send('Database query error');
                return;
            }

            if (results.length === 0) {
                res.status(404).send('User Not Found');
                return;
            }

            const owner = results[0];

            if (password !== owner.owner_password) {
                res.status(401).send('Password Incorrect');
                return;
            }

            const token = jwt.sign(
                { username: owner.owner_name },
                JWT_SECRET,
                { expiresIn: TOKEN_EXPIRATION }
            );

            res.json({ token });
        });
    }
    catch (err) {
        console.error('Server error:', err);
        res.status(500).send('Server error');
    }
});

app.post('/employee-register', async (req, res) => {
    const { username, password, mobile_number } = req.body;

    // Validation
    if (!username || !password || !mobile_number) {
        return res.status(400).send('Please provide all required fields');
    }

    const sql = 'INSERT INTO employee (employee_name, employee_password, employee_number) VALUES (?, ?, ?)';
    db.query(sql, [username.toLowerCase().split(" ").join(""), password, mobile_number], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Failed to register employee');
        } else {
            res.status(201).send('Employee registered successfully');
        }
    });
});

app.get('/employee-details/:name', (req, res) => {
    const employeeName = req.params.name.toLowerCase().split(" ").join("");
    
    const sql = 'SELECT * FROM employee WHERE employee_name = ?';
    db.query(sql, [employeeName], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Failed to fetch employee details');
        } else if (results.length === 0) {
            res.status(404).send('Employee not found');
        } else {
            res.status(200).json(results[0]);
        }
    });
});

app.post('/employee-login', (req, res) => {
    const { username, password } = req.body;

    const sql = 'SELECT * FROM employee WHERE employee_name = ?';
    db.query(sql, [username.toLowerCase().split(" ").join("")], async (err, results) => {
        if (err) {
            console.error(err);
            res.status(404).send("User Doesn't Exist");
        } else if (results.length > 0) {
            const storedPassword = results[0].employee_password;

            if (password === storedPassword) {
                const token = jwt.sign({ username: results[0].employee_name }, JWT_SECRET, { expiresIn: '1h' });
                res.json({ token });
            } else {
                res.status(400).send('Password did not match');
            }
        } else {
            res.status(402).send('Invalid credentials');
        }
    });
});

app.get('/products', (req, res) => {
    db.query('SELECT * FROM products', (err, rows) => {
        if (err) {
            console.error('Error fetching products: ' + err);
            res.status(500).json({ error: 'Error fetching products' });
            return;
        }
        res.json(rows);
    });
});

app.post('/products-entry', (req, res) => {
    const { product, price } = req.body;
    const query = 'INSERT INTO products (product, price) VALUES (?, ?)';
    db.query(query, [product, parseInt(price)], (err, result) => {
        if (err) {
            console.error('Error adding product: ' + err);
            res.status(500).json({ error: 'Error adding product' });
            return;
        }
        res.json({ message: 'Product added successfully', id: result.insertId });
    });
});

app.put('/products/:id', (req, res) => {
    const productId = req.params.id;
    const { product, price } = req.body;

    const query = 'UPDATE products SET product = ?, price = ? WHERE id = ?';
    db.query(query, [product, parseInt(price), productId], (err, result) => {
        if (err) {
            console.error('Error updating product: ' + err);
            res.status(500).json({ error: 'Error updating product' });
            return;
        }
        res.json({ message: 'Product updated successfully', id: productId });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
