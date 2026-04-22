import express from "express"
import axios from "axios"

const router = express.Router()

// 🧠 CACHE (se mantiene dentro de esta ruta)
let liveCache = []
let hasLive = false
let interval = null
let isFetching = false

const TIMEZONE = process.env.TIMEZONE || "America/Argentina/Buenos_Aires"

// 🔴 FETCH LIVE
const fetchLiveMatches = async (allowedLeagues) => {
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
const startPolling = (allowedLeagues) => {
  if (interval) clearInterval(interval)

  const delay = hasLive ? 60000 : 300000

  interval = setInterval(async () => {
    await fetchLiveMatches(allowedLeagues)
    startPolling(allowedLeagues)
  }, delay)
}

// 🚀 INIT
export const initLivePolling = async (allowedLeagues) => {
  await fetchLiveMatches(allowedLeagues)
  startPolling(allowedLeagues)
}

// 🔴 ENDPOINT
router.get("/", async (req, res) => {
  const ENABLE_POLLING = process.env.ENABLE_POLLING === "true"

  try {
    if (ENABLE_POLLING) {
      if (liveCache.length === 0) {
        await fetchLiveMatches(req.allowedLeagues)
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
      req.allowedLeagues.includes(match.league.id)
    )

    res.json(filtered)

  } catch (error) {
    console.error("LIVE endpoint error:", error.response?.data || error.message)
    res.status(500).json({ error: "Error fetching live matches" })
  }
})

export default router