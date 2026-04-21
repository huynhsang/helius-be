import { createApp } from './app'

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000

const app = createApp()

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
