import React, { useState, useEffect, MouseEvent } from 'react';
import { TreeTable, TreeTableEvent } from 'primereact/treetable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { TreeNode } from 'primereact/treenode';
import { TableService } from './TableService';
import { Button } from 'primereact/button';
import { SelectButton } from 'primereact/selectbutton';
import { readString } from 'react-papaparse';


//theme
import "primereact/resources/themes/lara-light-indigo/theme.css";
//core
import "primereact/resources/primereact.min.css";
//icon
import 'primeicons/primeicons.css';
import { ParseResult } from 'papaparse';
import { ChartData } from './App';

interface Props {
  handleCsv: (chartData: ChartData) => void;
}

interface CategoryOption {
  label: string;
  value: string;
}

export default function RaceTable({ handleCsv }: Props) {
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [category, setCategory] = useState('races');
  const [categoryOptions] = useState<CategoryOption[]>([
    { label: 'Races', value: 'races' },
    { label: 'Drivers', value: 'drivers' },
    { label: 'Teams', value: 'teams' },
    { label: 'Fastest Laps Award', value: 'fastest laps award' }
  ]);


  let isViewChartClicked = false;

  useEffect(() => {
    if (category === 'races') TableService.getTreeTableNodes().then((data) => setNodes(data[0]));
    if (category === 'drivers') TableService.getTreeTableNodes().then((data) => setNodes(data[1]));
    if (category === 'teams') TableService.getTreeTableNodes().then((data) => setNodes(data[2]));
    if (category === 'fastest laps award') TableService.getTreeTableNodes().then((data) => setNodes(data[3]));
  }, [category]);

  const getHeader = () => {
    return (
      <div className="flex justify-end">
        <div className="p-input-icon-left">
          <i className="pi pi-search"></i>
          <InputText type="search" onInput={(e: React.FormEvent<HTMLInputElement>) => setGlobalFilter(e.currentTarget.value)} placeholder="Global Search" />
        </div>
      </div>
    );
  };

  const actionTemplate = () => {
    function handleViewChart(event: MouseEvent<HTMLButtonElement>): void {
      const rowClicked = event.currentTarget.parentElement
      rowClicked?.click()
      isViewChartClicked = true
    }

    return (
      <Button type="button" size='small' onClick={handleViewChart} label="View Chart" icon="pi pi-chart-bar" style={{ color: 'blue' }} rounded />
    );
  };

  const header = getHeader();

  const rowClassName = (node: TreeNode) => {
    return { 'hidden-view-chart': (node.children) };
  }

  function handleRowClick(event: TreeTableEvent): void {
    if (isViewChartClicked) {
      const category = event.node.key?.toString().split('-')[0]
      const year = event.node.data?.year
      const fileName = event.node.data?.name
      if (category && year && fileName) {
        const filePath = category === 'Fastest Laps' ?
          `../../crawl-data/${year}/${category}.csv` :
          `../../crawl-data/${year}/${category}/${fileName}.csv`
        fetch(filePath)
          .then(response => response.text()).then(csvString => {
            readString(csvString, {
              worker: true,
              complete: (results: ParseResult<string[]>) => {
                handleCsv({ csvData: results.data, category, year, fileName })
              }
            })
          }).catch(err => console.log(err))
      }
    }
    isViewChartClicked = false
  }

  return (
    <div className="card">
      <div className="flex justify-center mb-4">
        <SelectButton value={category} onChange={(e) => setCategory(e.value)} options={categoryOptions} />
      </div>
      <TreeTable
        value={nodes} onRowClick={handleRowClick}
        sortOrder={-1} removableSort sortField='year'
        paginator rows={5} rowsPerPageOptions={[5, 10, 25]} paginatorPosition='top'
        globalFilter={globalFilter} header={header}
        scrollable scrollHeight='45vh'
        rowClassName={rowClassName} rowHover stripedRows showGridlines tableStyle={{ minWidth: '50rem' }}>
        <Column field="name" header="Name" sortable expander filter filterPlaceholder="Filter by name"></Column>
        <Column field="year" header="Year" sortable filter filterPlaceholder="Filter by year"></Column>
        <Column body={actionTemplate} />
      </TreeTable>
    </div>
  )
}
