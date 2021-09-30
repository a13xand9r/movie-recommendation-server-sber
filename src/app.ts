import express from 'express'
import cors from 'cors'
import { apiHookRout } from './routes'
require('dotenv').config()

const PORT = process.env.PORT ?? 5000

const app = express()
app.use(express.json())
app.use(cors())
app.use(apiHookRout)

app.listen(PORT, () => {
  console.log('server started on port ', PORT)
})

app.get('/', (_, res) => {
  res.status(200).send('TV-Show recommendation server App')
})