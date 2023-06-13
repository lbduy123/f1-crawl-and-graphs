import { DriverResultByGrandPrix, RaceResultByGrandPrix, TeamResultByGrandPrix, YearlyAward, YearlyDriverResult, YearlyRaceResult, YearlyTeamResult } from './Interfaces';
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

  async writeTitle(year: string, fileName: string, title: string, category: string) {
    const jsonString = fs.readFileSync(this.titleFilePath, "utf8")
    const titles = JSON.parse(jsonString);
    if (!titles[year]) titles[year] = {}
    if (category !== '' && !titles[year][category]) titles[year][category] = {}
    if (category !== '') titles[year][category][fileName] = title
    else titles[year][fileName] = title
    fs.writeFileSync(this.titleFilePath, JSON.stringify(titles, null, 2), 'utf8')
  }

  async getHtmlByUrl(url: string) {
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
    return response!.data;
  }

  async crawl(urlToCrawl: string) {
    const yearlyRaceResultUrls = new Array<string>()

    const html = await this.getHtmlByUrl(urlToCrawl)
    if (!html || typeof html !== 'string') return
    const $ = cheerio.load(html);

    const links = $('.resultsarchive-filter-container').children()
    $(links[0]).find('.resultsarchive-filter').children().map((i, li) => {
      const url = `${this.origin}${$(li).children().attr('href')}`
      yearlyRaceResultUrls.push(url)
    })

    yearlyRaceResultUrls.map(async url => await this.scrapeYearlyRaceResult(url))
  }

  async scrapeYearlyRaceResult(url: string) {
    const html = await this.getHtmlByUrl(url)
    if (!html || typeof html !== 'string') return
    const $ = cheerio.load(html);

    const categoryUrls = new Array<string>()
    const grandPrixUrls = new Array<string>
    const result = new Array<YearlyRaceResult>

    const links = $('.resultsarchive-filter-container').children()
    $(links[1]).find('.resultsarchive-filter').children().map((i, li) => {
      const url = `${this.origin}${$(li).children().attr('href')}`
      categoryUrls.push(url)
    })

    const pageTitle = $('.ResultsArchiveTitle').text().trim()
    const year = pageTitle.split(' ')[0]

    const dir = path.join(this.crawlDataDir, year, 'races')

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
      await this.scrapeRaceResultByGrandPrix(grandPrixUrls[rowIndex], {
        grandPrix: result[rowIndex].grandPrix,
        year,
        dir
      })
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
    const fileName = `All.csv`
    const writer = csvWriter.createObjectCsvWriter({
      path: path.resolve(dir, fileName),
      header: csvHeaders
    });

    await this.writeTitle(year, fileName, pageTitle, 'races')
    writer.writeRecords(result).then(() => {
      console.log(`Done crawling ${url}!`);
    });

    await this.scrapeYearlyDriverResult(categoryUrls[1])
    await this.scrapeYearlyTeamResult(categoryUrls[2])
    await this.scrapeYearlyAward(categoryUrls[3])
  }

  async scrapeRaceResultByGrandPrix(url: string, options?: {
    grandPrix?: string,
    year?: string,
    dir?: string,
  }) {
    const html = await this.getHtmlByUrl(url)
    if (!html || typeof html !== 'string') return
    const $ = cheerio.load(html);

    if (!options) {
      options = {}
      let splitArr = url.split('/race-result.html')[0].split('/')
      options['grandPrix'] = splitArr[splitArr.length - 1]
      splitArr = url.split('https://www.formula1.com/en/results.html/')
      options['year'] = splitArr[1].slice(0, 4);
      options['dir'] = path.join(this.crawlDataDir, options['year'], 'races')
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
    await this.writeTitle(options.year!, fileName, pageTitle, "races")

    const writer = csvWriter.createObjectCsvWriter({
      path: path.resolve(options.dir!, fileName),
      header: csvHeaders
    });

    writer.writeRecords(result).then(() => {
      console.log(`Done crawling ${url}!`);
    });
  }

  async scrapeYearlyDriverResult(url: string) {
    const html = await this.getHtmlByUrl(url)
    if (!html || typeof html !== 'string') return
    const $ = cheerio.load(html);

    const driverUrls = new Array<string>
    const result = new Array<YearlyDriverResult>

    const pageTitle = $('.ResultsArchiveTitle').text().trim()
    const year = pageTitle.slice(0, 4)

    const dir = path.join(this.crawlDataDir, year, 'drivers')

    const tblData = $('.resultsarchive-table tbody').children();
    tblData.map(async (rowIndex, row) => {
      const rowChilds = $(row).children()

      const driverUrl = `${this.origin}${$(rowChilds[2]).children().attr('href')}`
      driverUrls.push(driverUrl)

      const driverElement = $(rowChilds[2]).children().children().not('.hide-for-desktop')
      const driver = driverElement.toArray().map(span => $(span).text().trim())

      const rowData: YearlyDriverResult = {
        pos: $(rowChilds[1]).text().trim(),
        driver: driver.join(' '),
        nationality: $(rowChilds[3]).text().trim(),
        car: $(rowChilds[4]).text().trim(),
        pts: $(rowChilds[5]).text().trim(),
      }
      result.push(rowData)
      await this.scrapeDriverResultByGrandPrix(driverUrls[rowIndex], {
        driver: result[rowIndex].driver,
        year,
        dir
      })
    })

    const csvHeaders = [
      { id: 'pos', title: 'POS' },
      { id: 'driver', title: 'DRIVER' },
      { id: 'nationality', title: 'NATIONALITY' },
      { id: 'car', title: 'CAR' },
      { id: 'pts', title: 'PTS' },
    ]

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    const fileName = `All.csv`
    const writer = csvWriter.createObjectCsvWriter({
      path: path.resolve(dir, fileName),
      header: csvHeaders
    });

    await this.writeTitle(year, fileName, pageTitle, 'drivers')
    writer.writeRecords(result).then(() => {
      console.log(`Done crawling ${url}!`);
    });
  }

  async scrapeDriverResultByGrandPrix(url: string, options?: {
    driver?: string,
    year?: string,
    dir?: string,
  }) {
    const html = await this.getHtmlByUrl(url)
    if (!html || typeof html !== 'string') return
    const $ = cheerio.load(html);

    const pageTitle = $('.ResultsArchiveTitle').text().trim()

    if (!options) {
      options = {}
      let splitArr = pageTitle.split(' Driver Standings: ')
      options['driver'] = splitArr[1]
      options['year'] = splitArr[0]
      options['dir'] = path.join(this.crawlDataDir, options['year'], 'drivers')
    }

    const result = new Array<DriverResultByGrandPrix>

    const tblData = $('.resultsarchive-table tbody').children();
    tblData.map((rowIndex, row) => {
      const rowChilds = $(row).children()

      const rowData: DriverResultByGrandPrix = {
        grandPrix: $(rowChilds[1]).text().trim(),
        date: $(rowChilds[2]).text().trim(),
        car: $(rowChilds[3]).text().trim(),
        pos: $(rowChilds[4]).text().trim(),
        pts: $(rowChilds[5]).text().trim(),
      }
      result.push(rowData)
    })

    const csvHeaders = [
      { id: 'grandPrix', title: 'GRAND PRIX' },
      { id: 'date', title: 'DATE' },
      { id: 'car', title: 'CAR' },
      { id: 'pos', title: 'RACE POSITION' },
      { id: 'pts', title: 'PTS' },
    ]

    if (!fs.existsSync(options.dir!)) {
      fs.mkdirSync(options.dir!, { recursive: true })
    }
    const fileName = `${options.driver}.csv`
    await this.writeTitle(options.year!, fileName, pageTitle, "drivers")

    const writer = csvWriter.createObjectCsvWriter({
      path: path.resolve(options.dir!, fileName),
      header: csvHeaders
    });

    writer.writeRecords(result).then(() => {
      console.log(`Done crawling ${url}!`);
    });
  }

  async scrapeYearlyTeamResult(url: string) {
    const html = await this.getHtmlByUrl(url)
    if (!html || typeof html !== 'string') return
    const $ = cheerio.load(html);

    const teamUrls = new Array<string>
    const result = new Array<YearlyTeamResult>

    const pageTitle = $('.ResultsArchiveTitle').text().trim()
    const year = pageTitle.slice(0, 4)

    const dir = path.join(this.crawlDataDir, year, 'teams')

    const tblData = $('.resultsarchive-table tbody').children();
    tblData.map(async (rowIndex, row) => {
      const rowChilds = $(row).children()

      const teamUrl = `${this.origin}${$(rowChilds[2]).children().attr('href')}`
      teamUrls.push(teamUrl)

      const rowData: YearlyTeamResult = {
        pos: $(rowChilds[1]).text().trim(),
        team: $(rowChilds[2]).text().trim(),
        pts: $(rowChilds[3]).text().trim(),
      }
      result.push(rowData)
      await this.scrapeTeamResultByGrandPrix(teamUrls[rowIndex], {
        team: result[rowIndex].team,
        year,
        dir
      })
    })

    const csvHeaders = [
      { id: 'pos', title: 'POS' },
      { id: 'team', title: 'TEAM' },
      { id: 'pts', title: 'PTS' },
    ]

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    const fileName = `All.csv`
    const writer = csvWriter.createObjectCsvWriter({
      path: path.resolve(dir, fileName),
      header: csvHeaders
    });

    await this.writeTitle(year, fileName, pageTitle, 'teams')
    writer.writeRecords(result).then(() => {
      console.log(`Done crawling ${url}!`);
    });
  }

  async scrapeTeamResultByGrandPrix(url: string, options?: {
    team?: string,
    year?: string,
    dir?: string,
  }) {
    const html = await this.getHtmlByUrl(url)
    if (!html || typeof html !== 'string') return
    const $ = cheerio.load(html);

    const pageTitle = $('.ResultsArchiveTitle').text().trim()

    if (!options) {
      options = {}
      let splitArr = pageTitle.split(' Constructor Standings: ')
      options['team'] = splitArr[1]
      options['year'] = splitArr[0]
      options['dir'] = path.join(this.crawlDataDir, options['year'], 'teams')
    }

    const result = new Array<TeamResultByGrandPrix>

    const tblData = $('.resultsarchive-table tbody').children();
    tblData.map((rowIndex, row) => {
      const rowChilds = $(row).children()

      const rowData: TeamResultByGrandPrix = {
        grandPrix: $(rowChilds[1]).text().trim(),
        date: $(rowChilds[2]).text().trim(),
        pts: $(rowChilds[3]).text().trim(),
      }
      result.push(rowData)
    })

    const csvHeaders = [
      { id: 'grandPrix', title: 'GRAND PRIX' },
      { id: 'date', title: 'DATE' },
      { id: 'pts', title: 'PTS' },
    ]

    if (!fs.existsSync(options.dir!)) {
      fs.mkdirSync(options.dir!, { recursive: true })
    }
    const fileName = options.team?.includes('/') ? `${options.team.split('/')[0]}.csv` : `${options.team}.csv`
    await this.writeTitle(options.year!, fileName, pageTitle, "teams")

    const writer = csvWriter.createObjectCsvWriter({
      path: path.resolve(options.dir!, fileName),
      header: csvHeaders
    });

    writer.writeRecords(result).then(() => {
      console.log(`Done crawling ${url}!`);
    });
  }

  async scrapeYearlyAward(url: string) {
    const html = await this.getHtmlByUrl(url)
    if (!html || typeof html !== 'string') return
    const $ = cheerio.load(html);

    const result = new Array<YearlyAward>

    const pageTitle = $('.ResultsArchiveTitle').text().trim()
    const year = pageTitle.slice(0, 4)

    const dir = path.join(this.crawlDataDir, year, '')

    const tblData = $('.resultsarchive-table tbody').children();
    tblData.map(async (rowIndex, row) => {
      const rowChilds = $(row).children()

      const driverElement = $(rowChilds[2]).children().not('.hide-for-desktop')
      const driver = driverElement.toArray().map(span => $(span).text().trim())

      const rowData: YearlyAward = {
        grandPrix: $(rowChilds[1]).text().trim(),
        driver: driver.join(' '),
        car: $(rowChilds[3]).text().trim(),
        time: $(rowChilds[4]).text().trim(),
      }
      result.push(rowData)
    })

    const csvHeaders = [
      { id: 'grandPrix', title: 'GRAND PRIX' },
      { id: 'driver', title: 'DRIVER' },
      { id: 'car', title: 'CAR' },
      { id: 'time', title: 'TIME' },
    ]

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    const fileName = `Fastest Laps.csv`
    const writer = csvWriter.createObjectCsvWriter({
      path: path.resolve(dir, fileName),
      header: csvHeaders
    });

    await this.writeTitle(year, fileName, pageTitle, '')
    writer.writeRecords(result).then(() => {
      console.log(`Done crawling ${url}!`);
    });
  }
}