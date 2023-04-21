const express = require('express')
const cors = require('cors')
const app = express()
const mongoose = require('mongoose')
const User = require('./models/User')
const Post = require('./models/Post')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const salt = bcrypt.genSaltSync(10)
const cookieParser = require('cookie-parser')
const secret = 'ajkfdajfkddddk3ioeialalkjfda'
const multer = require('multer')
const uploadMiddleware = multer({ dest: 'uploads/' })
const fs = require('fs')
app.use(cors({ credentials: true, origin: 'http://localhost:3000' }))
app.use(express.json())
app.use(cookieParser())

app.use('/uploads', express.static(__dirname + '/uploads'))
app.post('/register', async (req, res) => {
  const { username, password } = req.body
  try {
    const reqDoc = await User.create({
      username,
      password: bcrypt.hashSync(password, salt),
    })
    res.json(reqDoc)
  } catch (error) {
    res.status(400).json(error)
  }
})

app.post('/login', async (req, res) => {
  const { username, password } = req.body
  const userDoc = await User.findOne({ username })
  if (!userDoc) {
    res.status(404).json('invalid')

    return
  }
  const passOK = bcrypt.compareSync(password, userDoc.password)
  if (passOK) {
    jwt.sign({ id: userDoc._id, username }, secret, {}, (err, token) => {
      if (err) {
        throw err
      }
      res.status(200).cookie('token', token).json({ id: userDoc._id, username })
    })
  } else {
    res.status(400).json({ message: 'Invalid Credentials' })
  }
})

app.get('/profile', async (req, res) => {
  const { token } = req.cookies
  if (!token) {
    return res.json('OK')
  }
  jwt.verify(token, secret, {}, (err, info) => {
    if (err) {
      throw err
    }
    res.json(info)
  })
})

app.post('/logout', async (req, res) => {
  res.clearCookie('token').json('OK')
})
//
app.get('/post', async (req, res) => {
  const posts = await Post.find({})
    .populate('author', ['username'])
    .sort({ createdAt: -1 })
    .limit(20)
  return res.json(posts)
})
app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
  const { originalname, path } = req.file
  const { token } = req.cookies
  const parts = originalname.split('.')
  const ext = parts[parts.length - 1]
  const newPath = path + '.' + ext
  fs.renameSync(path, newPath)
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) throw err
    const { title, summary, context } = req.body
    const postDoc = await Post.create({
      title,
      summary,
      context,
      cover: newPath,
      author: info.id,
    })
    res.json(postDoc)
  })
})

app.put('/post/', uploadMiddleware.single('file'), async (req, res) => {
  let newPath = null
  if (req.file) {
    const { originalname, path } = req.file

    const parts = originalname.split('.')
    const ext = parts[parts.length - 1]
    newPath = path + '.' + ext
    fs.renameSync(path, newPath)
  }

  const { token } = req.cookies
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) throw err
    const { id, title, summary, context } = req.body
    const postDoc = await Post.findById(id)
    const isAuthor = JSON.stringify(postDoc._id === info.id)
    if (!isAuthor) {
      return res.status(400).json('You are not the author')
    }
    await postDoc.updateOne({
      title,
      summary,
      context,
      cover: newPath ? newPath : postDoc.cover,
    })
    res.json(postDoc)
  })
})

app.get('/post/:id', async (req, res) => {
  const { id } = req.params
  const postDoc = await Post.findById(id).populate('author', ['username'])
  res.json(postDoc)
})

app.delete('/post/:id', async (req, res) => {
  const { id } = req.params

  const postDoc = await Post.findOneAndDelete({ _id: id })

  if (!postDoc) return res.status(404)
  res.status(200).json({ postDoc })
})
const start = () => {
  mongoose
    .connect(
      'mongodb+srv://anadabane81:Im1otngitw@anadabane.0dkzvwc.mongodb.net/?retryWrites=true&w=majority'
    )
    .then((result) => {
      console.log('DB started')
      app.listen(process.env.PORT || 4000, () => {
        console.log(
          'Listening on' + ' ' + process.env.PORT ? process.env.PORT : 4000
        )
      })
    })
    .catch((err) => {
      console.log(err)
    })
}
start()
