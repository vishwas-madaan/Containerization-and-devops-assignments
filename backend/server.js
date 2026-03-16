const express = require("express")
const { Pool } = require("pg")

const app = express()
app.use(express.json())

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  port: 5432
})

// POST user
app.post("/users", async (req, res) => {
  try {
    const { name } = req.body

    const result = await pool.query(
      "INSERT INTO users(name) VALUES($1) RETURNING *",
      [name]
    )

    res.json(result.rows[0])
  } catch (err) {
    console.error("POST error:", err)
    res.status(500).send("Database error")
  }
})

// GET users
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users")
    res.json(result.rows)
  } catch (err) {
    console.error("GET error:", err)
    res.status(500).send("Database error")
  }
})

// Health check
app.get("/health", (req, res) => {
  res.send("Server running")
})

// Start server
app.listen(3000, "0.0.0.0", () => {
  console.log("Server started")
})
    
