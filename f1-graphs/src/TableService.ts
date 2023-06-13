import { TreeNode } from 'primereact/treenode';
import titles from '../title.json'

export interface Row {
  name: string;
  year: string;
}

const newRow = (name: string, year: string): Row => {
  return { name, year }
}

const newNode = (key: string, data: Row, children?: TreeNode[]): TreeNode => {
  return { key, data, children }
}

export const TableService = {
  async getTreeTableChartsData() {
    const table = new Array<TreeNode[]>(4)
    for (let i = 0; i < table.length; i++) table[i] = []
    for (const year in titles) {
      const titleArr = new Array<TreeNode[]>(4)
      for (let i = 0; i < titleArr.length; i++) titleArr[i] = []
      if (year !== 'fails') {
        const yearKey = year as keyof typeof titles
        for (const category in titles[yearKey]) {
          if (category !== 'Fastest Laps.csv') {
            const cKey = category as keyof typeof titles[typeof yearKey]
            const fileNames: object = titles[yearKey][cKey]
            for (const fileName in fileNames) {
              const title = fileName.split('.csv')[0]
              if (category === 'races') {
                titleArr[0].push(newNode(`${category}-${title}-${year}`, newRow(title, year)))
              } else if (category === 'drivers') {
                titleArr[1].push(newNode(`${category}-${title}-${year}`, newRow(title, year)))
              } else if (category === 'teams') {
                titleArr[2].push(newNode(`${category}-${title}-${year}`, newRow(title, year)))
              }
            }
          } else {
            const title = category.split('.csv')[0]
            titleArr[3].push(newNode(`${title}-${year}`, newRow(title, year)))
          }
        }
        table[0].push(newNode(`${year}-races`, newRow('-', year), titleArr[0]))
        table[1].push(newNode(`${year}-drivers`, newRow('-', year), titleArr[1]))
        table[2].push(newNode(`${year}-teams`, newRow('-', year), titleArr[2]))
        table[3].push(titleArr[3][0])
      }
    }
    return table
  },

  getTreeTableNodes() {
    return Promise.resolve(this.getTreeTableChartsData());
  },
}