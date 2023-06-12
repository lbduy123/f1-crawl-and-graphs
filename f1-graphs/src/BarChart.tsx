import { useState, useEffect } from 'react';
import { Chart } from 'primereact/chart';
import distinctColors from 'distinct-colors';

interface BarProps {
  csvData: Array<string[]>
  fileName: string
  aspectRatio: number
}

export default function BarChart({ csvData, fileName, aspectRatio }: BarProps) {
  const [chartData, setChartData] = useState({});
  const [chartOptions, setChartOptions] = useState({});

  useEffect(() => {
    const _data = new Array<string[]>();
    const headers = csvData[0]
    if (headers.length !== 0) {
      for (let i = 0; i < headers.length; i++) {
        const col = new Array<string>()
        for (let j = 1; j < csvData.length; j++) {
          if (csvData[j].length === headers.length) {
            col.push(csvData[j][i])
          }
        }
        _data.push(col)
      }
    }

    let values = fileName === 'all' ?
      _data[headers.indexOf('Laps')].map((value) => parseInt(value)) :
      _data[headers.indexOf('PTS')].map((value) => parseInt(value))
    values = values.map(v => {
      if (v === 0) return 0.1
      else return v
    })

    const palette = distinctColors({ count: csvData.length - 1, samples: 800 }).toString().split(',')

    const labels = fileName === 'all' ? _data[headers.indexOf('Grand Prix')] : _data[headers.indexOf('DRIVER')]
    const label = fileName === 'all' ? 'Laps' : 'PTS'
    const labelCallback = fileName === 'all' ? undefined :
      function (item: any) {
        if (item.formattedValue === '0.1')
          return 'PTS: 0'
        return `PTS: ${item.formattedValue}`
      }
    const afterBodyCallback = fileName === 'all' ?
      function (context: any) {
        const label = context[0].label
        const raceIdx = headers.indexOf('Grand Prix')
        const races = _data[raceIdx]
        const race = csvData[races.indexOf(label) + 1]
        const infoArr = headers.map((header, i) => {
          if (i !== raceIdx)
            return header + ': ' + race[i]
        })
        infoArr.splice(raceIdx, 1)
        infoArr.unshift('')
        return infoArr
      } :
      function (context: any) {
        const label = context[0].label
        const driverIdx = headers.indexOf('DRIVER')
        const drivers = _data[driverIdx]
        const driver = csvData[drivers.indexOf(label) + 1]
        const infoArr = headers.map((header, i) => {
          if (i !== driverIdx)
            return header + ': ' + driver[i]
        })
        infoArr.splice(driverIdx, 1)
        infoArr.unshift('')
        return infoArr
      }

    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');
    const data = {
      labels: labels,
      datasets: [
        {
          label: label,
          backgroundColor: palette,
          // borderColor: palette,
          data: values,
        },
      ]
    };
    const options = {
      indexAxis: 'y',
      maintainAspectRatio: false,
      aspectRatio: aspectRatio,
      plugins: {
        // colors: {
        //   enabled: false,
        //   forceOverride: true
        // },
        legend: {
          labels: {
            fontColor: textColor
          }
        },
        tooltip: {
          callbacks: {
            beforeBody: function () {
              return ['']
            },
            label: labelCallback,
            afterBody: afterBodyCallback
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
            font: {
              weight: 500
            },
          },
          grid: {
            display: false,
            drawBorder: false
          }
        },
        y: {
          ticks: {
            color: textColorSecondary
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false
          }
        }
      }
    };

    setChartData(data)
    setChartOptions(options);
  }, [csvData, fileName, aspectRatio]);

  return (
    <div className="card">
      <Chart type="bar" data={chartData} options={chartOptions} />
    </div>
  )
}
