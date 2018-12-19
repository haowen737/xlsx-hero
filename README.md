# xlsx-hero
🎃 XLSX import & export helper base on object schema in nodejs

# Check Example
```
cd example
npm i
node index.js
```

### Usage

```
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

  // generate template sheet base on schema
  const tempalte = importHero.buildTemplate('my template')

  // validate import file
  const { data, detail } = await importHero.validate(file)

  // generate sheet
  const buffer = exportHero.generateSheet(result)

  // set raw = true to generate array
  const data = exportHero.generateSheet(result, true)

```