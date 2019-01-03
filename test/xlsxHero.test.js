const xlsx = require('node-xlsx')
const request = require('supertest')
const Koa = require('koa')
const fs = require('fs')
const path = require('path')
const multer = require('koa-multer')
const Router = require('koa-router')
const http = require('http')

const XlsxHero = require('../lib/xlsxHero').default
const TEST_FILE_PATH = path.join(__dirname, './test.xlsx')
const TEST_PATTERN_FILE_PATH = path.join(__dirname, './excel/test.pattern.xlsx')
const testSchema = {
  name: '测试模板',
  maxlength: 1000,
  columns: [{
    title: '渠道ID', key: 'platformId',
  }, {
    title: '商家渠道ID', key: 'userId'
  }, {
    title: '商家名称', key: 'shopTitle'
  }]
}

const ColumsForValidate = [
  {
    title: '渠道ID', key: 'platformId',
    rules: [{
      validator: (rule, value, cb) => { cb('test error') }
    }],
    backfill: (val) => ({ backfilled: true })
  }, {
    title: '商家渠道ID', key: 'userId'
  }, {
    title: '商家名称', key: 'shopTitle'
  }
]

const ColumsForBackfill = [
  {
    title: '渠道ID', key: 'platformId',
    backfill: (val) => ({ backfilled: true })
  }, {
    title: '商家渠道ID', key: 'userId'
  }, {
    title: '商家名称', key: 'shopTitle'
  }
]

const ColumsForValidateByPattern = [
  {
    title: '姓名', key: 'name'
  }, {
    title: 'email', key: 'email', rules: [{
      type: 'email'
    }]
  }
]


// afterAll(() => setTimeout(() => process.exit(0), 1000))

