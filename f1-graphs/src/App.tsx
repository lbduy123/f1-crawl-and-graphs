import { useState } from 'react'
import RaceTable from './RaceTable'
import { Dialog } from 'primereact/dialog'
import data from '../title.json'
import BarChart from './BarChart'

export interface ChartData {
  csvData: Array<string[]>
  year: string
  fileName: string
}

function App() {
  const [chartData, setChartData] = useState<ChartData>()
  const [visible, setVisible] = useState<boolean>(false);
  const [header, setHeader] = useState<string>('')

  function handleCsv({ csvData, year, fileName }: ChartData) {
    setChartData({ csvData, year, fileName })
    type dataKey = keyof typeof data
    const _year = data[year as dataKey]
    type yearKey = keyof typeof _year
    const raceName = _year[`${fileName}.csv` as yearKey]
    setHeader(raceName)
    setVisible(true)
  }

  return (
    <>
      <RaceTable handleCsv={handleCsv}></RaceTable>
      {chartData ?
        <Dialog header={header} dismissableMask visible={visible} maximizable
          style={{ width: '90vw', height: '80vw' }} onHide={() => setVisible(false)}>
          <BarChart csvData={chartData.csvData} fileName={chartData.fileName} aspectRatio={0.3} />
        </Dialog> : <></>}
    </>
  )
}

export default App

