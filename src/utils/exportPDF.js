import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { SECTION_A_FIELDS } from '../data/agentTemplates'

// Implement AI brand colours
const COLORS = {
  deepCharcoal: [30, 30, 30],
  midnightIndigo: [42, 32, 146],
  royalViolet: [107, 48, 255],
  lavenderMist: [208, 191, 250],
  softIvory: [248, 242, 237],
  orange: [255, 102, 41],
  goldenYellow: [255, 205, 24],
  aquaGreen: [13, 234, 186],
  aquaTeal: [25, 211, 197],
  white: [255, 255, 255],
  textLight: [90, 90, 110],
  textMuted: [156, 163, 175],
}

export async function exportToPDF(deck, signoffs = {}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()

  // ====== Cover Page ======
  doc.setFillColor(...COLORS.deepCharcoal)
  doc.rect(0, 0, W, H, 'F')

  // Gradient accent bar
  doc.setFillColor(...COLORS.royalViolet)
  doc.rect(0, H - 8, W, 8, 'F')

  // Logo
  doc.setTextColor(...COLORS.aquaGreen)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('IMPLEMENT AI', W / 2, 45, { align: 'center' })

  // Title
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(32)
  doc.text(deck.clientInfo.projectName || 'Agent Implementation Deck', W / 2, 72, { align: 'center' })

  // Client info
  doc.setFontSize(14)
  doc.setTextColor(...COLORS.lavenderMist)
  doc.text(deck.clientInfo.companyName, W / 2, 88, { align: 'center' })

  doc.setFontSize(11)
  doc.setTextColor(...COLORS.textMuted)
  const metaLine = [
    deck.clientInfo.meetingDate,
    deck.clientInfo.presenter ? `Presented by ${deck.clientInfo.presenter}` : '',
    `${deck.agents.length} Agent${deck.agents.length !== 1 ? 's' : ''} Configured`,
  ].filter(Boolean).join('  |  ')
  doc.text(metaLine, W / 2, 100, { align: 'center' })

  // Contact info
  if (deck.clientInfo.contactName) {
    doc.setFontSize(10)
    doc.setTextColor(...COLORS.textMuted)
    doc.text(`Contact: ${deck.clientInfo.contactName}${deck.clientInfo.contactRole ? ` (${deck.clientInfo.contactRole})` : ''}`, W / 2, 115, { align: 'center' })
  }

  // ====== Overview Page ======
  doc.addPage()
  drawPageHeader(doc, 'Agent Overview', W)

  let y = 38
  doc.setFontSize(11)
  doc.setTextColor(...COLORS.textLight)
  doc.text(`Digital knowledge workers configured for ${deck.clientInfo.companyName}`, 20, y)
  y += 12

  deck.agents.forEach((agent) => {
    if (y > H - 40) {
      doc.addPage()
      drawPageHeader(doc, 'Agent Overview (cont.)', W)
      y = 38
    }

    // Agent card
    doc.setFillColor(...COLORS.softIvory)
    doc.roundedRect(20, y, W - 40, 28, 3, 3, 'F')

    // Color accent
    const agentColor = hexToRgb(agent.type.color)
    doc.setFillColor(...agentColor)
    doc.rect(20, y, 4, 28, 'F')

    doc.setFontSize(13)
    doc.setTextColor(...COLORS.deepCharcoal)
    doc.setFont('helvetica', 'bold')
    doc.text(agent.data.agentName || agent.type.name, 30, y + 10)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...agentColor)
    doc.text(agent.type.name, 30, y + 17)

    doc.setTextColor(...COLORS.textLight)
    doc.setFontSize(9)
    const objText = agent.data.purpose || agent.data.objective || 'Purpose not set'
    doc.text(doc.splitTextToSize(objText, W - 80), 30, y + 23)

    y += 34
  })

  // ====== Agent Detail Pages ======
  deck.agents.forEach((agent) => {
    doc.addPage()
    const agentColor = hexToRgb(agent.type.color)

    // Header with color bar
    doc.setFillColor(...agentColor)
    doc.rect(0, 0, W, 6, 'F')

    doc.setFontSize(20)
    doc.setTextColor(...COLORS.deepCharcoal)
    doc.setFont('helvetica', 'bold')
    doc.text(agent.data.agentName || agent.type.name, 20, 22)

    doc.setFontSize(10)
    doc.setTextColor(...agentColor)
    doc.text(agent.type.name, 20, 30)

    // Signoff status
    const signed = signoffs[agent.id]
    doc.setFontSize(9)
    doc.setTextColor(...(signed ? COLORS.aquaGreen : COLORS.textMuted))
    doc.text(signed ? 'SIGNED OFF' : 'Pending Sign-off', W - 20, 22, { align: 'right' })

    let y = 40

    // Section A header
    doc.setFillColor(...COLORS.royalViolet)
    doc.roundedRect(20, y, 22, 6, 1, 1, 'F')
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.white)
    doc.setFont('helvetica', 'bold')
    doc.text('SEC A', 31, y + 4.2, { align: 'center' })
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.textMuted)
    doc.text('Universal Specification', 46, y + 4.2)
    y += 12

    // Section A fields
    SECTION_A_FIELDS.forEach(field => {
      const value = agent.data[field.id]
      if (!value) return

      if (y > H - 30) {
        doc.addPage()
        doc.setFillColor(...agentColor)
        doc.rect(0, 0, W, 3, 'F')
        y = 16
      }

      y = renderPDFField(doc, field, value, y, W, H, agentColor)
    })

    // Section B header
    if (agent.type.sectionB && agent.type.sectionB.some(f => agent.data[f.id])) {
      y += 4
      if (y > H - 30) {
        doc.addPage()
        doc.setFillColor(...agentColor)
        doc.rect(0, 0, W, 3, 'F')
        y = 16
      }

      doc.setFillColor(...agentColor)
      doc.roundedRect(20, y, 22, 6, 1, 1, 'F')
      doc.setFontSize(7)
      doc.setTextColor(...COLORS.white)
      doc.setFont('helvetica', 'bold')
      doc.text('SEC B', 31, y + 4.2, { align: 'center' })
      doc.setFontSize(9)
      doc.setTextColor(...agentColor)
      doc.text(`${agent.type.name} Parameters`, 46, y + 4.2)
      y += 12

      agent.type.sectionB.forEach(field => {
        const value = agent.data[field.id]
        if (!value) return

        if (y > H - 30) {
          doc.addPage()
          doc.setFillColor(...agentColor)
          doc.rect(0, 0, W, 3, 'F')
          y = 16
        }

        y = renderPDFField(doc, field, value, y, W, H, agentColor)
      })
    }

    // Scope
    if (agent.data._inScope || agent.data._outOfScope) {
      if (y > H - 50) {
        doc.addPage()
        y = 16
      }
      y += 4

      if (agent.data._inScope) {
        doc.setFillColor(13, 234, 186, 20)
        doc.roundedRect(20, y, (W - 50) / 2, 30, 2, 2, 'F')
        doc.setFillColor(...COLORS.aquaGreen)
        doc.rect(20, y, 3, 30, 'F')
        doc.setFontSize(9)
        doc.setTextColor(...COLORS.deepCharcoal)
        doc.setFont('helvetica', 'bold')
        doc.text('IN SCOPE', 28, y + 7)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        const inLines = doc.splitTextToSize(agent.data._inScope, (W - 60) / 2)
        doc.text(inLines.slice(0, 4), 28, y + 13)
      }

      if (agent.data._outOfScope) {
        const xOff = 20 + (W - 50) / 2 + 10
        doc.setFillColor(255, 205, 24, 20)
        doc.roundedRect(xOff, y, (W - 50) / 2, 30, 2, 2, 'F')
        doc.setFillColor(...COLORS.goldenYellow)
        doc.rect(xOff, y, 3, 30, 'F')
        doc.setFontSize(9)
        doc.setTextColor(...COLORS.deepCharcoal)
        doc.setFont('helvetica', 'bold')
        doc.text('OUT OF SCOPE', xOff + 8, y + 7)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        const outLines = doc.splitTextToSize(agent.data._outOfScope, (W - 60) / 2)
        doc.text(outLines.slice(0, 4), xOff + 8, y + 13)
      }
    }

    // Acceptance criteria
    if (agent.data._acceptanceCriteria) {
      y += 36
      if (y > H - 20) { doc.addPage(); y = 16 }
      doc.setFontSize(9)
      doc.setTextColor(...COLORS.textMuted)
      doc.setFont('helvetica', 'bold')
      doc.text('ACCEPTANCE CRITERIA', 20, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COLORS.deepCharcoal)
      doc.setFontSize(10)
      const acLines = doc.splitTextToSize(agent.data._acceptanceCriteria, W - 40)
      doc.text(acLines, 20, y)
    }
  })

  // ====== Delivery Gates Page ======
  if (deck.deliveryGates && deck.deliveryGates.length > 0) {
    doc.addPage()
    drawPageHeader(doc, 'Delivery Gates', W)

    let gy = 38
    doc.setFontSize(11)
    doc.setTextColor(...COLORS.textLight)
    doc.text('Three checkpoints from specification to live delivery', 20, gy)
    gy += 16

    deck.deliveryGates.forEach((gate, idx) => {
      const gateX = 20 + idx * ((W - 40) / 3 + 3)
      const gateW = (W - 52) / 3

      doc.setFillColor(...COLORS.softIvory)
      doc.roundedRect(gateX, gy, gateW, 40, 3, 3, 'F')

      // Number circle
      doc.setFillColor(...COLORS.royalViolet)
      doc.circle(gateX + gateW / 2, gy + 10, 6, 'F')
      doc.setTextColor(...COLORS.white)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(String(idx + 1), gateX + gateW / 2, gy + 11, { align: 'center', baseline: 'middle' })

      doc.setTextColor(...COLORS.deepCharcoal)
      doc.setFontSize(11)
      doc.text(gate.name, gateX + gateW / 2, gy + 23, { align: 'center' })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...COLORS.textLight)
      const descLines = doc.splitTextToSize(gate.description, gateW - 10)
      doc.text(descLines, gateX + gateW / 2, gy + 30, { align: 'center' })
    })

    // Fix vs Change section
    gy += 56
    doc.setFontSize(14)
    doc.setTextColor(...COLORS.deepCharcoal)
    doc.setFont('helvetica', 'bold')
    doc.text('Fix vs Change Gate', 20, gy)
    gy += 10

    const fvcItems = [
      { label: 'Fix (In-Scope)', desc: 'Agent not performing to signed spec. Covered under agreement.', color: COLORS.aquaGreen },
      { label: 'Change Request', desc: 'New work not in the Agent Card. Assessed and scoped separately.', color: COLORS.goldenYellow },
      { label: 'Out-of-Type', desc: 'Requires a new agent card entirely. Falls outside current type.', color: COLORS.orange },
    ]

    fvcItems.forEach((item, idx) => {
      const fvcX = 20 + idx * ((W - 40) / 3 + 3)
      const fvcW = (W - 52) / 3

      doc.setFillColor(...item.color)
      doc.rect(fvcX, gy, 3, 24, 'F')

      doc.setFontSize(10)
      doc.setTextColor(...COLORS.deepCharcoal)
      doc.setFont('helvetica', 'bold')
      doc.text(item.label, fvcX + 8, gy + 7)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...COLORS.textLight)
      const dLines = doc.splitTextToSize(item.desc, fvcW - 12)
      doc.text(dLines, fvcX + 8, gy + 14)
    })
  }

  // ====== Timeline Page ======
  doc.addPage()
  drawPageHeader(doc, 'Project Timeline', W)

  let ty = 42
  doc.setFontSize(11)
  doc.setTextColor(...COLORS.textLight)
  doc.text(`Estimated delivery: ${deck.timeline.totalEstimate}`, 20, ty)
  ty += 16

  deck.timeline.phases.forEach((phase, idx) => {
    // Circle
    doc.setFillColor(...COLORS.royalViolet)
    doc.circle(32, ty, 8, 'F')
    doc.setTextColor(...COLORS.white)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(String(idx + 1), 32, ty + 1, { align: 'center', baseline: 'middle' })

    // Phase info
    doc.setTextColor(...COLORS.deepCharcoal)
    doc.setFontSize(13)
    doc.text(phase.name, 48, ty - 2)
    doc.setFontSize(10)
    doc.setTextColor(...COLORS.royalViolet)
    doc.text(phase.duration, 48, ty + 6)

    // Connector line
    if (idx < deck.timeline.phases.length - 1) {
      doc.setDrawColor(...COLORS.lavenderMist)
      doc.setLineWidth(0.5)
      doc.line(32, ty + 8, 32, ty + 24)
    }

    ty += 30
  })

  // Revision policy
  ty += 10
  doc.setFillColor(...COLORS.softIvory)
  doc.roundedRect(20, ty, W - 40, 22, 3, 3, 'F')
  doc.setFontSize(11)
  doc.setTextColor(...COLORS.deepCharcoal)
  doc.setFont('helvetica', 'bold')
  doc.text('Revision Policy', 28, ty + 8)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.textLight)
  doc.text(deck.revisionPolicy.description, 28, ty + 16)

  // ====== Backlog Page (if items) ======
  if (deck.backlog.length > 0) {
    doc.addPage()
    drawPageHeader(doc, 'Future Phase Backlog', W)

    doc.autoTable({
      startY: 38,
      head: [['#', 'Item', 'Priority']],
      body: deck.backlog.map((item, idx) => [idx + 1, item.text, item.priority]),
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.royalViolet,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 10,
        textColor: COLORS.deepCharcoal,
      },
      alternateRowStyles: {
        fillColor: COLORS.softIvory,
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
      },
      margin: { left: 20, right: 20 },
    })
  }

  // ====== Summary Page ======
  doc.addPage()
  drawPageHeader(doc, 'Summary & Next Steps', W)

  let sy = 42

  // Stats row
  const stats = [
    { label: 'Agents Configured', value: String(deck.agents.length) },
    { label: 'Signed Off', value: `${Object.values(signoffs).filter(Boolean).length} / ${deck.agents.length}` },
    { label: 'Backlog Items', value: String(deck.backlog.length) },
    { label: 'Est. Timeline', value: deck.timeline.totalEstimate },
  ]

  const statW = (W - 40 - 30) / 4
  stats.forEach((stat, idx) => {
    const x = 20 + idx * (statW + 10)
    doc.setFillColor(...COLORS.softIvory)
    doc.roundedRect(x, sy, statW, 28, 3, 3, 'F')
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.textMuted)
    doc.setFont('helvetica', 'bold')
    doc.text(stat.label.toUpperCase(), x + statW / 2, sy + 8, { align: 'center' })
    doc.setFontSize(16)
    doc.setTextColor(...COLORS.royalViolet)
    doc.text(stat.value, x + statW / 2, sy + 22, { align: 'center' })
  })

  sy += 40

  // Next steps
  doc.setFontSize(14)
  doc.setTextColor(...COLORS.deepCharcoal)
  doc.setFont('helvetica', 'bold')
  doc.text('Next Steps', 20, sy)
  sy += 10

  const nextSteps = [
    'Review and sign off agent specifications (Gate 1)',
    'Client provides required data sources and access',
    'Development & configuration phase begins',
    'Internal QA against signed spec (Gate 2)',
    'Live delivery call — demo and sign-off (Gate 3)',
  ]

  nextSteps.forEach((step, idx) => {
    doc.setFillColor(...COLORS.softIvory)
    doc.roundedRect(20, sy, W - 40, 10, 2, 2, 'F')
    doc.setFillColor(...COLORS.royalViolet)
    doc.rect(20, sy, 3, 10, 'F')
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.deepCharcoal)
    doc.text(`${idx + 1}. ${step}`, 28, sy + 7)
    sy += 14
  })

  // Footer
  addPageNumbers(doc)

  // Save
  const filename = `${deck.clientInfo.companyName.replace(/\s+/g, '-')}-Agent-Deck-${deck.clientInfo.meetingDate}.pdf`
  doc.save(filename)
}

