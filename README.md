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

  const Schema = {
    name: 'my xlsx',
    maxlength: 1000,
    first: false,
    allowEmpty: true,
    columns: [{
      title: 'name',
      key: 'userName',
      rules: [{
        required: true
      }]
    }, {
      title: 'email',
      key: 'userEmail',
      rules: [{
        validator (rule, value, callback, source, options) {
          // test if email address already exists in a database
          // and add a validation error to the errors array if it does
          callback(errors)
        }
      }]
    }]
  }

  // construct xlsxHero base on schema
  const importHero = new XlsxHero(schema)
```
### Schema constructor

##### ```schema``` property
| key | description | type | default |
| :------| :------ | :------| :----- |
| name | name of your sweet xslx (you may use it for export & template generate) | string ||
| maxlength | xlsx will throw an error if file length larger than maxlength | number ||
| first | throw an error when met first error during validation | boolean | false |
| allowEmpty | allow empty row in your file, otherwise xlsx hero validator will throw an error when validate empty row | boolean | false |
| rowAppend | additional object that needs inject to each row | object ||
| needBackFill | 在schema中指定需要backfill才会调用每一个单元格的backfill方法 | boolean | false |
| columns | each row's schema | Row[] |  |

> Row: Cell[], Each row was an Array of Cell set

##### Each ```Cell``` property
| key | description | type |
| :------| :------ | :------|
| title| title for  | string |
| key| key | string |
| rules | validate rules | object[] |
| backfill | backfill object to this row, base on current cell value | Function(row) |
| render | render funtion | Function(value: CurrentCellValue, row: CurrentRow) |

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
##### ```detail``` properties

  | key | description |
  | :-----| :------ |
  | validateCost | validate whole xlsx file cost time |
  | parseCost | parse whole xlsx file cost time |



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


### Try it out
```shell
cd example
npm i
node index.js
```
Then open http://localhost:3008/
*(For server: Make sure you have node v7.6.0 or higher installed for ES2015 and async function support)*
*(For client: Make sure your browser support Fetch & Promise && DO NOT USE IE8 OR BELOW)*
Enjoy :)