const { Client } = require("@notionhq/client")
const { NotionToMarkdown } = require("notion-to-md")
const moment = require("moment")
const moment_timezone = require("moment-timezone")
const path = require("path")
const fs = require("fs")

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})


// passing notion client to the option
const n2m = new NotionToMarkdown({ notionClient: notion });

(async () => {
  // ensure directory exists
  const root = `docs`
  const databaseId = process.env.DATABASE_ID
  const response = await notion.databases.query({
    database_id: databaseId,
  })

  for (const r of response.results) {
    const id = r.id
    let pk = r.properties?.["ID"]?.["unique_id"]?.["number"]

    let isPublished = r.properties?.["배포"]?.["checkbox"] || false
    let modifiedDate = moment(r.last_edited_time).tz("Asia/Seoul").format("YYYY-MM-DD")

    let permalink = ""
    let pPermalink = r.properties["permalink"]?.["rich_text"]
    if (pPermalink) {
      permalink = pPermalink[0]?.["plain_text"]
    }
    // 최상위폴더(grand)
    let upUpFolder = ""
    let pUpUpFolder = r.properties?.["최상위폴더"]?.["rich_text"]
    if (pUpUpFolder) {
      upUpFolder = pUpUpFolder[0]?.["plain_text"]
    }

    if (isPublished) {

    }
    // 상위폴더
    let upFolder = ""
    let pUpFolder = r.properties?.["상위폴더"]?.["rich_text"]
    if (pUpFolder) {
      upFolder = pUpFolder[0]?.["plain_text"]
    }

    // 순번
    let navOrder = r.properties?.["순번"]?.["number"] || ""

    // 제목
    let title = id
    let pTitle = r.properties?.["제목"]?.["title"]
    if (pTitle?.length > 0) {
      title = pTitle[0]?.["plain_text"]
    }

    // 메인
    let hasChild = r.properties?.["메인"]?.["checkbox"] || false

    // 작성일
    let publishedDate = moment(r.created_time).tz("Asia/Seoul").format("YYYY-MM-DD")

    let header = `---`

    if (hasChild) {
        header += `
layout: default`        
    } else {
        header += `
layout: post`        
    }
    header += `
title: ${title}
has_children: ${hasChild}
published_date: ${publishedDate}
last_modified_date: ${modifiedDate}`

    if (navOrder) {
      header += `
nav_order: ${navOrder}`
    }

    if (hasChild) {
      if (upUpFolder) {
        header += `
grand_parent: ${upUpFolder}
parent: ${upFolder}`
      }
      else if (upFolder) {
        header += `
parent: ${upUpFolder}`
      } 
    } else if (!hasChild && !upFolder) {
      header += `
parent: ${upUpFolder}`
    }
    header += `
permalink: '${pk}'
---
`

    const folderPath = upFolder ? `${root}/${upUpFolder}/${upFolder}` : `${root}/${upUpFolder}`
    fs.mkdirSync(folderPath, { recursive: true })

    const mdBlocks = await n2m.pageToMarkdown(id)
    let body = n2m.toMarkdownString(mdBlocks)["parent"]


    //writing to file
    const fTitle = `${pk}.md`
    fs.writeFile(path.join(folderPath, fTitle), header + body, (err) => {
      if (err) {
        console.log(err)
      }
    })
  }
})()
