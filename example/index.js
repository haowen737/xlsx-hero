const Koa = require('koa')
const path = require('path')
const Router = require('koa-router')
const static = require('koa-static')
const multer = require('koa-multer')
const XlsxHero = require('../lib/xlsxHero').default

const app = new Koa();
const router = new Router()
const upload = multer()

const schema = {
  name: 'my xlsx',
  maxlength: 1000,
  first: false,
  allowEmpty: true,
  columns: [{
    title: 'title1',
    key: 'k1'
  }, {
    title: 'title2',
    key: 'k2'
  }]
}

router.post('/upload', upload.any(), async (ctx) => {
  const { req } = ctx
  const file = req.files[0]
  const hero = new XlsxHero(schema)
  const data = await hero.validate(file)

  ctx.body = {
    list: data,
    detail: { cost: 1 }
  }
})

app
  .use(router.routes())
  .use(router.allowedMethods())
  .use(static('view'))
  .listen(3008)

console.log('server is up at port 3008')