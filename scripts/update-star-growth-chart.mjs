#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const owner = 'flaqai';
const repo = 'backlink_skills';
const apiVersion = '2022-11-28';
const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': `${owner}-${repo}-readme-chart`,
  'X-GitHub-Api-Version': apiVersion,
};

async function getJson(url) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

const repoData = await getJson(`https://api.github.com/repos/${owner}/${repo}`);
const eventPages = await Promise.all(
  [1, 2, 3].map((page) =>
    getJson(`https://api.github.com/repos/${owner}/${repo}/events?per_page=100&page=${page}`),
  ),
);

// Pagination can shift while new events arrive. De-duplicate by GitHub event ID
// before calculating the observed window.
const events = [...new Map(eventPages.flat().map((event) => [event.id, event])).values()];
const starEvents = events
  .filter((event) => event.type === 'WatchEvent')
  .map((event) => new Date(event.created_at))
  .sort((a, b) => a - b);

if (starEvents.length < 2) {
  throw new Error('Not enough public WatchEvent data to draw a trend.');
}

const currentStars = repoData.stargazers_count;
const currentForks = repoData.forks_count;
const baselineStars = Math.max(0, currentStars - starEvents.length);
const startTime = starEvents[0].getTime();
const endTime = starEvents.at(-1).getTime();
const durationHours = (endTime - startTime) / 3_600_000;

const width = 1200;
const height = 620;
const plot = { x: 90, y: 210, width: 1020, height: 300 };
const yMin = Math.max(0, Math.floor((baselineStars - 10) / 50) * 50);
const yMax = Math.ceil((currentStars + 10) / 50) * 50;
const scaleX = (time) => plot.x + ((time - startTime) / (endTime - startTime)) * plot.width;
const scaleY = (value) =>
  plot.y + plot.height - ((value - yMin) / Math.max(1, yMax - yMin)) * plot.height;

const points = [
  [scaleX(startTime), scaleY(baselineStars)],
  ...starEvents.map((date, index) => [scaleX(date.getTime()), scaleY(baselineStars + index + 1)]),
];
const linePoints = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
const areaPoints = [
  `${plot.x},${plot.y + plot.height}`,
  linePoints,
  `${plot.x + plot.width},${plot.y + plot.height}`,
].join(' ');

const formatUtc = (date, withTime = true) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'UTC',
    month: 'short',
    day: '2-digit',
    ...(withTime ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}),
  }).format(date);

const yTicks = Array.from({ length: 6 }, (_, index) =>
  Math.round(yMin + ((yMax - yMin) * index) / 5),
);
const xTicks = Array.from({ length: 5 }, (_, index) =>
  new Date(startTime + ((endTime - startTime) * index) / 4),
);

const yGrid = yTicks
  .map((value) => {
    const y = scaleY(value);
    return `<line x1="${plot.x}" y1="${y}" x2="${plot.x + plot.width}" y2="${y}" class="grid"/>
      <text x="${plot.x - 18}" y="${y + 5}" text-anchor="end" class="axis">${value}</text>`;
  })
  .join('\n');
const xGrid = xTicks
  .map((date) => {
    const x = scaleX(date.getTime());
    return `<line x1="${x}" y1="${plot.y}" x2="${x}" y2="${plot.y + plot.height}" class="grid vertical"/>
      <text x="${x}" y="${plot.y + plot.height + 34}" text-anchor="middle" class="axis">${formatUtc(date)}</text>`;
  })
  .join('\n');

