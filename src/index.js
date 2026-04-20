import express from "express"
import cors from "cors"
import axios from "axios"
import dotenv from "dotenv"

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 3000
const ENABLE_POLLING = process.env.ENABLE_POLLING === "true"
const TIMEZONE = process.env.TIMEZONE || "America/Argentina/Buenos_Aires"

// 🧠 Ligas permitidas
const allowedLeagues = [
  128, 39, 140, 135, 78, 61, 262, 253, 2, 3, 13, 11, 143
]

// 🧠 CACHE
let liveCache = []
let hasLive = false
let interval = null
let isFetching = false

// 🔴 FETCH LIVE
const fetchLiveMatches = async () => {
  if (isFetching) return
  isFetching = true

  try {
    const response = await axios.get(`${process.env.API_URL}/fixtures`, {
      params: {
        live: "all",
        timezone: TIMEZONE
      },
      headers: {
        "x-apisports-key": process.env.API_KEY
      }
    })

    const matches = response.data.response ?? []

    const filtered = matches.filter(match =>
      allowedLeagues.includes(match.league.id)
    )

    liveCache = filtered
    hasLive = filtered.length > 0

  } catch (error) {
    console.error("LIVE error:", error.response?.data || error.message)
  } finally {
    isFetching = false
  }
}

// ⏱ POLLING DINÁMICO
const startPolling = () => {
  if (interval) clearInterval(interval)

  const delay = hasLive ? 60000 : 300000

  interval = setInterval(async () => {
    await fetchLiveMatches()
    startPolling()
  }, delay)
}

// 🚀 INIT SOLO SI ESTÁ ACTIVADO
const init = async () => {
  await fetchLiveMatches()
  startPolling()
}

if (ENABLE_POLLING) {
  init()
}

// 🔴 ENDPOINT LIVE (híbrido)
app.get("/live", async (req, res) => {
  try {
    if (ENABLE_POLLING) {
      if (liveCache.length === 0) {
        await fetchLiveMatches()
      }
      return res.json(liveCache)
    }

    const response = await axios.get(`${process.env.API_URL}/fixtures`, {
      params: {
        live: "all",
        timezone: TIMEZONE
      },
      headers: {
        "x-apisports-key": process.env.API_KEY
      }
    })

    const matches = response.data.response ?? []

    const filtered = matches.filter(match =>
      allowedLeagues.includes(match.league.id)
    )

    res.json(filtered)

  } catch (error) {
    console.error("LIVE endpoint error:", error.response?.data || error.message)
    res.status(500).json({ error: "Error fetching live matches" })
  }
})

// 🟡 ENDPOINT TODAY
app.get("/today", async (req, res) => {
  try {
    const { date, timezone } = req.query

    if (!date) {
      return res.status(400).json({ error: "date es requerido" })
    }

    const response = await axios.get(`${process.env.API_URL}/fixtures`, {
      params: {
        date,
        timezone: timezone || TIMEZONE
      },
      headers: {
        "x-apisports-key": process.env.API_KEY
      }
    })

    const matches = response.data.response ?? []

    const filtered = matches.filter(match =>
      allowedLeagues.includes(match.league.id)
    )

    res.json(filtered)

  } catch (error) {
    console.error("TODAY error:", error.response?.data || error.message)
    res.status(500).json({ error: "Error fetching today matches" })
  }
})

// 🟢 HEALTH CHECK (opcional pero recomendado)
app.get("/health", (req, res) => {
  res.json({ status: "ok" })
})

// 🚀 SERVER
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`)
})
