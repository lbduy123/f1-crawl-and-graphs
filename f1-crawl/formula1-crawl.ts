import { RaceResultByGrandPrix, YearlyRaceResult } from './Interfaces';
import axios from 'axios';
import cheerio from 'cheerio';
import * as path from 'path';
import fs from 'fs'

const csvWriter = require('csv-writer');

export class Formula1Scraper {
  public origin: string = 'https://www.formula1.com'
  public titleFilePath: string = path.join(__dirname, '..', 'f1-graphs', 'title.json')
  public crawlDataDir: string = path.join(__dirname, '..', 'f1-graphs', 'crawl-data')

  createTitleFile() {
    fs.writeFileSync(this.titleFilePath, JSON.stringify({ 'fails': [] }, null, 2), 'utf8')
  }

  async writeTitle(year: string, fileName: string, title: string) {
    const jsonString = fs.readFileSync(this.titleFilePath, "utf8")
    const titles = JSON.parse(jsonString);
    if (!titles[year]) titles[year] = {}
    titles[year][fileName] = title
    fs.writeFileSync(this.titleFilePath, JSON.stringify(titles, null, 2), 'utf8')
  }

  async crawl(urlToCrawl: string) {
    const raceResultUrls = new Array<string>()
    const categoryUrls = new Array<string>()
    let response
    try {
      response = await axios.get(urlToCrawl)
    } catch (err) {
      console.log(`Error while trying to connect to ${urlToCrawl}`, err)
      const jsonString = fs.readFileSync(this.titleFilePath, "utf8")
      const titles = JSON.parse(jsonString);
      titles.fails.push(urlToCrawl)
      fs.writeFileSync(this.titleFilePath, JSON.stringify(titles, null, 2), 'utf8')
      return
    }
    const html = response!.data;
    const $ = cheerio.load(html);

    const links = $('.resultsarchive-filter-container').children()
    $(links[0]).find('.resultsarchive-filter').children().map((i, li) => {
      const url = `${this.origin}${$(li).children().attr('href')}`
      raceResultUrls.push(url)
    })

    $(links[1]).find('.resultsarchive-filter').children().map((i, li) => {
      const url = `${this.origin}${$(li).children().attr('href')}`
      categoryUrls.push(url)
    })

    raceResultUrls.map(async url => await this.scrapeYearlyRaceResult(url))
  }

  async scrapeYearlyRaceResult(url: string) {
    let response
    try {
      response = await axios.get(url)
    } catch (err) {
      console.log(`Error while trying to connect to ${url}`)
      const jsonString = fs.readFileSync(this.titleFilePath, "utf8")
      const titles = JSON.parse(jsonString);
      titles.fails.push(url)
      fs.writeFileSync(this.titleFilePath, JSON.stringify(titles, null, 2), 'utf8')
      return
    }
    const html = response!.data;

    const $ = cheerio.load(html);
    const grandPrixUrls = new Array<string>
    const result = new Array<YearlyRaceResult>

    const pageTitle = $('.ResultsArchiveTitle').text().trim()
    const year = pageTitle.split(' ')[0]

    const dir = path.join(this.crawlDataDir, year)

    const tblData = $('.resultsarchive-table tbody').children();
    tblData.map(async (rowIndex, row) => {
      const rowChilds = $(row).children()

      const winnerElement = $(rowChilds[3]).children().not('.hide-for-desktop')
      const winner = winnerElement.toArray().map(span => $(span).text().trim())

      const grandPrixUrl = `${this.origin}${$(rowChilds[1]).children().attr('href')}`
      grandPrixUrls.push(grandPrixUrl)

      const rowData: YearlyRaceResult = {
        grandPrix: $(rowChilds[1]).text().trim(),
        date: $(rowChilds[2]).text().trim(),
        winner: winner.join(' '),
        car: $(rowChilds[4]).text().trim(),
        laps: $(rowChilds[5]).text().trim(),
        time: $(rowChilds[6]).text().trim(),
      }
      result.push(rowData)
      await this.scrapeResultByGrandPrix(grandPrixUrls[rowIndex], {
        grandPrix: result[rowIndex].grandPrix,
        year,
        dir
      }).
        catch(err => console.log(err))
    })

    const csvHeaders = [
      { id: 'grandPrix', title: 'Grand Prix' },
      { id: 'date', title: 'Date' },
      { id: 'winner', title: 'Winner' },
      { id: 'car', title: 'Car' },
      { id: 'laps', title: 'Laps' },
      { id: 'time', title: 'Time' },
    ]

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    const fileName = `all.csv`
    const writer = csvWriter.createObjectCsvWriter({
      path: path.resolve(dir, fileName),
      header: csvHeaders
    });

    await this.writeTitle(year, fileName, pageTitle)
    writer.writeRecords(result).then(() => {
      console.log(`Done crawling ${url}!`);
    });
  }