describe('xlsxHero', () => {

  it('can read file from request', async (done) => {
    const app = new Koa()
    const router = new Router()
    const upload = multer()
    const server = app.listen()
    router.post('/', upload.any(), async (ctx) => {
      const file = ctx.req.files ? ctx.req.files[0] : null
      const hero = new XlsxHero(testSchema)
      const result = await hero.validate(file)
      ctx.body = result
    })
    app.use(router.routes())
    const result = await request(server)
      .post('/')
      .attach('file', TEST_PATTERN_FILE_PATH)

    expect(result.body.data).toHaveLength(2)
    server.close()
    done()
  })

  test('can build template in raw', () => {
    const matchObject = { name: 'untitled', data: [ [ '渠道ID', '商家渠道ID', '商家名称' ] ] }
    const hero = new XlsxHero(testSchema)
    const template = hero.buildTemplate()
    const result = xlsx.parse(template.data, { raw: false })[0]
    expect(result).toMatchObject(matchObject)
  })

  test('can generate sheet for export', async () => {
    const source = [
      { platformId: 1, userId: 1, shopTitle: 'shop1' },
      { platformId: 2, userId: 2, shopTitle: 'shop2' }
    ]

    const match = [
      [ '渠道ID', '商家渠道ID', '商家名称' ],
      [ 1, 1, 'shop1' ],
      [ 2, 2, 'shop2' ]
    ]
    const hero = new XlsxHero(testSchema)
    const result = await hero.generateSheet(source, { raw: true })
    expect(result).toMatchObject(match)
  })

  // test('can use schema name as export file name', async () => {
  //   const name = 'Testing file name'
  //   const schema = Object.assign({}, testSchema, { name })
  //   const hero = new XlsxHero(schema)
  //   const result = xlsx.parse(buffer, { raw: false })[0]
  //   const buffer = hero.generateSheet(result)
  //   expect(result.name).toMatch(name)
  // })

  test('can validate field by pattern', async () => {
    const schema = Object.assign({}, testSchema, {
      first: true,
      columns: ColumsForValidateByPattern
    })
    const hero = new XlsxHero(schema)
    const file = fs.readFileSync(TEST_PATTERN_FILE_PATH)
    try {
      await hero.validate({ buffer: file })
    } catch (err) {
      const { message } = err
      expect(JSON.parse(message)).toMatchObject(
        [{"content": [{"field": "email", "message": "email is not a valid email"}], "row": 0}]
      )
    }
  })

  test('can validate field and return in first error', async () => {
    const schema = Object.assign({}, testSchema, {
      first: true,
      columns: ColumsForValidate
    })
    const hero = new XlsxHero(schema)
    const file = fs.readFileSync(TEST_PATTERN_FILE_PATH)
    try {
      await hero.validate({ buffer: file })
    } catch (err) {
      const { message } = err
      expect(JSON.parse(message)).toMatchObject(
        [{content: [{field: 'platformId', message: 'test error'}], row: 0}]
      )
    }
  })
  
  test('can validate field and return all error', async () => {
    const schema = Object.assign({}, testSchema, {
      first: false,
      columns: ColumsForValidate
    })
    const hero = new XlsxHero(schema)
    const file = fs.readFileSync(TEST_FILE_PATH)
    try {
      await hero.validate({ buffer: file })
    } catch (err) {
      const { message } = err
      expect(JSON.parse(message)).toMatchObject(
        [
          {content: [{field: 'platformId', message: 'test error'}], row: 0},
          {content: [{field: 'platformId', message: 'test error'}], row: 1}
        ]
      )
    }
  })

  test('can validate by async', async () => {
    const asyncValid = () => new Promise((resolve, reject) => {
      setTimeout(() => {
        reject('async valid failed')
      }, 100)
    })
    const schema = Object.assign({}, testSchema, {
      first: true,
      columns: [{
        title: '渠道ID', key: 'platformId',
        rules: [{
          validator: async (rule, value, cb) => {
            asyncValid().catch(err => { cb(err) })
          }
        }]
      }]
    })

    const hero = new XlsxHero(schema)
    const file = fs.readFileSync(TEST_FILE_PATH)
    try {
      await hero.validate({ buffer: file })
    } catch (err) {
      console.log(err)
      expect(err).toHaveProperty(
        'message', [
          {content: [{field: 'platformId', message: 'async valid failed'}], row: 0},
        ]
      )
    }
  })

  test('can use backfill to field', async () => {
    const schema = Object.assign({}, testSchema, {
      first: true,
      needBackFill: true,
      columns: ColumsForBackfill
    })
    const hero = new XlsxHero(schema)
    const file = fs.readFileSync(TEST_FILE_PATH)
    const { data } = await hero.validate({ buffer: file })
    expect(data[0]).toHaveProperty('backfilled', true)
    expect(data[1]).toHaveProperty('backfilled', true)
  })

  test('can append rowAppend to each row', async () => {
    const schema = Object.assign({}, testSchema, {
      first: true,
      rowAppend: {
        appenedKey: 'appenedValue'
      }
    })
    const hero = new XlsxHero(schema)
    const file = fs.readFileSync(TEST_FILE_PATH)
    const { data } = await hero.validate({ buffer: file })
    expect(data[0]).toHaveProperty('appenedKey', 'appenedValue')
    expect(data[1]).toHaveProperty('appenedKey', 'appenedValue')
  })

  test('throw an error if empty row exist', async () => {
    const schema = Object.assign({}, testSchema, {
      first: true,
      allowEmpty: false
    })
    const hero = new XlsxHero(schema)
    const file = fs.readFileSync(TEST_FILE_PATH)
    try {
      await hero.validate({ buffer: file })
    } catch (err) {
      expect(err.message).toMatch('第4行为空')
    }
  })

  test('can throw error when reach maxlenth', async () => {
    const schema = Object.assign({}, testSchema, {
      maxlength: 1
    })
    const hero = new XlsxHero(schema)
    const file = fs.readFileSync(TEST_FILE_PATH)
    try {
      await hero.validate({ buffer: file })
    } catch (err) {
      expect(err.message).toMatch('传表格行数最多为1条')
    }
  })

})

