# xlsx-hero
🎃 XLSX import & export helper base on object schema in nodejs

## Install
```shell
npm i xlsx-hero --save
```

## Usage

### Build Hero
```js
  import { XlsxHero } from '../utils/xlsxHero'

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

  // construct xlsxHero base on schema
  const importHero = new XlsxHero(schema)
```

### Api
- #### buildTemplate
Generate template sheet base on schema
```js
  const tempalte = importHero.buildTemplate('my template')
```

- #### validate
Validate import file
```js
  const { data, detail } = await importHero.validate(file)
```

- #### generateSheet

Generate worksheet buffer
```js
  const buffer = exportHero.generateSheet(result)
```
Generate work sheet array data
```js
  const opts = { raw: true }
  const data = exportHero.generateSheet(result, opts)
```

### Schema constructor
```js
Schema: {

  // name of your sweet xslx 
  name: any

  // allow empty row in your file. default true
  // otherwise xlsx hero validator will throw an error when validate empty row
  allowEmpty: boolean
  
  // 在schema中指定需要backfill才会调用每一个单元格的backfill方法
  needBackFill: boolean

  // additional object that needs inject to each row
  rowAppend: any

  // throw an error when met first error during validation
  first: boolean

  // max length, xlsx will throw an error if file length larger than maxlength
  maxlength: any

  // each row's schema
  columns: any
}
```

### Try it out
```shell
cd example
npm i
node index.js
```
Then open http://localhost:3008/
*(Make sure you have node v7.6.0 or higher installed for ES2015 and async function support)*
