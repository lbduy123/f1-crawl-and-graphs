import { useState, useEffect, useCallback } from 'react';
import { Chart } from 'primereact/chart';
import distinctColors from 'distinct-colors';
import moment from 'moment';
import 'chartjs-adapter-moment';

interface BarProps {
  csvData: Array<string[]>
  category: string
  fileName: string
  aspectRatio: number
}

export default function BarChart({ csvData, category, fileName, aspectRatio }: BarProps) {
  const [chartData, setChartData] = useState({});
  const [chartOptions, setChartOptions] = useState({});

  const getChartAxis = useCallback((_data: Array<string[]>, headers: string[]) => {
    let values: Array<string | number>
    let labels: string[] = []
    let label: string

    if (category === 'races' && fileName === 'All') {
      values = _data[headers.indexOf('Laps')].map((value) => parseInt(value))
      label = 'Laps'
    } else if (category === 'Fastest Laps') {
      values = _data[headers.indexOf('TIME')]
      values = values.map(v => {
        if (typeof v === 'number') v = v.toString()
        let time
        const hms = v.split('.')[0]

        if (hms.split(':').length === 1) time = moment('0:0:' + v, 'H:m:s.SSS')
        else if (hms.split(':').length === 2) time = moment(v, 'm:s.SSS')
        else time = moment(v, 'H:m:s.SSS')

        const timeValue = (time.hour() * 60 * 60 + time.minute() * 60 + time.second()) * 1000 + time.millisecond()
        return timeValue
      })
      label = 'TIME'
    } else {
      values = _data[headers.indexOf('PTS')].map((value) => parseInt(value))
      values = values.map(v => {
        if (v === 0) return 0.1
        else return v
      })
      label = 'PTS'
    }

    if (category === 'races') {
      labels = fileName === 'All' ? _data[headers.indexOf('Grand Prix')] : _data[headers.indexOf('DRIVER')]
    } else if (category === 'drivers') {
      labels = fileName === 'All' ? _data[headers.indexOf('DRIVER')] : _data[headers.indexOf('GRAND PRIX')]
    } else if (category === 'teams') {
      labels = fileName === 'All' ? _data[headers.indexOf('TEAM')] : _data[headers.indexOf('GRAND PRIX')]
    } else if (category === 'Fastest Laps') {
      labels = _data[headers.indexOf('DRIVER')].map((v, i) => v + ' - ' + _data[headers.indexOf('GRAND PRIX')][i])
    }

    return { values, labels, label }
  }, [category, fileName])

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

    const { values, labels, label } = getChartAxis(_data, headers)

    const labelCallback = (category === 'Fastest Laps') ?
      function (item: any) {
        return `TIME: ${item.formattedValue}`
      } : (category === 'races' && fileName === 'All') ?
        function (item: any) {
          return `LAPS: ${item.formattedValue}`
        } :
        function (item: any) {
          if (item.formattedValue === '0.1')
            return 'PTS: 0'
          return `PTS: ${item.formattedValue}`
        }

    const afterBodyCallback = category === 'races' ?
      fileName === 'All' ? function (context: any) {
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
      } : function (context: any) {
        const label = context[0].label
        const driverIdx = headers.indexOf('DRIVER')
        const drivers = _data[driverIdx]
        const driver = csvData[drivers.indexOf(label) + 1]
        const infoArr = headers.map((header, i) => {
          if (i !== driverIdx)
            return header + ': ' + driver[i]
        })
        infoArr.splice(driverIdx, 1)
        infoArr.pop()
        infoArr.unshift('')
        return infoArr
      } : (category === 'drivers') ?
        (fileName === 'All') ? function (context: any) {
          const label = context[0].label
          const driverIdx = headers.indexOf('DRIVER')
          const drivers = _data[driverIdx]
          const driver = csvData[drivers.indexOf(label) + 1]
          const infoArr = headers.map((header, i) => {
            if (i !== driverIdx)
              return header + ': ' + driver[i]
          })
          infoArr.splice(driverIdx, 1)
          infoArr.pop()
          infoArr.unshift('')
          return infoArr
        } : function (context: any) {
          const label = context[0].label
          const raceIdx = headers.indexOf('GRAND PRIX')
          const races = _data[raceIdx]
          const race = csvData[races.indexOf(label) + 1]
          const infoArr = headers.map((header, i) => {
            if (i !== raceIdx)
              return header + ': ' + race[i]
          })
          infoArr.splice(raceIdx, 1)
          infoArr.pop()
          infoArr.unshift('')
          return infoArr
        } : (category === 'teams') ?
          (fileName === 'All') ? function (context: any) {
            const label = context[0].label
            const teamIdx = headers.indexOf('TEAM')
            const teams = _data[teamIdx]
            const team = csvData[teams.indexOf(label) + 1]
            const infoArr = ['']
            infoArr.push(`POS: ${team[0]}`)
            return infoArr
          } : function (context: any) {
            const label = context[0].label
            const raceIdx = headers.indexOf('GRAND PRIX')
            const races = _data[raceIdx]
            const race = csvData[races.indexOf(label) + 1]
            const infoArr = ['']
            infoArr.push(`DATE: ${race[1]}`)
            return infoArr
          } : function (context: any) {
            const label = context[0].label
            const raceIdx = headers.indexOf('GRAND PRIX')
            const races = _data[raceIdx]
            const race = csvData[races.indexOf(label.split(' - ')[1]) + 1]
            const infoArr = ['']
            infoArr.push(`CAR: ${race[2]}`)
            return infoArr
          }

    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');
    const palette = distinctColors({ count: csvData.length - 1 }).toString().split(',')

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
            callback: category === 'Fastest Laps' ? function (value: number) {
              const time = moment.utc(value)
              let timeString = time.second() + 's'
              if (time.minute() !== 0) timeString = time.minute() + 'm' + timeString
              if (time.hour() !== 0) timeString = time.hour() + 'h' + timeString
              return timeString
            } : undefined
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
  }, [csvData, category, fileName, aspectRatio, getChartAxis]);

  return (
    <div className="card">
      <Chart type="bar" data={chartData} options={chartOptions} />
    </div>
  )
}
