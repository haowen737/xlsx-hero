const Reader = require('../lib/streamReader')
const XlsxHero = require('../lib/xlsxHero').default

describe('Reader', () => {
  it('can create readStream', async => {
    const reader = new Reader()
  })

  it('can receive message from worker when parse')

  it('can concat full xlsx', () => {})

  it('can validate each stream')

  it('can concat all validate error when read end')

})

describe('Writer', () => {
  it('can create writeStream', async done => {
    const reader = new Reader()
    reader.stream.on('data', function (chunk) {
      console.log('chunk', chunk)
    })

    reader.stream.on('end', function (chunk) {
      expect(result).toMatchObject(matchObject)
      done()
    })
  })

  it('can concat backfill', () => {})

  it('can concat each buffer', () => {})

  it('can create excel file on write end', () => {})

})