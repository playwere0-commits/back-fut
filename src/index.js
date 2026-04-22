import express from "express"
import cors from "cors"
import dotenv from "dotenv"

import liveRoutes, { initLivePolling } from "./routes/live.js"
import todayRoutes from "./routes/today.js"
import matchRoutes from "./routes/match.js"

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 3000

// 🧠 Ligas permitidas
const allowedLeagues = [
  128, 39, 140, 135, 78, 61, 262, 253, 2, 3, 13, 11, 143
]

// 👉 Middleware para compartir ligas en todas las rutas
app.use((req, res, next) => {
  req.allowedLeagues = allowedLeagues
  next()
})

// 🚀 RUTAS
app.use("/live", liveRoutes)
app.use("/today", todayRoutes)
app.use("/match", matchRoutes)

// 🟢 HEALTH
app.get("/health", (req, res) => {
  res.json({ status: "ok" })
})

// 🚀 INIT POLLING
if (process.env.ENABLE_POLLING === "true") {
  initLivePolling(allowedLeagues)
}

// 🚀 SERVER
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`)
})
