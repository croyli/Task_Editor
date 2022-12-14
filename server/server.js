import express from 'express'
import path from 'path'
import cors from 'cors'
import sockjs from 'sockjs'
import cookieParser from 'cookie-parser'

import config from './config'
import Html from '../client/html'

require('colors')

let connections = []

const port = process.env.PORT || 2112
const server = express()

const middleware = [
  cors(),
  express.static(path.resolve(__dirname, '../dist')),
  express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }),
  express.json({ limit: '50mb', extended: true }),
  cookieParser()
]

const { stat, readFile } = require("fs").promises

middleware.forEach((it) => server.use(it))




server.get('/api/v1/tasks/:category', async (req, res) => {
  const { category } = req.params
  const Read = await readFile(`${__dirname}/tasks/${category}.json`, 'utf8')
    .then((text) => text)
    .catch((err) => console.log(err))
  const Stat = await stat(`${__dirname}/tasks.json`)
    .then(() => Read)
    .catch((err) => console.log(err))
  res.json((Stat))
})


server.get('/', (req, res) => {
  res.send(`
    <h2>This is SkillCrucial Express Server!</h2>
    <h3>Client hosted at <a href="http://localhost:8087">localhost:8087</a>!</h3>
  `)
})

server.get('/*', (req, res) => {
  const initialState = {
    location: req.url
  }

  return res.send(
    Html({
      body: '',
      initialState
    })
  )
})

server.use('/api/', (req, res) => {
  res.status(404)
  res.end()
})

const app = server.listen(port)

if (config.isSocketsEnabled) {
  const echo = sockjs.createServer()
  echo.on('connection', (conn) => {
    connections.push(conn)
    conn.on('data', async () => {})

    conn.on('close', () => {
      connections = connections.filter((c) => c.readyState !== 3)
    })
  })
  echo.installHandlers(app, { prefix: '/ws' })
}
console.log(`Serving at http://localhost:${port}`)




// [
//   {
//     taskId: '2WEKaVNO',
//     title: 'Task',
//     _isDeleted: false,
//     _createdAt: 14135235,
//     _deletedAt: 14135235,
//     status: 'done'
//   }
// ]