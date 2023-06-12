import React, { useState, useEffect, MouseEvent } from 'react';
import { TreeTable, TreeTableEvent } from 'primereact/treetable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { TreeNode } from 'primereact/treenode';
import { TableService } from './TableService';
import { Button } from 'primereact/button';
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

export default function RaceTable({ handleCsv }: Props) {
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [globalFilter, setGlobalFilter] = useState<string>('');

  let isViewChartClicked = false;

  useEffect(() => {
    TableService.getTreeTableNodes().then((data) => setNodes(data));
  }, []);

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
      <Button type="button" onClick={handleViewChart} label="View Chart" icon="pi pi-chart-bar" style={{ color: 'blue' }} rounded />
    );
  };

  const header = getHeader();

  const rowClassName = (node: TreeNode) => {
    return { 'hidden-view-chart': (node.children) };
  }

  function handleRowClick(event: TreeTableEvent): void {
    if (isViewChartClicked) {
      const data = event.node.key?.toString().split('-')
      const fileName = data?.[0]
      const year = data?.[1]
      if (year && fileName) {
        fetch(`../../crawl-data/${year}/${fileName}.csv`)
          .then(response => response.text()).then(csvString => {
            readString(csvString, {
              worker: true,
              complete: (results: ParseResult<string[]>) => {
                handleCsv({ csvData: results.data, year, fileName })
              }
            })
          }).catch(err => console.log(err))
      }
    }
    isViewChartClicked = false
  }

  return (
    <div className="card">
      <TreeTable
        value={nodes} onRowClick={handleRowClick}
        sortOrder={-1} removableSort sortField='name'
        paginator rows={5} rowsPerPageOptions={[5, 10, 25]} paginatorPosition='top'
        globalFilter={globalFilter} header={header}
        scrollable scrollHeight='50vh'
        rowClassName={rowClassName} rowHover stripedRows showGridlines tableStyle={{ minWidth: '50rem' }}>
        <Column field="name" header="Name" sortable expander filter filterPlaceholder="Filter by name"></Column>
        <Column field="type" header="Type" sortable filter filterPlaceholder="Filter by type"></Column>
        <Column body={actionTemplate} />
      </TreeTable>
    </div>
  )
}
