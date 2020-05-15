/* eslint-disable import/no-duplicates */

import express from 'express'
import path from 'path'
import cors from 'cors'
import bodyParser from 'body-parser'
import sockjs from 'sockjs'
import axios from 'axios'

import cookieParser from 'cookie-parser'
// import { object } from 'prop-types'
import Html from '../client/html'


// TODO: Add remaining functions - unlink!!!!
// const { readFile, writeFile, unlink } = require('fs').promises
const { readFile, writeFile, unlink } = require('fs').promises

// Adding headers	server.use(setHeaders)
express().use('/*', (req, res) => {	
  res.set('x-skillcrucial-user', '9465eaa4-071c-4ea3-a592-b54c6deb3f7f')	
  res.set('Access-Control-Expose-Headers', 'X-SKILLCRUCIAL-USER')	
})

const saveToUsersFile = (text) => {
  writeFile(`${__dirname}/users.json`, text, { encoding: 'utf8' })
}

const fileRead = async() => {
  return readFile(`${__dirname}/users.json`, { encoding: "utf8" })
  .then((data) => JSON.parse(data))
  .catch(async () => {
    const { data: users } = await axios('https://jsonplaceholder.typicode.com/users')
    await saveToUsersFile(users)
    return users 
  })
}

// Adding headers
// const setHeaders = (req, res, next) => {
//   res.set('x-skillcrucial-user', '9465eaa4-071c-4ea3-a592-b54c6deb3f7f')
//   res.set('Access-Control-Expose-Headers', 'X-SKILLCRUCIAL-USER')
//   return next()
// }

// const saveToUsersFile = async (users) => {
//   return writeFile(`${__dirname}/users.json`, JSON.stringify(users), { encoding: 'utf8' })
// }

// const fileRead = async() => {
//   return readFile(`${__dirname}/users.json`, { encoding: "utf8" })
//   .then((data) => JSON.parse(data))
//   .catch(async () => {
//     const { data: users } = await axios('https://jsonplaceholder.typicode.com/users')
//     await saveToUsersFile(users)
//     return users 
//   })
// }

let connections = []

const port = process.env.PORT || 3000
const server = express()

server.use(cors())

server.use(express.static(path.resolve(__dirname, '../dist/assets')))
server.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }))
server.use(bodyParser.json({ limit: '50mb', extended: true }))

server.use(cookieParser())

server.get('/api/v1/users/', async (req, res) => {
  const { data: users } = await axios('https://jsonplaceholder.typicode.com/users')	  
  saveToUsersFile(JSON.stringify(users))	
  res.json(users)
})

server.post('/api/v1/users/', async (req, res) => {
  const users = await fileRead()
  const newUserBody = req.body
  const userLength = users[users.length - 1].id
  newUserBody.id = userLength + 1
  const newUser = [... users, newUserBody]
  saveToUsersFile(newUser)
  res.json({ status: 'success', id: newUserBody.id })
})

server.patch('/api/v1/users/:userId', async (req, res) => {
  const users = await fileRead()
  const { userId } = req.params
  const newUserBody = req.body
  const newUsersArray = users.map((it) => (it.id === +userId ? Object.assign(it, newUserBody) : it))
  saveToUsersFile(newUsersArray)
  res.json({ status: 'success', id: userId })
})

server.delete('/api/v1/users/', async (req, res) => {
  const users = await fileRead()
  const { userId } = req.params
  users.splice(Number(userId) - 1, 1)
  saveToUsersFile(users)
  res.json({ status: 'success', id: Number(userId) })
})

server.delete('/api/v1/users/', async (req, res) => {
  unlink(`${__dirname}/users.json`) 
  res.json()
})

// server.use(setHeaders)

// server.get('/api/v1/users/', async (req, res) => {
//   const users = await fileRead()
//   res.json(users)
// })

// server.post('/api/v1/users/', async (req, res) => {
//   const users = await fileRead()
//   const newUserBody = req.body
//   const userLength = users[users.length - 1].id
//   newUserBody.id = userLength + 1
//   const newUser = [... users, newUserBody]
//   saveToUsersFile(newUser)
//   res.json({ status: 'success', id: newUserBody.id })
// })

// server.patch('/api/v1/users/:userId', async (req, res) => {
//   const users = await fileRead()
//   const { userId } = req.params
//   const newUserBody = req.body
//   const newUsersArray = users.map((it) => (it.id === +userId ? Object.assign(it, newUserBody) : it))
//   saveToUsersFile(newUsersArray)
//   res.json({ status: 'success', id: userId })
// })

// server.delete('/api/v1/users/', async (req, res) => {
//   const users = await fileRead()
//   const { userId } = req.params
//   users.splice(Number(userId) - 1, 1)
//   saveToUsersFile(users)
//   res.json({ status: 'success', id: Number(userId) })
// })

// server.delete('/api/v1/users/', async (req, res) => {
//   unlink(`${__dirname}/users.json`) 
//   res.json()
// })

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