  async scrapeResultByGrandPrix(url: string, options?: {
    grandPrix?: string,
    year?: string,
    dir?: string,
  }) {
    let response
    try {
      response = await axios.get(url)
    } catch (err) {
      console.log(`Error while trying to connect to ${url}`)
      const jsonString = fs.readFileSync(this.titleFilePath, "utf8")
      const titles = JSON.parse(jsonString);
      titles.fails.push(url)
      fs.writeFileSync(this.titleFilePath, JSON.stringify(titles, null, 2), 'utf8')
      return
    }
    const html = response!.data;

    const $ = cheerio.load(html);

    if (!options) {
      options = {}
      let splitArr = url.split('/race-result.html')[0].split('/')
      options['grandPrix'] = splitArr[splitArr.length - 1]
      splitArr = url.split('https://www.formula1.com/en/results.html/')
      options['year'] = splitArr[1].slice(0, 4);
      options['dir'] = path.join(this.crawlDataDir, options['year'])
      // `${this.crawlDataDir}/${options['year'}`
    }

    const raceCategoryUrls = new Array<string>
    const result = new Array<RaceResultByGrandPrix>

    const tblData = $('.resultsarchive-table tbody').children();
    tblData.map((rowIndex, row) => {
      const rowChilds = $(row).children()

      const driverElement = $(rowChilds[3]).children().not('.hide-for-desktop')
      const driver = driverElement.toArray().map(span => $(span).text().trim())

      const raceCategoryUrl = `${this.origin}${$(rowChilds[1]).children().attr('href')}`
      raceCategoryUrls.push(raceCategoryUrl)

      const rowData: RaceResultByGrandPrix = {
        pos: $(rowChilds[1]).text().trim(),
        no: $(rowChilds[2]).text().trim(),
        driver: driver.join(' '),
        car: $(rowChilds[4]).text().trim(),
        laps: $(rowChilds[5]).text().trim(),
        time_or_retired: $(rowChilds[6]).text().trim(),
        pts: $(rowChilds[7]).text().trim(),
      }
      result.push(rowData)
    })

    const csvHeaders = [
      { id: 'pos', title: 'POS' },
      { id: 'no', title: 'NO' },
      { id: 'driver', title: 'DRIVER' },
      { id: 'car', title: 'CAR' },
      { id: 'laps', title: 'LAPS' },
      { id: 'time_or_retired', title: 'TIME/RETIRED' },
      { id: 'pts', title: 'PTS' },
    ]

    const pageTitle = $('.ResultsArchiveTitle').text().trim().replace(/\s\s+/g, ' ')

    if (!fs.existsSync(options.dir!)) {
      fs.mkdirSync(options.dir!, { recursive: true })
    }
    const fileName = `${options.grandPrix}.csv`
    await this.writeTitle(options.year!, fileName, pageTitle)

    const writer = csvWriter.createObjectCsvWriter({
      path: path.resolve(options.dir!, fileName),
      header: csvHeaders
    });

    writer.writeRecords(result).then(() => {
      console.log(`Done crawling ${url}!`);
    });
  }
}