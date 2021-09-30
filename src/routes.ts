import { Router } from 'express'
import { handleNlpRequest } from './scenario'

export const apiHookRout = Router()

apiHookRout.post('/api/hook', async (req, res) => {
  console.log('api/hook request')
  res.status(200).json(await handleNlpRequest(req.body))
})

apiHookRout.get('/api/hook', (req, res) => {
  console.log('api/hook GET request')
  res.status(200).json({message: 'this route need POST method'})
})