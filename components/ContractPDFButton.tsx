'use client'

import { usePDF, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: 'Times-Roman',
    fontSize: 11,
    paddingTop: 48,
    paddingBottom: 56,
    paddingLeft: 60,
    paddingRight: 60,
    color: '#1a1a1a',
    lineHeight: 1.7,
  },
  header: {
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: '#C9A84C',
    borderBottomStyle: 'solid',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Times-Roman',
    marginBottom: 4,
  },
  ref: {
    fontSize: 9,
    color: '#C9A84C',
    fontFamily: 'Courier',
    letterSpacing: 1,
  },
  sectionHeading: {
    fontSize: 9,
    fontFamily: 'Courier',
    textTransform: 'uppercase',
    color: '#1B4353',
    letterSpacing: 1.5,
    marginTop: 18,
    marginBottom: 5,
    paddingBottom: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1B435344',
    borderBottomStyle: 'solid',
  },
  paragraph: {
    fontSize: 10.5,
    lineHeight: 1.8,
    marginBottom: 4,
    color: '#1a1a1a',
  },
  bold: {
    fontFamily: 'Times-Bold',
  },
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 60,
    right: 60,
    textAlign: 'center',
    fontSize: 8,
    color: '#aaa',
    fontFamily: 'Courier',
    borderTopWidth: 0.5,
    borderTopColor: '#ddd',
    borderTopStyle: 'solid',
    paddingTop: 6,
  },
  sigBlock: {
    flexDirection: 'row',
    gap: 40,
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0d9d0',
    borderTopStyle: 'solid',
  },
  sigCol: {
    flex: 1,
  },
  sigLabel: {
    fontSize: 8,
    fontFamily: 'Courier',
    textTransform: 'uppercase',
    color: '#999',
    letterSpacing: 1,
    marginBottom: 4,
  },
  sigName: {
    fontSize: 10,
    color: '#555',
    marginBottom: 16,
  },
  sigLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#555',
    borderBottomStyle: 'solid',
    height: 32,
    marginBottom: 4,
  },
  sigDateLine: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#aaa',
    borderBottomStyle: 'solid',
    height: 16,
    width: 100,
  },
})

interface ContractPDFDocProps {
  text: string
  reference: string
  contactName: string
  clientName: string
}

function ContractPDFDoc({ text, reference, contactName, clientName }: ContractPDFDocProps) {
  // Parse lines into typed elements
  const elements = text.split('\n').map((line, i) => {
    const trimmed = line.trim()
    if (!trimmed) return { type: 'space', content: '', key: i }
    if (trimmed.startsWith('## ')) return { type: 'heading', content: trimmed.slice(3), key: i }
    if (trimmed.startsWith('# ')) return { type: 'h1', content: trimmed.slice(2), key: i }
    if (trimmed.startsWith('---')) return { type: 'hr', content: '', key: i }
    return { type: 'para', content: trimmed, key: i }
  })

  // Inline bold parser: split on **text**
  const renderInline = (content: string) => {
    const parts = content.split(/(\*\*[^*]+\*\*)/)
    if (parts.length === 1) return <Text>{content}</Text>
    return (
      <Text>
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <Text key={i} style={pdfStyles.bold}>{part.slice(2, -2)}</Text>
          }
          return <Text key={i}>{part}</Text>
        })}
      </Text>
    )
  }

  return (
    <Document>
      <Page size="LETTER" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.title}>Lease Agreement</Text>
          <Text style={pdfStyles.ref}>{reference}</Text>
        </View>

        {/* Body */}
        {elements.map(el => {
          if (el.type === 'space') return <View key={el.key} style={{ height: 4 }} />
          if (el.type === 'hr') return <View key={el.key} style={{ borderBottomWidth: 0.5, borderBottomColor: '#ccc', borderBottomStyle: 'solid', marginVertical: 8 }} />
          if (el.type === 'h1') return <Text key={el.key} style={{ ...pdfStyles.sectionHeading, fontSize: 11 }}>{el.content}</Text>
          if (el.type === 'heading') return <Text key={el.key} style={pdfStyles.sectionHeading}>{el.content}</Text>
          return (
            <Text key={el.key} style={pdfStyles.paragraph}>
              {renderInline(el.content)}
            </Text>
          )
        })}

        {/* Signature block */}
        <View style={pdfStyles.sigBlock}>
          <View style={pdfStyles.sigCol}>
            <Text style={pdfStyles.sigLabel}>Tenant Signature</Text>
            <Text style={pdfStyles.sigName}>{contactName} · {clientName}</Text>
            <View style={pdfStyles.sigLine} />
            <Text style={{ fontSize: 8, color: '#aaa', marginBottom: 6 }}>Signature</Text>
            <View style={pdfStyles.sigDateLine} />
            <Text style={{ fontSize: 8, color: '#aaa' }}>Date</Text>
          </View>
          <View style={pdfStyles.sigCol}>
            <Text style={pdfStyles.sigLabel}>Landlord Signature</Text>
            <Text style={pdfStyles.sigName}>Austin Neill · Elias Range Stays</Text>
            <View style={pdfStyles.sigLine} />
            <Text style={{ fontSize: 8, color: '#aaa', marginBottom: 6 }}>Signature</Text>
            <View style={pdfStyles.sigDateLine} />
            <Text style={{ fontSize: 8, color: '#aaa' }}>Date</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={pdfStyles.footer}>
          <Text>{reference} · Elias Range Stays · eliasrangestays.ca · Confidential</Text>
        </View>
      </Page>
    </Document>
  )
}

interface Props {
  contractText: string
  reference: string
  contactName: string
  clientName: string
  btnStyle?: React.CSSProperties
}

export default function ContractPDFButton({ contractText, reference, contactName, clientName, btnStyle }: Props) {
  const fileName = `${reference.replace(/[^A-Z0-9-]/gi, '_')}_Lease_Agreement.pdf`

  const [instance] = usePDF({
    document: (
      <ContractPDFDoc
        text={contractText}
        reference={reference}
        contactName={contactName}
        clientName={clientName}
      />
    ),
  })

  if (instance.loading) {
    return <button style={{ ...btnStyle, opacity: 0.5 }} disabled>Preparing PDF…</button>
  }
  if (instance.error || !instance.url) {
    return <button style={{ ...btnStyle, opacity: 0.4 }} disabled>PDF unavailable</button>
  }

  return (
    <a href={instance.url} download={fileName} style={{ textDecoration: 'none' }}>
      <button style={btnStyle}>↓ Download PDF</button>
    </a>
  )
}
