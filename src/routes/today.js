import express from "express"
import axios from "axios"

const router = express.Router()

const TIMEZONE = process.env.TIMEZONE || "America/Argentina/Buenos_Aires"

router.get("/", async (req, res) => {
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
      req.allowedLeagues.includes(match.league.id)
    )

    res.json(filtered)

  } catch (error) {
    console.error("TODAY error:", error.response?.data || error.message)
    res.status(500).json({ error: "Error fetching today matches" })
  }
})

export default router