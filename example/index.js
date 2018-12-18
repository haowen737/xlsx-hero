const Koa = require('koa')
const path = require('path')
const Router = require('koa-router')
const static = require('koa-static')
const multer = require('koa-multer')

const app = new Koa();
const router = new Router()
const upload = multer()

router.post('/upload', upload.any(), (req, res, next) => {
  console.log(req.files)
  res.body = 'ok'
})

app
  .use(router.routes())
  .use(router.allowedMethods())
  .use(static('view'))
  .listen(3000)