function renderPDFField(doc, field, value, y, W, H, agentColor) {
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.textMuted)
  doc.setFont('helvetica', 'bold')
  doc.text(field.label.toUpperCase(), 20, y)
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.deepCharcoal)
  doc.setFontSize(10)

  if (typeof value === 'string') {
    const lines = doc.splitTextToSize(value, W - 40)
    doc.text(lines, 20, y)
    y += lines.length * 5 + 4
  } else if (Array.isArray(value)) {
    if (field.type === 'metrics') {
      value.filter(m => m.name).forEach(m => {
        doc.text(`${m.name}: ${m.target}`, 24, y)
        y += 5
      })
      y += 2
    } else if (field.type === 'steps') {
      value.forEach((step, i) => {
        doc.text(`${i + 1}. ${step}`, 24, y)
        y += 5
      })
      y += 2
    } else {
      doc.text(value.join(', '), 20, y)
      y += 6
    }
  }

  return y
}

function drawPageHeader(doc, title, W) {
  doc.setFillColor(...COLORS.royalViolet)
  doc.rect(0, 0, W, 3, 'F')
  doc.setFontSize(20)
  doc.setTextColor(...COLORS.deepCharcoal)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 20, 20)

  // Subtle brand mark
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.textMuted)
  doc.text('IMPLEMENT AI', W - 20, 20, { align: 'right' })
}

function addPageNumbers(doc) {
  const total = doc.internal.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    const W = doc.internal.pageSize.getWidth()
    const H = doc.internal.pageSize.getHeight()
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.textMuted)
    doc.text(`${i} / ${total}`, W / 2, H - 6, { align: 'center' })
  }
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [107, 48, 255]
}
