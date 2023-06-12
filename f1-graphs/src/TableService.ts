import { TreeNode } from 'primereact/treenode';
import titles from '../title.json'

export interface Row {
  name: string;
  type: string;
}

const newRow = (name: string, type: string): Row => {
  return { name, type }
}

const newNode = (key: string, data: Row, children?: TreeNode[]): TreeNode => {
  return { key, data, children }
}

export const TableService = {
  async getTreeTableChartsData() {
    const table = new Array<TreeNode>()
    for (const year in titles) {
      const titleArr = Array<TreeNode>()
      if (year !== 'fails') {
        const yearKey = year as keyof typeof titles
        for (const fileName in titles[yearKey]) {
          const type = fileName === 'all.csv' ? 'Races' : 'Race Result'
          const title = fileName.split('.csv')[0]
          titleArr.push(newNode(`${title}-${year}`, newRow(title, type)))
        }
        table.push(newNode(`${year})`, newRow(year, 'Year'), titleArr))
      }
    }

    return table
  },

  getTreeTableNodes() {
    return Promise.resolve(this.getTreeTableChartsData());
  },
}