import PptxGenJS from 'pptxgenjs'
import { SECTION_A_FIELDS } from '../data/agentTemplates'

// Implement AI brand colours (hex for pptxgenjs)
const C = {
  deepCharcoal: '1E1E1E',
  midnightIndigo: '2A2092',
  royalViolet: '6B30FF',
  lavenderMist: 'D0BFFA',
  softIvory: 'F8F2ED',
  orange: 'FF6629',
  goldenYellow: 'FFCD18',
  aquaGreen: '0DEABA',
  aquaTeal: '19D3C5',
  white: 'FFFFFF',
  textLight: '5A5A6E',
  textMuted: '9CA3AF',
}

export async function exportToPPTX(deck, signoffs = {}) {
  const pptx = new PptxGenJS()
  pptx.author = 'Implement AI'
  pptx.company = 'Implement AI'
  pptx.subject = `Agent Card Deck - ${deck.clientInfo.companyName}`
  pptx.title = deck.clientInfo.projectName || 'Agent Implementation Deck'

  // Define master slides
  pptx.defineSlideMaster({
    title: 'BRAND_DARK',
    background: { color: C.deepCharcoal },
    objects: [
      { rect: { x: 0, y: '93%', w: '100%', h: '7%', fill: { color: C.royalViolet } } },
    ],
  })

  pptx.defineSlideMaster({
    title: 'BRAND_LIGHT',
    background: { color: C.white },
    objects: [
      { rect: { x: 0, y: 0, w: '100%', h: 0.06, fill: { color: C.royalViolet } } },
      { text: { text: 'IMPLEMENT AI', options: { x: 7.5, y: 0.15, w: 2.5, fontSize: 7, color: C.textMuted, align: 'right' } } },
    ],
  })

  // ====== COVER SLIDE ======
  const coverSlide = pptx.addSlide({ masterName: 'BRAND_DARK' })

  // Logo — "Implement" in white + "AI" in purple badge
  coverSlide.addText([
    { text: 'Implement ', options: { fontSize: 18, color: C.white, bold: true } },
  ], {
    x: 2.8, y: 1.15, w: 3, h: 0.4, align: 'right',
  })
  coverSlide.addShape(pptx.ShapeType.roundRect, {
    x: 5.85, y: 1.15, w: 0.65, h: 0.4,
    fill: { color: C.royalViolet },
    rectRadius: 0.08,
  })
  coverSlide.addText('AI', {
    x: 5.85, y: 1.15, w: 0.65, h: 0.4, fontSize: 14,
    color: C.white, bold: true, align: 'center', valign: 'middle',
  })

  coverSlide.addText(deck.clientInfo.projectName || 'Agent Implementation Deck', {
    x: 0.5, y: 2.0, w: 9, fontSize: 32, color: C.white,
    bold: true, align: 'center',
  })

  coverSlide.addText(deck.clientInfo.companyName, {
    x: 0, y: 3.0, w: '100%', fontSize: 16, color: C.lavenderMist,
    align: 'center',
  })

  const metaParts = [
    deck.clientInfo.meetingDate,
    deck.clientInfo.presenter ? `Presented by ${deck.clientInfo.presenter}` : '',
    `${deck.agents.length} Agent${deck.agents.length !== 1 ? 's' : ''} Configured`,
  ].filter(Boolean).join('  |  ')

  coverSlide.addText(metaParts, {
    x: 0, y: 3.6, w: '100%', fontSize: 11, color: C.textMuted,
    align: 'center',
  })

  // ====== OVERVIEW SLIDE ======
  const overviewSlide = pptx.addSlide({ masterName: 'BRAND_LIGHT' })

  overviewSlide.addText('Agent Overview', {
    x: 0.5, y: 0.3, w: 9, fontSize: 22, color: C.deepCharcoal, bold: true,
  })

  overviewSlide.addText(`Digital knowledge workers configured for ${deck.clientInfo.companyName}`, {
    x: 0.5, y: 0.75, w: 9, fontSize: 11, color: C.textLight,
  })

  const cols = Math.min(deck.agents.length, 3)
  const cardW = (9 / cols) - 0.2
  deck.agents.forEach((agent, idx) => {
    const row = Math.floor(idx / 3)
    const col = idx % 3
    const x = 0.5 + col * (cardW + 0.2)
    const y = 1.3 + row * 1.8

    // Card background
    overviewSlide.addShape(pptx.ShapeType.roundRect, {
      x, y, w: cardW, h: 1.6,
      fill: { color: C.softIvory },
      line: { color: agent.type.color.replace('#', ''), width: 1 },
      rectRadius: 0.1,
    })

    // Color top bar
    overviewSlide.addShape(pptx.ShapeType.rect, {
      x, y, w: cardW, h: 0.08,
      fill: { color: agent.type.color.replace('#', '') },
    })

    overviewSlide.addText(agent.data.agentName || agent.type.name, {
      x: x + 0.15, y: y + 0.2, w: cardW - 0.3, fontSize: 13,
      color: C.deepCharcoal, bold: true,
    })

    overviewSlide.addText(agent.type.name, {
      x: x + 0.15, y: y + 0.55, w: cardW - 0.3, fontSize: 9,
      color: agent.type.color.replace('#', ''),
    })

    const obj = agent.data.purpose || agent.data.objective || 'Purpose not set'
    overviewSlide.addText(obj.substring(0, 120), {
      x: x + 0.15, y: y + 0.8, w: cardW - 0.3, fontSize: 8,
      color: C.textLight, breakLine: true,
    })
  })

  // ====== AGENT DETAIL SLIDES ======
  deck.agents.forEach((agent) => {
    const agentColor = agent.type.color.replace('#', '')
    const slide = pptx.addSlide({ masterName: 'BRAND_LIGHT' })

    // Color bar at top
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: '100%', h: 0.1,
      fill: { color: agentColor },
    })

    // Agent name
    slide.addText(agent.data.agentName || agent.type.name, {
      x: 0.5, y: 0.2, w: 7, fontSize: 20, color: C.deepCharcoal, bold: true,
    })

    // Type badge
    slide.addText(agent.type.name, {
      x: 0.5, y: 0.65, w: 2, fontSize: 9, color: agentColor, bold: true,
    })

    // Sign-off status
    const signed = signoffs[agent.id]
    slide.addText(signed ? 'SIGNED OFF' : 'Pending Sign-off', {
      x: 7, y: 0.25, w: 3, fontSize: 9,
      color: signed ? C.aquaGreen : C.textMuted,
      align: 'right',
    })

    // Section A marker
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.5, y: 0.95, w: 0.4, h: 0.25,
      fill: { color: C.royalViolet },
      rectRadius: 0.04,
    })
    slide.addText('A', {
      x: 0.5, y: 0.95, w: 0.4, h: 0.25, fontSize: 9,
      color: C.white, bold: true, align: 'center', valign: 'middle',
    })
    slide.addText('Universal Specification', {
      x: 1.0, y: 0.95, w: 3, h: 0.25, fontSize: 8,
      color: C.textMuted, bold: true, valign: 'middle',
    })

    // Section A fields
    const aFields = SECTION_A_FIELDS.filter(f => agent.data[f.id])
    const leftAFields = aFields.filter((_, i) => i % 2 === 0)
    const rightAFields = aFields.filter((_, i) => i % 2 === 1)

    let fieldY = 1.3
    const maxAY = renderPPTXFieldColumn(slide, leftAFields, agent.data, 0.5, fieldY)
    const maxAYR = renderPPTXFieldColumn(slide, rightAFields, agent.data, 5.2, fieldY)
    let nextY = Math.max(maxAY, maxAYR) + 0.15

    // Section B
    const sectionB = agent.type.sectionB || []
    const bFields = sectionB.filter(f => agent.data[f.id])

    if (bFields.length > 0) {
      // If there's not enough room, start a new slide
      if (nextY > 4.2) {
        const slide2 = pptx.addSlide({ masterName: 'BRAND_LIGHT' })
        slide2.addShape(pptx.ShapeType.rect, {
          x: 0, y: 0, w: '100%', h: 0.06,
          fill: { color: agentColor },
        })
        slide2.addText(`${agent.data.agentName || agent.type.name} — Section B`, {
          x: 0.5, y: 0.15, w: 7, fontSize: 14, color: C.deepCharcoal, bold: true,
        })
        nextY = 0.6
        // Section B marker
        slide2.addShape(pptx.ShapeType.roundRect, {
          x: 0.5, y: nextY, w: 0.4, h: 0.25,
          fill: { color: agentColor },
          rectRadius: 0.04,
        })
        slide2.addText('B', {
          x: 0.5, y: nextY, w: 0.4, h: 0.25, fontSize: 9,
          color: C.white, bold: true, align: 'center', valign: 'middle',
        })
        slide2.addText(`${agent.type.name} Parameters`, {
          x: 1.0, y: nextY, w: 3, h: 0.25, fontSize: 8,
          color: agentColor, bold: true, valign: 'middle',
        })

        nextY += 0.35
        const leftBFields = bFields.filter((_, i) => i % 2 === 0)
        const rightBFields = bFields.filter((_, i) => i % 2 === 1)
        renderPPTXFieldColumn(slide2, leftBFields, agent.data, 0.5, nextY)
        renderPPTXFieldColumn(slide2, rightBFields, agent.data, 5.2, nextY)
      } else {
        // Section B marker on same slide
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 0.5, y: nextY, w: 0.4, h: 0.25,
          fill: { color: agentColor },
          rectRadius: 0.04,
        })
        slide.addText('B', {
          x: 0.5, y: nextY, w: 0.4, h: 0.25, fontSize: 9,
          color: C.white, bold: true, align: 'center', valign: 'middle',
        })
        slide.addText(`${agent.type.name} Parameters`, {
          x: 1.0, y: nextY, w: 3, h: 0.25, fontSize: 8,
          color: agentColor, bold: true, valign: 'middle',
        })

        nextY += 0.35
        const leftBFields = bFields.filter((_, i) => i % 2 === 0)
        const rightBFields = bFields.filter((_, i) => i % 2 === 1)
        renderPPTXFieldColumn(slide, leftBFields, agent.data, 0.5, nextY)
        renderPPTXFieldColumn(slide, rightBFields, agent.data, 5.2, nextY)
      }
    }

    // Scope boxes at bottom (on main slide)
    if (agent.data._inScope || agent.data._outOfScope) {
      const scopeY = 4.0

      if (agent.data._inScope) {
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 0.5, y: scopeY, w: 4.2, h: 1,
          fill: { color: 'E6FFF8' },
          line: { color: C.aquaGreen, width: 0.5 },
          rectRadius: 0.05,
        })
        slide.addText('IN SCOPE', {
          x: 0.65, y: scopeY + 0.05, w: 3.9, fontSize: 8, color: C.deepCharcoal, bold: true,
        })
        slide.addText(agent.data._inScope.substring(0, 200), {
          x: 0.65, y: scopeY + 0.3, w: 3.9, fontSize: 8, color: C.textLight, breakLine: true,
        })
      }

      if (agent.data._outOfScope) {
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 5.2, y: scopeY, w: 4.2, h: 1,
          fill: { color: 'FFF8E6' },
          line: { color: C.goldenYellow, width: 0.5 },
          rectRadius: 0.05,
        })
        slide.addText('OUT OF SCOPE', {
          x: 5.35, y: scopeY + 0.05, w: 3.9, fontSize: 8, color: C.deepCharcoal, bold: true,
        })
        slide.addText(agent.data._outOfScope.substring(0, 200), {
          x: 5.35, y: scopeY + 0.3, w: 3.9, fontSize: 8, color: C.textLight, breakLine: true,
        })
      }
    }
  })

  // ====== DELIVERY GATES SLIDE ======
  if (deck.deliveryGates && deck.deliveryGates.length > 0) {
    const gatesSlide = pptx.addSlide({ masterName: 'BRAND_LIGHT' })

    gatesSlide.addText('Delivery Gates', {
      x: 0.5, y: 0.3, w: 9, fontSize: 22, color: C.deepCharcoal, bold: true,
    })

    gatesSlide.addText('Three checkpoints from specification to live delivery', {
      x: 0.5, y: 0.75, w: 9, fontSize: 11, color: C.textLight,
    })

    deck.deliveryGates.forEach((gate, idx) => {
      const gateW = 2.8
      const gateX = 0.5 + idx * (gateW + 0.3)
      const gateY = 1.3

      gatesSlide.addShape(pptx.ShapeType.roundRect, {
        x: gateX, y: gateY, w: gateW, h: 1.6,
        fill: { color: C.softIvory },
        rectRadius: 0.08,
      })

      // Number circle
      gatesSlide.addShape(pptx.ShapeType.ellipse, {
        x: gateX + gateW / 2 - 0.2, y: gateY + 0.15, w: 0.4, h: 0.4,
        fill: { color: C.royalViolet },
      })
      gatesSlide.addText(String(idx + 1), {
        x: gateX + gateW / 2 - 0.2, y: gateY + 0.15, w: 0.4, h: 0.4,
        fontSize: 12, color: C.white, bold: true, align: 'center', valign: 'middle',
      })

      gatesSlide.addText(gate.name, {
        x: gateX + 0.1, y: gateY + 0.65, w: gateW - 0.2,
        fontSize: 12, color: C.deepCharcoal, bold: true, align: 'center',
      })

      gatesSlide.addText(gate.description, {
        x: gateX + 0.1, y: gateY + 0.95, w: gateW - 0.2,
        fontSize: 8, color: C.textLight, align: 'center', breakLine: true,
      })
    })

    // Fix vs Change section
    gatesSlide.addText('Fix vs Change Gate', {
      x: 0.5, y: 3.3, w: 9, fontSize: 16, color: C.deepCharcoal, bold: true,
    })

    const fvcItems = [
      { label: 'Fix (In-Scope)', desc: 'Agent not performing to signed spec. Covered under agreement.', color: C.aquaGreen },
      { label: 'Change Request', desc: 'New work not in the Agent Card. Assessed and scoped separately.', color: C.goldenYellow },
      { label: 'Out-of-Type', desc: 'Requires a new agent card entirely. Falls outside current type.', color: C.orange },
    ]

    fvcItems.forEach((item, idx) => {
      const fvcW = 2.8
      const fvcX = 0.5 + idx * (fvcW + 0.3)
      const fvcY = 3.7

      // Left accent bar
      gatesSlide.addShape(pptx.ShapeType.rect, {
        x: fvcX, y: fvcY, w: 0.06, h: 0.8,
        fill: { color: item.color },
      })

      gatesSlide.addText(item.label, {
        x: fvcX + 0.15, y: fvcY + 0.05, w: fvcW - 0.2,
        fontSize: 10, color: C.deepCharcoal, bold: true,
      })

      gatesSlide.addText(item.desc, {
        x: fvcX + 0.15, y: fvcY + 0.35, w: fvcW - 0.2,
        fontSize: 8, color: C.textLight, breakLine: true,
      })
    })
  }

  // ====== TIMELINE SLIDE ======
  const timeSlide = pptx.addSlide({ masterName: 'BRAND_LIGHT' })

  timeSlide.addText('Project Timeline', {
    x: 0.5, y: 0.3, w: 9, fontSize: 22, color: C.deepCharcoal, bold: true,
  })

  timeSlide.addText(`Estimated delivery: ${deck.timeline.totalEstimate}`, {
    x: 0.5, y: 0.75, w: 9, fontSize: 11, color: C.textLight,
  })

  deck.timeline.phases.forEach((phase, idx) => {
    const y = 1.3 + idx * 0.8

    // Circle number
    timeSlide.addShape(pptx.ShapeType.ellipse, {
      x: 0.7, y: y + 0.05, w: 0.4, h: 0.4,
      fill: { color: C.royalViolet },
    })
    timeSlide.addText(String(idx + 1), {
      x: 0.7, y: y + 0.05, w: 0.4, h: 0.4, fontSize: 12,
      color: C.white, bold: true, align: 'center', valign: 'middle',
    })

    // Connector line
    if (idx < deck.timeline.phases.length - 1) {
      timeSlide.addShape(pptx.ShapeType.rect, {
        x: 0.88, y: y + 0.45, w: 0.04, h: 0.35,
        fill: { color: C.lavenderMist },
      })
    }

    // Phase info
    timeSlide.addText(phase.name, {
      x: 1.4, y, w: 5, fontSize: 14, color: C.deepCharcoal, bold: true,
    })
    timeSlide.addText(phase.duration, {
      x: 1.4, y: y + 0.3, w: 5, fontSize: 10, color: C.royalViolet,
    })
  })

  // Revision policy box
  const rpY = 1.3 + deck.timeline.phases.length * 0.8 + 0.3
  timeSlide.addShape(pptx.ShapeType.roundRect, {
    x: 0.5, y: rpY, w: 9, h: 0.8,
    fill: { color: C.softIvory },
    rectRadius: 0.08,
  })
  timeSlide.addText('Revision Policy', {
    x: 0.7, y: rpY + 0.05, w: 8.6, fontSize: 11, color: C.deepCharcoal, bold: true,
  })
  timeSlide.addText(deck.revisionPolicy.description, {
    x: 0.7, y: rpY + 0.35, w: 8.6, fontSize: 9, color: C.textLight,
  })

  // ====== BACKLOG SLIDE ======
  if (deck.backlog.length > 0) {
    const blSlide = pptx.addSlide({ masterName: 'BRAND_LIGHT' })

    blSlide.addText('Future Phase Backlog', {
      x: 0.5, y: 0.3, w: 9, fontSize: 22, color: C.deepCharcoal, bold: true,
    })

    const tableRows = [
      [
        { text: '#', options: { bold: true, color: C.white, fill: { color: C.royalViolet }, align: 'center' } },
        { text: 'Item', options: { bold: true, color: C.white, fill: { color: C.royalViolet } } },
        { text: 'Priority', options: { bold: true, color: C.white, fill: { color: C.royalViolet }, align: 'center' } },
      ],
      ...deck.backlog.map((item, idx) => [
        { text: String(idx + 1), options: { align: 'center' } },
        { text: item.text },
        { text: item.priority, options: { align: 'center' } },
      ]),
    ]

    blSlide.addTable(tableRows, {
      x: 0.5, y: 1.0, w: 9,
      fontSize: 10,
      color: C.deepCharcoal,
      border: { pt: 0.5, color: 'E0DAD4' },
      colW: [0.6, 7.2, 1.2],
      rowH: 0.35,
      autoPage: true,
    })
  }

  // ====== SUMMARY SLIDE ======
  const sumSlide = pptx.addSlide({ masterName: 'BRAND_LIGHT' })

  sumSlide.addText('Summary & Next Steps', {
    x: 0.5, y: 0.3, w: 9, fontSize: 22, color: C.deepCharcoal, bold: true,
  })

  // Stats
  const stats = [
    { label: 'AGENTS CONFIGURED', value: String(deck.agents.length) },
    { label: 'SIGNED OFF', value: `${Object.values(signoffs).filter(Boolean).length}/${deck.agents.length}` },
    { label: 'BACKLOG ITEMS', value: String(deck.backlog.length) },
    { label: 'EST. TIMELINE', value: deck.timeline.totalEstimate },
  ]

  stats.forEach((stat, idx) => {
    const x = 0.5 + idx * 2.4
    sumSlide.addShape(pptx.ShapeType.roundRect, {
      x, y: 0.9, w: 2.2, h: 1,
      fill: { color: C.softIvory },
      rectRadius: 0.08,
    })
    sumSlide.addText(stat.label, {
      x, y: 0.95, w: 2.2, fontSize: 7, color: C.textMuted, bold: true, align: 'center',
    })
    sumSlide.addText(stat.value, {
      x, y: 1.25, w: 2.2, fontSize: 22, color: C.royalViolet, bold: true, align: 'center',
    })
  })

  // Next steps
  sumSlide.addText('Next Steps', {
    x: 0.5, y: 2.2, w: 9, fontSize: 16, color: C.deepCharcoal, bold: true,
  })

  const nextSteps = [
    'Review and sign off agent specifications (Gate 1)',
    'Client provides required data sources and access',
    'Development & configuration phase begins',
    'Internal QA against signed spec (Gate 2)',
    'Live delivery call — demo and sign-off (Gate 3)',
  ]

  nextSteps.forEach((step, idx) => {
    const y = 2.7 + idx * 0.4
    sumSlide.addShape(pptx.ShapeType.roundRect, {
      x: 0.5, y, w: 9, h: 0.32,
      fill: { color: C.softIvory },
      rectRadius: 0.04,
    })
    sumSlide.addShape(pptx.ShapeType.rect, {
      x: 0.5, y, w: 0.06, h: 0.32,
      fill: { color: C.royalViolet },
    })
    sumSlide.addText(`${idx + 1}. ${step}`, {
      x: 0.75, y, w: 8.5, h: 0.32, fontSize: 10, color: C.deepCharcoal, valign: 'middle',
    })
  })

  // Save
  const filename = `${deck.clientInfo.companyName.replace(/\s+/g, '-')}-Agent-Deck-${deck.clientInfo.meetingDate}`
  await pptx.writeFile({ fileName: filename })
}

function renderPPTXFieldColumn(slide, fields, data, xPos, startY) {
  let y = startY
  fields.forEach(({ id, label, type }) => {
    const value = data[id]
    if (!value || y > 4.8) return

    slide.addText(label.toUpperCase(), {
      x: xPos, y, w: 4.2, fontSize: 8,
      color: '9CA3AF', bold: true,
    })
    y += 0.25

    let displayText = ''
    if (typeof value === 'string') {
      displayText = value.substring(0, 200)
    } else if (Array.isArray(value)) {
      if (type === 'metrics') {
        displayText = value.filter(m => m.name).map(m => `${m.name}: ${m.target}`).join('\n')
      } else if (type === 'steps') {
        displayText = value.map((s, i) => `${i + 1}. ${s}`).join('\n')
      } else {
        displayText = value.join(', ')
      }
    }

    if (displayText) {
      slide.addText(displayText, {
        x: xPos, y, w: 4.2, fontSize: 10,
        color: '1E1E1E', breakLine: true, lineSpacing: 14,
      })
      const lines = Math.ceil(displayText.length / 50) + (displayText.split('\n').length - 1)
      y += Math.max(0.35, lines * 0.2)
    }
  })
  return y
}