const latestAt = new Date(repoData.updated_at);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">GitHub Star Growth for ${owner}/${repo}</title>
  <desc id="desc">Recent GitHub public event window showing ${starEvents.length} star events and a current total of ${currentStars} stars.</desc>
  <defs>
    <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#071225"/>
      <stop offset="0.55" stop-color="#0b1f42"/>
      <stop offset="1" stop-color="#17113f"/>
    </linearGradient>
    <linearGradient id="line" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#22d3ee"/>
      <stop offset="1" stop-color="#8b5cf6"/>
    </linearGradient>
    <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#22d3ee" stop-opacity="0.32"/>
      <stop offset="1" stop-color="#8b5cf6" stop-opacity="0.03"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <style>
      .title{font:700 34px Inter,ui-sans-serif,system-ui,sans-serif;fill:#f8fafc}
      .subtitle{font:400 16px Inter,ui-sans-serif,system-ui,sans-serif;fill:#94a3b8}
      .metric{font:700 30px Inter,ui-sans-serif,system-ui,sans-serif;fill:#f8fafc}
      .label{font:600 13px Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:1.2px;fill:#7dd3fc}
      .axis{font:500 12px Inter,ui-sans-serif,system-ui,sans-serif;fill:#94a3b8}
      .note{font:400 12px Inter,ui-sans-serif,system-ui,sans-serif;fill:#64748b}
      .grid{stroke:#334155;stroke-width:1;stroke-opacity:.55}.vertical{stroke-opacity:.28}
    </style>
  </defs>
  <rect width="${width}" height="${height}" rx="28" fill="url(#background)"/>
  <circle cx="1050" cy="60" r="180" fill="#4f46e5" opacity=".08"/>
  <circle cx="100" cy="590" r="180" fill="#06b6d4" opacity=".06"/>

  <text x="64" y="66" class="title">GitHub Stars · Recent Growth</text>
  <text x="64" y="96" class="subtitle">${owner}/${repo} · public GitHub event window · UTC</text>

  <g transform="translate(64 122)">
    <rect width="210" height="66" rx="14" fill="#0f2a4d" stroke="#1d4ed8" stroke-opacity=".65"/>
    <text x="20" y="24" class="label">CURRENT STARS</text><text x="20" y="54" class="metric">${currentStars}</text>
  </g>
  <g transform="translate(290 122)">
    <rect width="210" height="66" rx="14" fill="#0f2a4d" stroke="#0891b2" stroke-opacity=".65"/>
    <text x="20" y="24" class="label">STAR EVENTS</text><text x="20" y="54" class="metric">+${starEvents.length}</text>
  </g>
  <g transform="translate(516 122)">
    <rect width="210" height="66" rx="14" fill="#0f2a4d" stroke="#7c3aed" stroke-opacity=".65"/>
    <text x="20" y="24" class="label">OBSERVED WINDOW</text><text x="20" y="54" class="metric">${durationHours.toFixed(1)}h</text>
  </g>
  <g transform="translate(742 122)">
    <rect width="210" height="66" rx="14" fill="#0f2a4d" stroke="#7c3aed" stroke-opacity=".65"/>
    <text x="20" y="24" class="label">CURRENT FORKS</text><text x="20" y="54" class="metric">${currentForks}</text>
  </g>

  ${yGrid}
  ${xGrid}
  <polygon points="${areaPoints}" fill="url(#area)"/>
  <polyline points="${linePoints}" fill="none" stroke="url(#line)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>
  <circle cx="${points[0][0]}" cy="${points[0][1]}" r="7" fill="#22d3ee"/>
  <circle cx="${points.at(-1)[0]}" cy="${points.at(-1)[1]}" r="9" fill="#a78bfa" stroke="#f8fafc" stroke-width="3"/>
  <text x="${points[0][0] + 12}" y="${points[0][1] - 14}" class="axis">~${baselineStars} baseline</text>
  <text x="${points.at(-1)[0] - 12}" y="${points.at(-1)[1] - 16}" text-anchor="end" class="label">${currentStars} STARS</text>
  <text x="64" y="580" class="note">Source: GitHub REST API · latest 300 repository events · generated ${latestAt.toISOString().slice(0, 16).replace('T', ' ')} UTC</text>
  <text x="64" y="600" class="note">Method: baseline = current stars − observed WatchEvents; unstars may cause small differences.</text>
</svg>`;

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(scriptDir, '..', 'assets');
await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, 'github-stars-growth.svg'), svg, 'utf8');

console.log(
  JSON.stringify(
    {
      currentStars,
      currentForks,
      observedStarEvents: starEvents.length,
      observedFrom: starEvents[0].toISOString(),
      observedTo: starEvents.at(-1).toISOString(),
      baselineStars,
      output: 'assets/github-stars-growth.svg',
    },
    null,
    2,
  ),
);
