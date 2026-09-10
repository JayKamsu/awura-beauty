import { Document, Page, Text, View, StyleSheet, renderToBuffer, Link } from "@react-pdf/renderer";
import type { DiagnosticContentBlock, DiagnosticRecord } from "@/lib/domain/diagnostic";
import { isSafeHttpUrl } from "@/lib/domain/diagnostic";

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 44,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#2a2018",
  },
  brand: {
    fontSize: 10,
    color: "#9a7b4f",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    marginBottom: 4,
  },
  date: {
    fontSize: 9,
    color: "#8a7f70",
    marginBottom: 20,
  },
  heading: {
    fontSize: 14,
    marginTop: 18,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 12,
    marginTop: 12,
    marginBottom: 6,
  },
  paragraph: {
    marginBottom: 8,
    lineHeight: 1.5,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 4,
  },
  bullet: {
    width: 12,
  },
  listItemText: {
    flex: 1,
    lineHeight: 1.4,
  },
  link: {
    marginBottom: 8,
    color: "#9a7b4f",
    textDecoration: "underline",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    fontSize: 8,
    color: "#b0a58f",
    textAlign: "center",
  },
});

function ContentBlock({ block, index }: { block: DiagnosticContentBlock; index: number }) {
  if (block.type === "heading") {
    return <Text style={styles.heading}>{block.text}</Text>;
  }
  if (block.type === "subheading") {
    return <Text style={styles.subheading}>{block.text}</Text>;
  }
  if (block.type === "paragraph") {
    return <Text style={styles.paragraph}>{block.text}</Text>;
  }
  if (block.type === "list") {
    return (
      <View>
        {block.items.map((item, i) => (
          <View key={i} style={styles.listItem}>
            <Text style={styles.bullet}>{block.ordered ? `${i + 1}.` : "•"}</Text>
            <Text style={styles.listItemText}>{item}</Text>
          </View>
        ))}
      </View>
    );
  }
  if (block.type === "link") {
    if (!isSafeHttpUrl(block.url)) {
      return block.text ? (
        <Text key={index} style={styles.paragraph}>
          {block.text}
        </Text>
      ) : null;
    }
    return (
      <Link key={index} src={block.url} style={styles.link}>
        {block.text || block.url}
      </Link>
    );
  }
  return null;
}

/** Génère le PDF du bilan diagnostic (contenu riche rédigé par l'admin, mis en forme). */
export async function renderDiagnosticResultPdf(
  diagnostic: DiagnosticRecord,
): Promise<Buffer> {
  const { profile } = diagnostic;
  const blocks = profile.content?.length
    ? profile.content
    : ([{ type: "paragraph", text: profile.detailedFeedback || profile.summary || "" }] as DiagnosticContentBlock[]);

  const formattedDate = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
  }).format(new Date(diagnostic.created_at));

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>AWURA BEAUTY</Text>
        <Text style={styles.title}>{profile.title || "Bilan de diagnostic capillaire"}</Text>
        <Text style={styles.date}>{formattedDate}</Text>

        {profile.scalpAnalysis ? (
          <>
            <Text style={styles.heading}>Analyse cuir chevelu</Text>
            <Text style={styles.paragraph}>{profile.scalpAnalysis}</Text>
          </>
        ) : null}

        {blocks.map((block, index) => (
          <ContentBlock key={index} block={block} index={index} />
        ))}

        <Text style={styles.footer} fixed>
          Awura Beauty — awurabeauty.com
        </Text>
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
