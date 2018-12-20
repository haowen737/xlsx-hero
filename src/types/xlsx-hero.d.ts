
interface XlsxRow {
  backfill: object
  backfillList: (() => object)[]
}

interface XlsxHeroProps {
  name: any
  maxlength: any
  first: boolean
  rowAppend: any
  needBackFill: boolean
  columns: any
  allowEmpty: boolean
}

interface AbstractProcessResult {
  validateCost?: number
  parseCost?: number
}

interface ValidateResult {
  data: XlsxRow[] | []
  detail: AbstractProcessResult | void
}

interface GenerateOpt {
  raw?: boolean
}