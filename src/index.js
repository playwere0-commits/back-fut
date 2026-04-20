import express from "express"
import cors from "cors"
import axios from "axios"
import dotenv from "dotenv"

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const PORT = 3000

// 🧠 Ligas permitidas
const allowedLeagues = [
  128, // Liga Profesional Argentina
  39,  // Premier League
  140, // La Liga
  135, // Serie A
  78,  // Bundesliga
  61,  // Ligue 1
  262, // Liga MX
  253, // MLS
  2,   // Champions League
  3,   // Europa League
  13,  // Libertadores
  11,  // Sudamericana
  143  // Copa del Rey
]

// 🧠 CACHE
let liveCache = []
let hasLive = false
let interval = null

// 🔴 FETCH LIVE (desde API)
const fetchLiveMatches = async () => {
  try {
    const response = await axios.get(`${process.env.API_URL}/fixtures`, {
      params: {
        live: "all",
        timezone: "America/Argentina/Buenos_Aires"
      },
      headers: {
        "x-apisports-key": process.env.API_KEY
      }
    })

    const matches = response.data.response || []

    const filtered = matches.filter(match =>
      allowedLeagues.includes(match.league.id)
    )

    liveCache = filtered
    hasLive = filtered.length > 0

    console.log(
      `🔄 Live actualizados: ${liveCache.length} partidos | hasLive: ${hasLive}`
    )

  } catch (error) {
    console.error("Error LIVE:", error.response?.data || error.message)
  }
}

// ⏱ POLLING DINÁMICO
const startPolling = () => {
  if (interval) clearInterval(interval)

  const delay = hasLive ? 60000 : 300000 // 1 min o 5 min

  interval = setInterval(async () => {
    await fetchLiveMatches()
    startPolling() // 🔥 reajusta el intervalo dinámicamente
  }, delay)

  console.log(`⏱ Polling cada ${delay / 1000}s`)
}

// 🚀 INIT
const init = async () => {
  await fetchLiveMatches()
  startPolling()
}

init()

// 🔴 ENDPOINT LIVE (usa cache)
app.get("/live", (req, res) => {
  res.json(liveCache)
})

// 🟡 ENDPOINT TODAY (sin cache)
app.get("/today", async (req, res) => {
  try {
    const { date, timezone } = req.query

    if (!date) {
      return res.status(400).json({ error: "date es requerido" })
    }

    const response = await axios.get(`${process.env.API_URL}/fixtures`, {
      params: {
        date,
        timezone: timezone || "America/Argentina/Buenos_Aires"
      },
      headers: {
        "x-apisports-key": process.env.API_KEY
      }
    })

    const matches = response.data.response || []

    const filtered = matches.filter(match =>
      allowedLeagues.includes(match.league.id)
    )

    res.json(filtered)

  } catch (error) {
    console.error("Error TODAY:", error.response?.data || error.message)
    res.status(500).json({ error: "Error fetching today matches" })
  }
})

// 🚀 SERVER
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
})