import { PORTFOLIO_CONFIG } from "@/data/portfolio.config";

function getDocId(url: string): string | null {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export default function CvPage() {
  const docId = getDocId(PORTFOLIO_CONFIG.resume);
  const previewUrl = docId
    ? `https://docs.google.com/document/d/${docId}/preview`
    : PORTFOLIO_CONFIG.resume;

  return (
    <div className="flex-1 min-h-0 -mx-4 md:mx-0 -mb-5">
      <iframe
        src={previewUrl}
        title="Sharma Ketan — Resume"
        className="w-full h-full border-0 min-h-[80vh]"
      />
    </div>
  );
}
