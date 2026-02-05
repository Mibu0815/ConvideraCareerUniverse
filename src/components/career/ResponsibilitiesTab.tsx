// components/career/ResponsibilitiesTab.tsx
import { CheckCircle2, ArrowRight } from 'lucide-react';

export const ResponsibilitiesTab = ({ responsibilities }: { responsibilities: string[] }) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-convidera-blue/10 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-convidera-blue" />
        </div>
        <h3 className="text-lg font-semibold text-convidera-dark">
          Neue Verantwortlichkeiten
        </h3>
      </div>

      <div className="grid gap-3">
        {responsibilities.map((resp, index) => (
          <div
            key={index}
            className="group flex items-start gap-4 p-4 bg-white/50 backdrop-blur-sm border border-white/20 rounded-xl hover:border-convidera-blue/30 transition-all hover:shadow-sm"
          >
            <div className="mt-1">
              <ArrowRight className="w-4 h-4 text-convidera-blue/40 group-hover:text-convidera-blue transition-colors" />
            </div>
            <p className="text-convidera-dark/80 text-sm leading-relaxed">
              {resp}
            </p>
          </div>
        ))}
      </div>

      {responsibilities.length === 0 && (
        <p className="text-center py-10 text-convidera-dark/40 italic">
          Keine spezifischen Verantwortlichkeiten für diese Rolle hinterlegt.
        </p>
      )}
    </div>
  );
};
