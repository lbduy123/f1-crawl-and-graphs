import { useState } from 'react'
import RaceTable from './RaceTable'
import { Dialog } from 'primereact/dialog'
import titles from '../title.json'
import BarChart from './BarChart'

export interface ChartData {
  csvData: Array<string[]>
  category: string
  year: string
  fileName: string
}

function App() {
  const [chartData, setChartData] = useState<ChartData>()
  const [visible, setVisible] = useState<boolean>(false);
  const [header, setHeader] = useState<string>('')

  function handleCsv({ csvData, category, year, fileName }: ChartData) {
    setChartData({ csvData, category, year, fileName })
    type yearKey = keyof typeof titles
    const _year = titles[year as yearKey]
    type categoryKey = keyof typeof _year
    const _category = _year[category as categoryKey]
    let title: string
    if (category !== 'Fastest Laps') {
      type nameKey = keyof typeof _category
      title = _category[`${fileName}.csv` as nameKey]
    } else title = _year[`${category}.csv` as categoryKey]
    setHeader(title)
    setVisible(true)
  }

  return (
    <>
      <RaceTable handleCsv={handleCsv}></RaceTable>
      {chartData ?
        <Dialog header={header} dismissableMask visible={visible} maximizable
          style={{ width: '90vw', height: '80vw' }} onHide={() => setVisible(false)}>
          <BarChart csvData={chartData.csvData} fileName={chartData.fileName} category={chartData.category} aspectRatio={0.3} />
        </Dialog> : <></>}
    </>
  )
}

export default App

