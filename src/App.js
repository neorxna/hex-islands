import React from 'react'
import { HexGrid, Layout, Hexagon } from 'react-hexgrid'
import * as chroma from 'chroma-js'

const getNeighbours = (q, r, s) => {
  return [
    { q: q + 1, r: r - 1, s: s },
    { q: q + 1, r: r, s: s - 1 },
    { q: q, r: r + 1, s: s - 1 },
    { q: q - 1, r: r + 1, s: s },
    { q: q - 1, r: r, s: s + 1 },
    { q: q, r: r - 1, s: s + 1 }
  ]
}

const ocean1 = chroma('#1a1aff')
const ocean2 = chroma('lightblue') //.brighten(0.8)
const oceanColors = chroma.scale([ocean1, ocean2]).mode('lch').colors(10)

const harborColor = chroma('#1a1aff').brighten(0.9)

const randomIsland = size => {
  let island = [{ q: 0, r: 0, s: 0 }]
  let frontier = getNeighbours(0, 0, 0)
  let i = 0
  while (i < size) {
    const randomIndex = Math.floor(Math.random() * frontier.length)
    const tile = frontier[randomIndex]
    if (
      !island.find(
        ({ q, r, s }) => q === tile.q && r === tile.r && s === tile.s
      )
    ) {
      island.push(tile)
      frontier = [...frontier, ...getNeighbours(tile.q, tile.r, tile.s)]
      i++
    }
  }
  return island
}

function adjacentTiles (island) {
  const adjacent = []
  island.forEach(({ q, r, s }) => {
    const neighbours = getNeighbours(q, r, s)
    neighbours.forEach(({ q, r, s }) => {
      if (
        !island.find(
          ({ q: iq, r: ir, s: is }) => q === iq && r === ir && s === is
        )
      ) {
        adjacent.push({ q, r, s })
      }
    })
  })
  return adjacent
}

function harbourTiles (island) {
  const adjacent = adjacentTiles(island)
  const harbours = []
  adjacent.forEach(({ q, r, s }) => {
    const neighbours = getNeighbours(q, r, s)
    const islandNeighbours = neighbours.filter(({ q, r, s }) =>
      island.find(({ q: iq, r: ir, s: is }) => q === iq && r === ir && s === is)
    )
    if (islandNeighbours.length >= 3) {
      harbours.push({ q, r, s })
    }
  })
  return harbours
}

function oceanTiles (island, adjacent) {
  const ocean = []
  const all = [...island, ...adjacent]
  all.forEach(({ q, r, s }) => {
    const neighbours = getNeighbours(q, r, s)
    const nonOceanNeighbours = neighbours.filter(
      ({ q, r, s }) =>
        !all.find(({ q: iq, r: ir, s: is }) => q === iq && r === ir && s === is)
    )
    nonOceanNeighbours.forEach(({ q, r, s }) => {
      if (
        !ocean.find(
          ({ q: iq, r: ir, s: is }) => q === iq && r === ir && s === is
        )
      ) {
        ocean.push({ q, r, s })
      }
    })
  })
  return ocean
}

const island = randomIsland(64)

const adjacents = adjacentTiles(island).map(cell => ({
  ...cell,
  adjacent: true
}))

const harbours = harbourTiles(island).map(cell => ({
  ...cell,
  harbour: true
}))

const ocean = oceanTiles([...island, ...harbours], []).map(cell => ({
  ...cell,
  ocean: true
}))

const tiles = [...island, ...adjacents, ...ocean, ...harbours]

const neighbours = (tile, graph, n) => {
  let neighbours = []
  let frontier = [tile]
  let i = 0
  while (i < n) {
    const nextFrontier = []
    frontier.forEach(tile => {
      const tileNeighbours = getNeighbours(tile.q, tile.r, tile.s)
      tileNeighbours.forEach(tile => {
        if (
          !neighbours.find(
            ({ q, r, s }) => q === tile.q && r === tile.r && s === tile.s
          )
        ) {
          neighbours.push(tile)
          nextFrontier.push(tile)
        }
      })
    })
    frontier = nextFrontier
    i++
  }
  return neighbours.filter(
    ({ q, r, s }) =>
      !graph.find(({ q: iq, r: ir, s: is }) => q === iq && r === ir && s === is)
  )
}

const cumulativeNeighbours = (tile, graph) => {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9]
    .map(n => neighbours(tile, graph, n).length)
    .reduce((acc, n) => acc + n, 0)
}

const distances = island.map(cell => ({
  ...cell,
  distance: cumulativeNeighbours(cell, island)
}))

const mountainCells = (island, ocean) =>
  distances
    .filter(({ ocean }) => !ocean)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 14)

const centerTile = mountainCells(island, ocean)[0]
const displacement = { x: -centerTile.q, y: -centerTile.r }

const centeredtiles = tiles.map(({ q, r, s, ...rest }) => ({
  q: q + displacement.x,
  r: r + displacement.y,
  s,
  center: q === centerTile.q && r === centerTile.r,
  mountain: mountainCells(island, ocean).find(
    ({ q: iq, r: ir }) => q === iq && r === ir
  ),
  ...rest
}))

function App () {
  return (
    <HexGrid width={900} height={800} viewBox='-50 -50 100 100'>
      <Layout size={{ x: 3, y: 3 }} spacing={1.0} origin={{ x: 0, y: 0 }}>
        {centeredtiles.map(
          ({ q, r, s, harbour, adjacent, ocean, center, mountain }) => (
            <Hexagon
              className='hexo'
              cellStyle={{
                fill: ocean
                  ? oceanColors[1]
                  : harbour
                  ? oceanColors[5]
                  : adjacent
                  ? 'green'
                  : center
                  ? 'darkgreen'
                  : mountain
                  ? 'darkgreen'
                  : 'green'
              }}
              key={`${q}-${r}-${s}`}
              q={q}
              r={r}
              s={s}
              data={{ foo: 'bar' }}
            />
          )
        )}
        {}
      </Layout>
    </HexGrid>
  )
}

export default App
