/* eslint-disable import/no-duplicates */

import express from 'express'
import path from 'path'
import cors from 'cors'
import bodyParser from 'body-parser'
import sockjs from 'sockjs'
import axios from 'axios'

import cookieParser from 'cookie-parser'
import Html from '../client/html'

// TODO: Add remaining functions
const { writeFile } = require('fs').promises

let connections = []

const port = process.env.PORT || 3000
const server = express()

server.use(cors())

server.use(express.static(path.resolve(__dirname, '../dist/assets')))
server.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }))
server.use(bodyParser.json({ limit: '50mb', extended: true }))

server.use(cookieParser())

// Adding headers
express().use('/*', (req, res) => {
  res.set('x-skillcrucial-user', '9465eaa4-071c-4ea3-a592-b54c6deb3f7f')
  res.set('Access-Control-Expose-Headers', 'X-SKILLCRUCIAL-USER')
})

const saveToUsersFile = (text) => {
  writeFile(`${__dirname}/users.json`, text, { encoding: 'utf8' })
}

server.get('/api/v1/users/', async (req, res) => {
  const { data: users } = await axios('https://jsonplaceholder.typicode.com/users')
  saveToUsersFile(JSON.stringify(users))
  res.json(users)
})

server.use('/api/', (req, res) => {
  res.status(404)
  res.end()
})

const echo = sockjs.createServer()
echo.on('connection', (conn) => {
  connections.push(conn)
  conn.on('data', async () => {})

  conn.on('close', () => {
    connections = connections.filter((c) => c.readyState !== 3)
  })
})

server.get('/', (req, res) => {
  // const body = renderToString(<Root />);
  const title = 'Server side Rendering'
  res.send(
    Html({
      body: '',
      title
    })
  )
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

const app = server.listen(port)

echo.installHandlers(app, { prefix: '/ws' })

// eslint-disable-next-line no-console
console.log(`Serving at http://localhost:${port}`)
