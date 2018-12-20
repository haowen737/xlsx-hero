
interface XlsxRow {
  backfill: object
  backfillList: (() => object)[]
}

interface XlsxHeroProps {
  name: any
  maxlength: any
  first: boolean
  rowAppend: any
  columns: any
  allowEmpty: boolean
}

interface AbstractProcessResult {
  cost?: number
}

interface ValidateResult {
  data: XlsxRow[] | []
  detail: AbstractProcessResult | void
}

interface GenerateOpt {
  raw?: boolean
}