import type { DiagnosticContentBlock } from "@/lib/domain/diagnostic";

type DiagnosticContentBlocksProps = {
  blocks: DiagnosticContentBlock[];
};

/** Rendu du contenu riche (titres, paragraphes, listes, liens) du bilan rédigé par l'admin. */
export function DiagnosticContentBlocks({ blocks }: DiagnosticContentBlocksProps) {
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h4 key={index} className="font-serif text-lg text-primary">
              {block.text}
            </h4>
          );
        }
        if (block.type === "subheading") {
          return (
            <h5 key={index} className="font-medium text-primary">
              {block.text}
            </h5>
          );
        }
        if (block.type === "paragraph") {
          return (
            <p key={index} className="whitespace-pre-wrap text-sm text-muted">
              {block.text}
            </p>
          );
        }
        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag
              key={index}
              className={`space-y-1.5 pl-5 text-sm text-muted ${
                block.ordered ? "list-decimal" : "list-disc"
              }`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ListTag>
          );
        }
        if (block.type === "link") {
          return (
            <p key={index} className="text-sm">
              <a
                href={block.url}
                target="_blank"
                rel="noreferrer"
                className="text-accent underline-offset-2 hover:underline"
              >
                {block.text || block.url}
              </a>
            </p>
          );
        }
        return null;
      })}
    </div>
  );
}
