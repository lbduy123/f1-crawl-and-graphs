# f1-crawl-and-graphs

## Installation

Use docker compose to simply bootup the application.

```
docker compose up --build
```

Or use following npm commands.

```
cd f1-graphs
npm install
npm run dev
```

The crawl data is already included in the f1-graphs project in csv & json format. In case you want to crawl the data yourself, you can use the following commands (crawl result is stored in f1-graphs/crawl-data & f1-graphs/title.json):

```
// Run this if you using docker approach
docker exec -it f1-crawl-and-graphs sh

cd f1-crawl
npm install

// Command to crawl the result data from formula1.com
npm run crawl
// Command to run after the above command excuted if there is any connection error
npm run fix
```

## Dependencies
- ts-node
- axios
- cheerio
- csv-writer
- vite
- papaparse
- chart.js
- moment.js
- distinct-colors
- primereact
- tailwindcss

## Screenshots

