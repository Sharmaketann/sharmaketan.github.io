import { PORTFOLIO_CONFIG } from "@/data/portfolio.config";

export default function CvPage() {
  return (
    <div className="flex-1 min-h-0 -mx-4 md:mx-0 -mb-5">
      <iframe
        src={`${PORTFOLIO_CONFIG.resume}#toolbar=1&navpanes=0&view=FitH`}
        title="Sharma Ketan — Resume"
        className="w-full h-full border-0 min-h-[80vh]"
      />
    </div>
  );
}
