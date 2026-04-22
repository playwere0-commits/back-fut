import express from "express"
import axios from "axios"

const router = express.Router()

router.get("/:id", async (req, res) => {
  const { id } = req.params

  try {
    const [fixtureRes, lineupRes, statsRes] = await Promise.all([
      axios.get(`${process.env.API_URL}/fixtures`, {
        params: { id },
        headers: {
          "x-apisports-key": process.env.API_KEY
        }
      }),
      axios.get(`${process.env.API_URL}/fixtures/lineups`, {
        params: { fixture: id },
        headers: {
          "x-apisports-key": process.env.API_KEY
        }
      }),
      axios.get(`${process.env.API_URL}/fixtures/statistics`, {
        params: { fixture: id },
        headers: {
          "x-apisports-key": process.env.API_KEY
        }
      })
    ])

    res.json({
      match: fixtureRes.data.response?.[0] || null,
      lineups: lineupRes.data.response || [],
      statistics: statsRes.data.response || []
    })

  } catch (error) {
    console.error("MATCH error:", error.response?.data || error.message)
    res.status(500).json({ error: "Error fetching match data" })
  }
})

export default router